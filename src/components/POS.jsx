import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import Toast from './Toast';

const POS = ({ lang, supabase, currentShop, isDarkMode, setToast }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories
  const categories = [
    { id: 'all', name: lang === 'sw' ? 'Zote' : 'All', icon: '📦' },
    { id: 'food', name: lang === 'sw' ? 'Vyakula' : 'Food', icon: '🍔' },
    { id: 'drinks', name: lang === 'sw' ? 'Vinywaji' : 'Drinks', icon: '🥤' },
    { id: 'electronics', name: lang === 'sw' ? 'Elektroniki' : 'Electronics', icon: '📱' },
    { id: 'clothing', name: lang === 'sw' ? 'Mavazi' : 'Clothing', icon: '👕' },
    { id: 'other', name: lang === 'sw' ? 'Mengineyo' : 'Other', icon: '🛍️' },
  ];

  // Fetch Products
  useEffect(() => {
    if (!currentShop?.id) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', currentShop.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error:', err);
        if (setToast) setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentShop, supabase]);

  // Filter Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add to Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      if (setToast) setToast({ message: lang === 'sw' ? 'Bidhaa imeisha!' : 'Out of stock!', type: 'error' });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        if (setToast) setToast({ message: lang === 'sw' ? `Stock iliyobaki ni ${product.stock} tu` : `Only ${product.stock} left`, type: 'error' });
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

  // Update Quantity
  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.stock) {
          if (setToast) setToast({ message: lang === 'sw' ? `Stock iliyobaki ni ${item.stock} tu` : `Only ${item.stock} left`, type: 'error' });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null));
  };

  // Remove from Cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Calculate Total
  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
  };

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setSaving(true);
    const total = getTotal();

    const transactionData = {
      shop_id: currentShop.id,
      total_amount: total,
      payment_method: paymentMethod,
      items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
      profit: cart.reduce((sum, item) => sum + ((item.sell_price - item.buy_price) * item.quantity), 0),
      created_at: new Date().toISOString()
    };

    try {
      // Insert transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      // Update stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
      }

      if (setToast) setToast({ message: lang === 'sw' ? '✅ Mauzo yamefanikiwa!' : '✅ Sale completed!', type: 'success' });
      
      setCart([]);
      setShowPaymentModal(false);

      // Refresh products
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id);

      if (updatedProducts) setProducts(updatedProducts);
    } catch (err) {
      if (setToast) setToast({ message: lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Theme
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: theme.bg }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: '800', color: theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.ShoppingCart size={24} /> {lang === 'sw' ? 'Mauzo (POS)' : 'Point of Sale'}
        </h2>

        {/* Search & Categories */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 16px',
              border: `2px solid ${theme.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              background: theme.cardBg,
              color: theme.text,
              outline: 'none'
            }}
          />
        </div>

        {/* Category Buttons */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '10px 16px',
                background: selectedCategory === cat.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : theme.cardBg,
                color: selectedCategory === cat.id ? '#fff' : theme.text,
                border: `2px solid ${selectedCategory === cat.id ? '#6366f1' : theme.border}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="pos-main-grid" style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 400px',
        gap: '20px'
      }}>
        {/* Products Section */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '16px',
          padding: '16px',
          border: `1px solid ${theme.border}`,
          maxHeight: 'calc(100vh - 250px)',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: theme.text }}>
            {lang === 'sw' ? 'Orodha ya Bidhaa' : 'Product List'} ({filteredProducts.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
              <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
              <Icons.Box size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products found'}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: theme.bg,
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: product.stock > 0 ? 1 : 0.5,
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{product.emoji || '📦'}</div>
                  <div style={{ color: theme.text, fontSize: '13px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </div>
                  <div style={{ color: '#6366f1', fontSize: '14px', fontWeight: '700' }}>
                    {formatCurrency(product.sell_price)}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>
                    {product.stock} {lang === 'sw' ? 'zimebaki' : 'left'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '16px',
          padding: '16px',
          border: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 250px)',
          position: 'sticky',
          top: '0'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.ShoppingCart size={20} />
            {lang === 'sw' ? 'Kikapu' : 'Cart'} ({cart.length})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                <Icons.ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>{lang === 'sw' ? 'Kikapu ni tupu' : 'Cart is empty'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    background: theme.bg,
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '24px' }}>{item.emoji || '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.text, fontSize: '14px', fontWeight: '600' }}>{item.name}</div>
                      <div style={{ color: '#6366f1', fontSize: '13px', fontWeight: '600' }}>{formatCurrency(item.sell_price)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: 'none', background: theme.cardBg, color: theme.text,
                        cursor: 'pointer', fontWeight: '700'
                      }}>-</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', color: theme.text, fontWeight: '600' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: 'none', background: '#6366f1', color: '#fff',
                        cursor: 'pointer', fontWeight: '700'
                      }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: 'none', background: '#ef4444', color: '#fff',
                        cursor: 'pointer'
                      }}>
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: theme.text, fontSize: '16px', fontWeight: '600' }}>{lang === 'sw' ? 'Jumla:' : 'Total:'}</span>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: theme.cardBg,
            padding: '32px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            border: `1px solid ${theme.border}`
          }}>
            <h3 style={{ color: theme.text, margin: '0 0 24px', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { id: 'cash', label: lang === 'sw' ? 'Fedha Taslimu' : 'Cash', icon: '💵' },
                { id: 'mobile', label: 'Mobile Money', icon: '📱' },
                { id: 'card', label: lang === 'sw' ? 'Kadi' : 'Card', icon: '💳' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${paymentMethod === method.id ? '#6366f1' : theme.border}`,
                    background: paymentMethod === method.id ? (isDarkMode ? '#334155' : '#f0f7ff') : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: theme.text
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>

            <div style={{ background: theme.bg, padding: '16px', borderRadius: '10px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: theme.textMuted }}>
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
                  background: theme.bg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
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

      {/* Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          .pos-main-grid {
            grid-template-columns: 1fr !important;
          }
          .pos-cart-box {
            max-height: 50vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default POS;