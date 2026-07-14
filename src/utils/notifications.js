export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
};

export const sendNotification = (title, options = {}) => {
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  return new Notification(title, {
    icon: '/Logo.png',
    badge: '/Logo.png',
    body: options.body || '',
    ...options,
  });
};

export const checkLowStock = async (supabase, currentShop) => {
  if (!currentShop?.id) return [];
  const { data } = await supabase
    .from('products')
    .select('name, stock')
    .eq('shop_id', currentShop.id)
    .lt('stock', 5)
    .gt('stock', -1)
    .order('stock', { ascending: true });
  return data || [];
};

export const notifyLowStock = (lowStockItems, lang = 'sw') => {
  if (!lowStockItems.length) return;
  const count = lowStockItems.length;
  const title = lang === 'sw'
    ? `${count} bidhaa zina hesabu chini!`
    : `${count} products low on stock!`;
  const body = lowStockItems.slice(0, 3).map(p => `${p.name}: ${p.stock}`).join(', ');
  sendNotification(title, { body, tag: 'low-stock', requireInteraction: true });
};
