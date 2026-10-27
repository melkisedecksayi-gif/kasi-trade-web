// Shop-scoped SMS preferences. Missing row means OFF; database failures throw.
export async function readSaleReceiptSmsEnabled(supabase, shopId) {
  if (!shopId) return false;
  const { data, error } = await supabase
    .from('shop_sms_preferences')
    .select('sale_receipts_enabled')
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error) throw error;
  return data?.sale_receipts_enabled === true;
}

export async function saveSaleReceiptSmsEnabled(supabase, shopId, enabled) {
  if (!shopId) throw new Error('Shop ID is required');
  const { data, error } = await supabase
    .from('shop_sms_preferences')
    .upsert({ shop_id: shopId, sale_receipts_enabled: enabled === true }, { onConflict: 'shop_id' })
    .select('sale_receipts_enabled')
    .single();
  if (error) throw error;
  return data?.sale_receipts_enabled === true;
}
