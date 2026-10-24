// Safe checkout helper for KasiTrade POS.

export const newCheckoutRequestId = () => {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (typeof window.crypto?.getRandomValues !== 'function') {
    throw new Error('Secure checkout IDs are not available. Use HTTPS.');
  }

  window.crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return [...bytes].map((byte, index) =>
    `${[4, 6, 8, 10].includes(index) ? '-' : ''}${byte.toString(16).padStart(2, '0')}`
  ).join('');
};

export async function checkoutWithStock({
  supabase,
  shopId,
  cart,
  discount,
  paymentMethod,
  requestId,
}) {
  if (!shopId || !requestId || !Array.isArray(cart) || cart.length === 0) {
    throw new Error('A shop and at least one cart item are required.');
  }

  const { data, error } = await supabase.rpc('checkout_sale', {
    p_shop_id: shopId,
    p_request_id: requestId,
    p_items: cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      expected_unit_price: item.sell_price,
    })),
    p_discount: discount,
    p_payment_method: paymentMethod,
  });

  if (error) throw error;

  if (!data?.transaction_id || !Array.isArray(data.items)) {
    throw new Error('Checkout confirmation was incomplete. Retry without changing the cart.');
  }

  return data;
}
