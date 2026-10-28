/**
 * KasiTrade POS — OFFLINE SMS concurrency/idempotency tests.
 * Place this file at PROJECT ROOT, next to package.json.
 * Run from project root (PowerShell):
 * deno test --no-config --no-lock --allow-read --allow-write .\sms-idempotency-concurrency.test.ts
 *
 * NO real Supabase connection, NO real Meseji request, NO secrets.
 * Tests execute the Edge Function body from supabase/functions/send-sms/index.ts
 * with in-memory fakes for its two external imports, environment, and fetch.
 */
import { pathToFileURL } from "node:url";

const sourcePath = new URL("./supabase/functions/send-sms/index.ts", import.meta.url);
const source = await Deno.readTextFile(sourcePath);

// Replace only external dependencies + Deno.serve registration; preserve the handler's actual logic.
const import1 = /^import \{ createClient, type SupabaseClient \} from [^\r\n]+;\r?\n/m;
const import2 = /^import \{ corsHeaders, json, normalizeTzPhone \} from [^\r\n]+;\r?\n/m;
const start = "Deno.serve(async (req) => {";
if (!import1.test(source) || !import2.test(source) || !source.includes(start) ||
    !/\}\);\s*$/.test(source)) {
  throw new Error("Edge Function structure changed; STOP and update mocks (no tests executed).");
}

const mockPrelude = `
type SupabaseClient = any;
let hooks: any = null;
export const setMocks = (next: any) => { hooks = next; };
const createClient = (...args: any[]) => hooks.createClient(...args);
const fetch = (...args: any[]) => hooks.fetch(...args);
const corsHeaders = { "Access-Control-Allow-Origin": "*" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" }
});
const normalizeTzPhone = (value: string) => {
  const digits = value.replace(/\\D/g, "");
  return /^255[67]\\d{8}$/.test(digits) ? digits : null;
};
const fakeEnv = (_key: string) => "OFFLINE_MOCK_ONLY";
`;
const transformed = mockPrelude + source
  .replace(import1, "")
  .replace(import2, "")
  .replaceAll("Deno.env.get(", "fakeEnv(")
  .replace(start, "export const handleRequest = async (req: Request): Promise<Response> => {")
  .replace(/\}\);\s*$/, "};\n");

const temporary = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(temporary, transformed);
const handlerModule = await import(pathToFileURL(temporary).href);
const handleRequest: (req: Request) => Promise<Response> = handlerModule.handleRequest;
const setMocks: (arg: unknown) => void = handlerModule.setMocks;

// Only the behavior used by the submitted Edge Function is implemented here.
// Unique-key insertion is atomic within this in-memory fake.
type Row = Record<string, unknown>;
type Filter = { op: "eq" | "gte" | "lt"; field: string; value: unknown };
class FakeSupabase {
  readonly sms = new Map<string, Row>();
  readonly attempts: Row[] = [];
  pausePrecheck: (() => Promise<void>) | null = null;
  reservationError = false;
  attemptError = false;
  auth = { getUser: async (_token: string) => ({ data: { user: { id: "mock-user-id" } } }) };

  from(table: string) {
    const db = this;
    function query(run: (filters: Filter[]) => Promise<unknown>) {
      const filters: Filter[] = [];
      const builder = {
        eq(field: string, value: unknown) { filters.push({ op: "eq", field, value }); return builder; },
        gte(field: string, value: unknown) { filters.push({ op: "gte", field, value }); return builder; },
        lt(field: string, value: unknown) { filters.push({ op: "lt", field, value }); return builder; },
        maybeSingle() { return run(filters); },
        then(resolve: (value: unknown) => unknown, reject?: (err: unknown) => unknown) {
          return run(filters).then(resolve, reject);
        },
      };
      return builder;
    }
    function filtered(filters: Filter[]) {
      const records = table === "sms_idempotency" ? [...db.sms.values()] : db.attempts;
      return records.filter((row) => filters.every((f) => {
        const v = row[f.field];
        if (f.op === "eq") return v === f.value;
        if (f.op === "gte") return String(v) >= String(f.value);
        return String(v) < String(f.value);
      }));
    }
    return {
      select(columns: string, opts?: { count?: string; head?: boolean }) {
        return query(async (filters) => {
          const selected = filtered(filters);
          const snapshot = selected.length ? { ...selected[0] } : null;
          // Force two simultaneous first-look reads to both see "not found".
          if (table === "sms_idempotency" && columns.startsWith("status") && db.pausePrecheck) {
            await db.pausePrecheck();
          }
          if (opts?.head) return { count: selected.length, error: null };
          if (!snapshot) return { data: null, error: null };
          const fields = columns.split(",").map((s) => s.trim());
          return { data: Object.fromEntries(fields.map((f) => [f, snapshot[f]])), error: null };
        });
      },
      async insert(row: Row) {
        if (table === "sms_send_attempts") {
          if (db.attemptError) return { error: { code: "MOCK_ATTEMPT_FAIL" } };
          db.attempts.push({ ...row, id: db.attempts.length + 1, created_at: new Date().toISOString() });
          return { error: null };
        }
        if (table === "sms_idempotency") {
          if (db.reservationError) return { error: { code: "MOCK_DB_DOWN" } };
          const key = String(row.request_key);
          if (db.sms.has(key)) return { error: { code: "23505" } };
          db.sms.set(key, { ...row });
          return { error: null };
        }
        throw new Error(`Unexpected insert into ${table}`);
      },
      update(values: Row) {
        return query(async (filters) => {
          for (const row of filtered(filters)) Object.assign(row, values);
          return { error: null };
        });
      },
      delete() {
        return query(async (_filters) => ({ error: null }));
      },
    };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const KEY = "123e4567-e89b-42d3-a456-426614174000";
const basic = { kind: "custom", to: "255712345678", message: "Jaribio la KasiTrade", request_key: KEY };
function request(body: Record<string, unknown>) {
  return new Request("https://test.invalid/functions/v1/send-sms", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer offline-test-token" },
    body: JSON.stringify(body),
  });
}
function setup(db = new FakeSupabase(), provider: () => Promise<Response> = async () =>
  new Response(JSON.stringify({ id: "mock-accepted" }), { status: 200 })) {
  let providerCalls = 0;
  setMocks({
    createClient: () => db,
    fetch: async (_url: string, _opts: unknown) => {
      providerCalls++;
      return await provider();
    },
  });
  return { db, calls: () => providerCalls };
}
function rendezvous(needed: number) {
  let arrivals = 0;
  let release!: () => void;
  const untilAll = new Promise<void>((resolve) => { release = resolve; });
  return async () => {
    if (++arrivals === needed) release();
    await untilAll;
  };
}

Deno.test("SIMULTANEOUS: same UUID, exactly ONE provider request", async () => {
  const { db, calls } = setup();
  db.pausePrecheck = rendezvous(2);
  const [a, b] = await Promise.all([handleRequest(request(basic)), handleRequest(request(basic))]);
  const statuses = [a.status, b.status].sort((x, y) => x - y);
  assert(statuses[0] === 200 && statuses[1] === 409, `Expected 200,409; got ${statuses}`);
  assert(calls() === 1, `Provider called ${calls()} times (must be 1)`);
  assert(db.sms.get(KEY)?.status === "sent", "Expected status sent");
});

Deno.test("REPLAY: same key after success is blocked without new rate-limit attempt", async () => {
  const { db, calls } = setup();
  assert((await handleRequest(request(basic))).status === 200, "First call should succeed");
  const before = db.attempts.length;
  const response = await handleRequest(request(basic));
  assert(response.status === 409, `Replay should be 409; got ${response.status}`);
  assert(calls() === 1 && db.attempts.length === before, "Replay generated cost / rate-limit attempt");
});

Deno.test("SAME KEY / DIFFERENT MESSAGE: request is blocked", async () => {
  const { calls } = setup();
  assert((await handleRequest(request(basic))).status === 200, "First call should succeed");
  const response = await handleRequest(request({ ...basic, message: "Different SMS" }));
  assert(response.status === 409 && calls() === 1, "Key was incorrectly reused");
  const result = await response.json();
  assert(result.error === "request_key imetumika kwa SMS tofauti", "Payload mismatch must be reported");
});

Deno.test("MISSING REQUEST KEY: fail closed before provider", async () => {
  const { calls } = setup();
  const { request_key: _unused, ...withoutKey } = basic;
  const response = await handleRequest(request(withoutKey));
  assert(response.status === 400 && calls() === 0, "Missing UUID was not rejected");
});

Deno.test("RESERVATION DB ERROR: fail closed before provider", async () => {
  const db = new FakeSupabase();
  db.reservationError = true;
  const { calls } = setup(db);
  const response = await handleRequest(request(basic));
  assert(response.status === 503 && calls() === 0, "Provider called despite reservation failure");
});

Deno.test("PROVIDER TIMEOUT: state UNKNOWN and replay cannot send twice", async () => {
  const { db, calls } = setup(new FakeSupabase(), async () => {
    throw new DOMException("Mock timeout", "TimeoutError");
  });
  const response = await handleRequest(request(basic));
  assert(response.status === 502, `Expected 502, got ${response.status}`);
  assert(db.sms.get(KEY)?.status === "unknown", "Timeout should mark state unknown");
  const again = await handleRequest(request(basic));
  assert(again.status === 409 && calls() === 1, "Replay re-contacted provider after timeout");
});

Deno.test("RATE-LIMIT RECORD FAILURE: fail closed", async () => {
  const db = new FakeSupabase();
  db.attemptError = true;
  const { calls } = setup(db);
  const response = await handleRequest(request(basic));
  assert(response.status === 503 && calls() === 0, "Provider called despite rate limit log failure");
});

// Optional cleanup: the generated file contains ONLY test-stubbed imports and mocks.
// Deno auto-removes the OS temp directory contents eventually; remove explicitly here.
Deno.test("CLEANUP generated offline handler", async () => {
  await Deno.remove(temporary);
});
