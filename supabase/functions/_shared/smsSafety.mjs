// @ts-check
// Provider HTTP 200 does not itself prove that Meseji accepted a message.
/** @returns {'accepted' | 'failed' | 'unknown'} */
export function classifyProviderResponse(httpOk, body) {
  /** @type {Record<string, any>} */
  const obj = body && typeof body === 'object' ? body : {};
  /** @type {Record<string, any>} */
  const nested = obj.data && typeof obj.data === 'object' ? obj.data : {};
  const status = String(obj.status ?? nested.status ?? '').toLowerCase();
  if (!httpOk) return 'unknown'; // 5xx or timeout may already have sent SMS
  if (obj.success === false || nested.success === false ||
      [obj.status, nested.status].some(x =>
        ['failed', 'error', 'rejected', 'invalid'].includes(String(x ?? '').toLowerCase()))) return 'failed';
  if (obj.success === true || nested.success === true ||
      ['success', 'accepted', 'queued', 'sent'].includes(status)) return 'accepted';
  return 'unknown'; // never treat an arbitrary 2xx as confirmed acceptance
}

// GSM-7 one-segment budget. Reject emoji/UCS-2 and >160 septets.
const GSM_BASIC = new Set(("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ " +
  "!\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà").split(''));
const GSM_EXTENSION = new Set('^{}\\[~]|€'.split(''));
export function singleSegmentGsm(message) {
  if (typeof message !== 'string' || !message.trim()) return false;
  let count = 0;
  for (const char of message) {
    if (GSM_BASIC.has(char)) count += 1;
    else if (GSM_EXTENSION.has(char)) count += 2;
    else return false;
    if (count > 160) return false;
  }
  return true;
}

// Only the explicitly supported authenticated categories are allowed.
export function validSmsKind(kind) {
  return kind === 'receipt' || kind === 'custom';
}
