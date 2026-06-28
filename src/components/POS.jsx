import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const POS = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [currentShop, supabase]);

  const filteredProducts = Array.isArray(products)
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(lang === 'sw' ? 'Bidhaa imeisha!' : 'Out of stock!');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(lang === 'sw' ? `Stock iliyobaki ni ${product.stock} tu` : `Only ${product.stock} left`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.stock) {
          alert(lang === 'sw' ? `Stock iliyobaki ni ${item.stock} tu` : `Only ${item.stock} left`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setSaving(true);
    const total = getTotal();

    const transactionData = {
      shop_id: currentShop.id,
      total_amount: total,
      payment_method: paymentMethod,
      items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
      }

      alert(lang === 'sw' ? '✅ Mauzo yamefanikiwa!' : '✅ Sale completed!');
      setCart([]);
      setShowPaymentModal(false);
      
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id);
      
      if (updatedProducts) setProducts(updatedProducts);
    } catch (err) {
      alert(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg = isDarkMode ? '#334155' : '#f8fafc';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: textColor, margin: '0 0 24px', fontSize: '24px', fontWeight: '700' }}>
        {lang === 'sw' ? 'Mauzo (POS)' : 'Point of Sale'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Products Section */}
        <div style={{ background: bgColor, padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          <input
            type="text"
            placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              fontSize: '14px',
              marginBottom: '16px',
              background: cardBg,
              color: textColor,
              boxSizing: 'border-box'
            }}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: subTextColor }}>
              <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: subTextColor }}>
              <Icons.Box size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: cardBg,
                    padding: '16px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: product.stock > 0 ? 1 : 0.5,
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{product.emoji || '📦'}</div>
                  <div style={{ color: textColor, fontSize: '13px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </div>
                  <div style={{ color: '#6366f1', fontSize: '14px', fontWeight: '700' }}>
                    {formatCurrency(product.sell_price)}
                  </div>
                  <div style={{ fontSize: '11px', color: subTextColor, marginTop: '4px' }}>
                    {product.stock} {lang === 'sw' ? 'zimebaki' : 'left'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div style={{ background: bgColor, padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: textColor, margin: '0 0 16px', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.ShoppingCart size={20} />
            {lang === 'sw' ? 'Kikapu' : 'Cart'} ({cart.length})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: subTextColor }}>
                <Icons.ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>{lang === 'sw' ? 'Kikapu ni tupu' : 'Cart is empty'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ background: cardBg, padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '24px' }}>{item.emoji || '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: textColor, fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                      <div style={{ color: '#6366f1', fontSize: '13px', fontWeight: '600' }}>{formatCurrency(item.sell_price)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: cardBg, color: textColor, cursor: 'pointer', fontWeight: '700' }}>-</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', color: textColor, fontWeight: '600' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: textColor, fontSize: '16px', fontWeight: '600' }}>{lang === 'sw' ? 'Jumla:' : 'Total:'}</span>
              <span style={{ color: '#6366f1', fontSize: '24px', fontWeight: '800' }}>{formatCurrency(getTotal())}</span>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '16px',
                background: cart.length > 0 ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#cbd5e1',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Icons.Card size={20} />
              {lang === 'sw' ? 'Lipa Sasa' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: bgColor, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', border: `1px solid ${borderColor}` }}>
            <h3 style={{ color: textColor, margin: '0 0 24px', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { id: 'cash', label: lang === 'sw' ? 'Fedha Taslimu' : 'Cash', icon: '' },
                { id: 'mobile', label: 'Mobile Money', icon: '📱' },
                { id: 'card', label: lang === 'sw' ? 'Kadi' : 'Card', icon: '💳' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${paymentMethod === method.id ? '#6366f1' : borderColor}`,
                    background: paymentMethod === method.id ? (isDarkMode ? '#334155' : '#f0f7ff') : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: textColor
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>

            <div style={{ background: cardBg, padding: '16px', borderRadius: '10px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: subTextColor }}>
                {lang === 'sw' ? 'Jumla ya Kulipa' : 'Total Amount'}
              </p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#6366f1' }}>
                {formatCurrency(getTotal())}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: cardBg,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={handleCheckout}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (lang === 'sw' ? '⏳ Inahifadhi...' : '⏳ Saving...') : (lang === 'sw' ? '✅ Thibitisha' : '✅ Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;