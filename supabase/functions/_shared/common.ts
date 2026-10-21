// Vitu vya pamoja kwa functions za malipo (hakuna kitu cha mtoa huduma hapa)

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

// Bei ya usajili ni ya SERVER pekee — usiwahi kuamini kiasi kutoka kwa client.
export const SUBSCRIPTION_AMOUNT = Number(Deno.env.get("SUBSCRIPTION_AMOUNT") ?? "12000");
export const SUBSCRIPTION_DAYS = 30;

// Mitandao ya wallet inayokubaliwa na AzamPay (thamani halisi za `provider` kwenye mno/checkout)
export const AZAMPAY_NETWORKS = ["Mpesa", "Airtel", "Tigo", "Halopesa", "Azampesa"] as const;
export type AzamPayNetwork = typeof AZAMPAY_NETWORKS[number];

export function parseNetwork(raw: unknown): AzamPayNetwork | null {
  const v = String(raw ?? "").trim().toLowerCase();
  return AZAMPAY_NETWORKS.find((n) => n.toLowerCase() === v) ?? null;
}

// 0712345678 / 712345678 / 255712345678 → 255712345678
export function normalizeTzPhone(raw: string): string | null {
  const digits = String(raw || "").replace(/[\s\-()]/g, "");
  if (/^255\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `255${digits.slice(1)}`;
  if (/^[67]\d{8}$/.test(digits)) return `255${digits}`;
  return null;
}
// Ulinganisho usiovuja muda (constant-time)
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
