// Vodacom M-Pesa Tanzania Open API (SAND box / production)
// Si Safaricom Daraja — TZ inatumia openapi.m-pesa.com
import { publicEncrypt, constants } from "node:crypto";

const BASE_HOST = "openapi.m-pesa.com";
const SANDBOX_PATH = "/sandbox/ipg/v2/vodafoneGHA/";
const LIVE_PATH = "/openapi/ipg/v2/vodafoneGHA/";

const env = Deno.env.get("VODACOM_ENV") === "production" ? "production" : "sandbox";
const basePath = env === "production" ? LIVE_PATH : SANDBOX_PATH;

const apiKey = Deno.env.get("VODACOM_API_KEY") ?? "";
const publicKeyPem = Deno.env.get("VODACOM_PUBLIC_KEY") ?? "";
export const shortcode = Deno.env.get("VODACOM_SHORTCODE") ?? "";
export const mpesaAmount = Number(Deno.env.get("MPESA_AMOUNT") ?? "12000");

let cachedSession: { id: string; at: number } | null = null;
const SESSION_TTL_MS = 50 * 60 * 1000;

export function stripBearer(token: string): string {
  return token.replace(/^Bearer\s+/i, "").trim();
}

export function encryptApiKey(): string {
  const pem = publicKeyPem.includes("BEGIN")
    ? publicKeyPem
    : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;
  return publicEncrypt(
    {
      key: pem,
      padding: constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(apiKey, "utf8"),
  ).toString("base64");
}

export async function getSessionId(force = false): Promise<string> {
  if (!force && cachedSession && Date.now() - cachedSession.at < SESSION_TTL_MS) {
    return cachedSession.id;
  }
  const res = await fetch(`https://${BASE_HOST}${basePath}getSession/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${encryptApiKey()}`,
      Origin: "*",
    },
  });
  const body = await res.json().catch(() => ({}));
  const sessionId = body.output_SessionID ?? body.SessionID;
  if (!sessionId) {
    throw new Error(`Vodacom getSession imeshindwa: ${JSON.stringify(body)}`);
  }
  cachedSession = { id: String(sessionId), at: Date.now() };
  return cachedSession.id;
}

async function vodacomFetch(path: string, method: "GET" | "POST", params: Record<string, string>, useSession = true, force = false) {
  const session = useSession ? await getSessionId(force) : encryptApiKey();
  const url = new URL(`https://${BASE_HOST}${basePath}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${session}`,
      Origin: "*",
    },
  });
  const body = await res.json().catch(() => ({}));
  // Session mpya inahitajika kama imekua expired
  if (useSession && (res.status === 401 || body.output_ResponseCode === "INS-6")) {
    return vodacomFetch(path, method, params, useSession, true);
  }
  return body;
}

export type C2BResult = {
  output_ResponseCode?: string;
  output_ResponseDesc?: string;
  ConversationID?: string;
  TransactionID?: string;
  ThirdPartyConversationID?: string;
};

export async function c2bSingleStage(input: {
  amount: number;
  customerMsisdn: string;
  thirdPartyConversationId: string;
  transactionReference: string;
  description: string;
}): Promise<C2BResult> {
  return await vodacomFetch("c2bPayment/singleStage/", "POST", {
    input_Amount: String(input.amount),
    input_Country: "TZA",
    input_Currency: "TZS",
    input_CustomerMSISDN: input.customerMsisdn,
    input_ServiceProviderCode: shortcode,
    input_ThirdPartyConversationID: input.thirdPartyConversationId,
    input_TransactionReference: input.transactionReference,
    input_PurchasedItemsDesc: input.description,
  });
}

export type StatusResult = {
  output_ResponseCode?: string;
  output_ResponseDesc?: string;
  output_ResponseTransactionStatus?: string;
  ConversationID?: string;
  TransactionID?: string;
};

export async function queryTransactionStatus(input: {
  queryReference: string;
  thirdPartyConversationId: string;
}): Promise<StatusResult> {
  return await vodacomFetch("queryTransactionStatus/", "GET", {
    input_QueryReference: input.queryReference,
    input_ServiceProviderCode: shortcode,
    input_ThirdPartyConversationID: input.thirdPartyConversationId,
    input_Country: "TZA",
  });
}

export function normalizeTzPhone(raw: string): string | null {
  const digits = String(raw || "").replace(/[\s\-()]/g, "");
  if (/^255\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `255${digits.slice(1)}`;
  if (/^[78]\d{8}$/.test(digits)) return `255${digits}`;
  return null;
}

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
