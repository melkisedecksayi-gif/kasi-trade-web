// UUID ya kudumu kwa SMS za kiotomatiki.
// Shop + aina ya SMS + tarehe + mpokeaji = key ileile.

export const createDeterministicSmsRequestKey = async ({
  shopId,
  kind,
  date,
  recipient = ''
}) => {
  const payload = JSON.stringify({
    shopId,
    kind,
    date,
    recipient
  });

  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  const bytes = new Uint8Array(digest).slice(0, 16);

  // UUID version 8 na RFC variant.
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
};