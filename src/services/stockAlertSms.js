import { sendSMS } from './smsService';
import logger from '../utils/logger';

// SMS ya tahadhari ya stock. HAIJAWAHI kuitwa kiotomatiki (si useEffect wala interval):
// inaitwa tu mtumiaji anapobonyeza kitufe cha "Tuma SMS ya Stock" kwenye Dashboard.

const getSmsSettings = () => {
  try {
    const saved = localStorage.getItem('app_smsSettings');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

// Inarudisha { success, reason?, count?, error? }
// reason: 'no_shop' | 'no_low_stock' | 'no_phone' | 'send_failed' | 'error'
export const sendLowStockAlertSms = async ({ supabase, currentShop, lang = 'sw', requestKey, resolveRequestKey }) => {
  if (!currentShop?.id) return { success: false, reason: 'no_shop' };

  try {
    const threshold = getSmsSettings().low_stock_threshold || 10;

    const { data: lowProducts, error: prodErr } = await supabase
      .from('products')
      .select('name, stock')
      .eq('shop_id', currentShop.id)
      .lt('stock', threshold)
      .order('stock', { ascending: true })
      .limit(10);
    if (prodErr) throw prodErr;
    if (!lowProducts?.length) return { success: false, reason: 'no_low_stock' };

    let phone = currentShop.phone || '';
    if (!phone && currentShop.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', currentShop.owner_id)
        .maybeSingle();
      phone = profile?.phone || '';
    }
    if (!phone) return { success: false, reason: 'no_phone' };

    const shopName = currentShop.shop_name || 'KasiTRADE';
    const productList = lowProducts.map((p) => `${p.name} (${p.stock})`).join(', ');
    const message = lang === 'sw'
      ? `TAHADHARI STOCK\n\nBidhaa zifuatazo ziko chini ya ${threshold}:\n${productList}\n\n${shopName}`
      : `LOW STOCK ALERT\n\nProducts below ${threshold}:\n${productList}\n\n${shopName}`;

    const resolvedRequestKey =
  typeof resolveRequestKey === 'function'
    ? resolveRequestKey({ to: phone, message })
    : requestKey;

const result = await sendSMS({
  shopId: currentShop.id, purpose: "stock_alert",
  to: phone,
  message,
  requestKey: resolvedRequestKey
});
    if (!result.success) {
      return { success: false, reason: 'send_failed', error: result.error };
    }

    await supabase.from('sms_logs').insert({
      shop_id: currentShop.id,
      recipient: phone,
      message,
      type: 'low_stock',
      status: 'sent',
      provider_response: JSON.stringify(result.data ?? {}).slice(0, 500),
    });
    return { success: true, count: lowProducts.length };
  } catch (e) {
    logger.warn('stockAlertSms', 'Low stock SMS error:', e);
    return { success: false, reason: 'error', error: e.message };
  }
};
