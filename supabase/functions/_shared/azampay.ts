// AzamPay (aggregator) — Tanzania MNO checkout
//
// Endpoints (zimethibitishwa kwenye SDK/nyaraka za AzamPay):
//   Token:    POST {AUTH}/AppRegistration/GenerateToken   { appName, clientId, clientSecret }
//             -> { data: { accessToken }, success }
//   Checkout: POST {CHECKOUT}/azampay/mno/checkout        (Authorization: Bearer <token>)
//             -> { success, transactionId, message }
//
// Sandbox:    auth https://authenticator-sandbox.azampay.co.tz | checkout https://sandbox.azampay.co.tz
// Production: auth https://authenticator.azampay.co.tz         | checkout https://checkout.azampay.co.tz
// (Unaweza kubadili kwa AZAMPAY_AUTH_URL / AZAMPAY_CHECKOUT_URL kama AzamPay itakupa host tofauti.)

const IS_PRODUCTION = Deno.env.get("AZAMPAY_ENV") === "production";

export const AZAMPAY_ENV = IS_PRODUCTION ? "production" : "sandbox";

const AUTH_BASE = (Deno.env.get("AZAMPAY_AUTH_URL") ??
  (IS_PRODUCTION ? "https://authenticator.azampay.co.tz" : "https://authenticator-sandbox.azampay.co.tz"))
  .replace(/\/+$/, "");
const CHECKOUT_BASE = (Deno.env.get("AZAMPAY_CHECKOUT_URL") ??
  (IS_PRODUCTION ? "https://checkout.azampay.co.tz" : "https://sandbox.azampay.co.tz"))
  .replace(/\/+$/, "");

const CLIENT_ID = Deno.env.get("AZAMPAY_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("AZAMPAY_CLIENT_SECRET") ?? "";
const APP_NAME = Deno.env.get("AZAMPAY_APP_NAME") ?? "";

export const azampayClientId = CLIENT_ID;

// Hitilafu ya credentials/usanidi — HAKUNA ombi la malipo lililotumwa bado.
export class AzamPayAuthError extends Error {}

export function azampayConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && APP_NAME);
}

let cachedToken: { token: string; at: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000;

export async function getAccessToken(force = false): Promise<string> {
  if (!azampayConfigured()) {
    throw new AzamPayAuthError("AZAMPAY_CLIENT_ID / AZAMPAY_CLIENT_SECRET / AZAMPAY_APP_NAME hazijawekwa");
  }
  if (!force && cachedToken && Date.now() - cachedToken.at < TOKEN_TTL_MS) {
    return cachedToken.token;
  }

  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/AppRegistration/GenerateToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appName: APP_NAME, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
    });
  } catch (e) {
    throw new AzamPayAuthError(`AzamPay auth haipatikani: ${String(e)}`);
  }
  const body = await res.json().catch(() => ({}));
  const token = body?.data?.accessToken;
  if (!res.ok || !token) {
    // Usiandike mwili mzima (unaweza kuwa na taarifa nyeti) — status na ujumbe tu.
    // 423 = credentials si sahihi / secret imeisha muda.
    throw new AzamPayAuthError(
      `AzamPay GenerateToken imeshindwa (HTTP ${res.status}): ${String(body?.message ?? "").slice(0, 200)}`,
    );
  }
  cachedToken = { token: String(token), at: Date.now() };
  return cachedToken.token;
}

export type CheckoutResult = {
  ok: boolean;
  httpStatus: number;
  transactionId: string | null;
  message: string | null;
  body: Record<string, unknown>;
};

// USSD/STK push kwa wallet ya mteja. Mteja anaidhinisha kwenye simu;
// matokeo ya mwisho huja kupitia callback (azampay-callback).
export async function mnoCheckout(input: {
  accountNumber: string; // 2557XXXXXXXX
  amount: number;
  externalId: string; // lazima iwe ya kipekee kwa kila muamala
  provider: "Mpesa" | "Airtel" | "Tigo" | "Halopesa" | "Azampesa";
  description?: string;
}): Promise<CheckoutResult> {
  const payload = JSON.stringify({
    accountNumber: input.accountNumber,
    amount: String(input.amount),
    currency: "TZS",
    externalId: input.externalId,
    provider: input.provider,
    additionalProperties: { description: input.description ?? "Duka POS Subscription" },
  });

  const send = async (force: boolean) => {
    const token = await getAccessToken(force);
    return await fetch(`${CHECKOUT_BASE}/azampay/mno/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: payload,
    });
  };

  let res = await send(false);
  // Token imeisha muda → pata mpya na jaribu MARA MOJA (externalId ile ile, AzamPay hu-dedupe)
  if (res.status === 401) res = await send(true);

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const transactionId = body.transactionId ?? (body.data as Record<string, unknown> | undefined)?.transactionId;
  return {
    ok: res.ok && body.success !== false,
    httpStatus: res.status,
    transactionId: transactionId ? String(transactionId) : null,
    message: body.message ? String(body.message) : null,
    body,
  };
}
