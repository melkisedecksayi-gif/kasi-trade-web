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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getTotalProfit = () => {
    return cart.reduce((sum, item) => sum + ((item.sell_price - item.buy_price) * item.quantity), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', { 
      style: 'currency', 
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setSaving(true);

    const total = getTotal();
    const totalProfit = getTotalProfit();
    const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Tengeneza items array kwa JSON
    const itemsArray = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.sell_price,
      name: item.name
    }));

    const transactionData = {
      shop_id: currentShop.id,
      total_amount: total,
      payment_method: paymentMethod,
      items_count: itemsCount,
      profit: totalProfit,
      customer_name: 'Walk-in Customer',
      items: itemsArray,
      created_at: new Date().toISOString()
    };

    try {
      console.log('Saving transaction:', transactionData);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('Transaction error:', error);
        throw error;
      }

      console.log('Transaction saved:', data);

      // Update stock kwa kila bidhaa
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
      }

      alert(lang === 'sw' ? '✅ Mauzo yamefanikiwa!' : '✅ Sale completed!');
      setCart([]);
      setShowPaymentModal(false);
      
      // Refresh products
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id);
      
      if (updatedProducts) setProducts(updatedProducts);
    } catch (err) {
      console.error('Checkout error:', err);
      alert(lang === 'sw' ? '❌ Hitilafu: ' + err.message : '❌ Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      gap: '20px',
      height: isMobile ? 'auto' : 'calc(100vh - 200px)'
    }}>
      {/* LEFT: Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          background: isDarkMode ? '#1e293b' : '#fff',
          padding: isMobile ? '16px' : '20px',
          borderRadius: '12px',
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}>
          <div style={{ position: 'relative' }}>
            <Icons.Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: isDarkMode ? '#334155' : '#fff',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: isMobile ? '400px' : 'none' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              {lang === 'sw' ? 'Inapakia...' : 'Loading...'}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              <Icons.Box size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? '12px' : '16px'
            }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: isDarkMode ? '#1e293b' : '#fff',
                    padding: isMobile ? '12px' : '16px',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: product.stock > 0 ? 1 : 0.5,
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: isMobile ? '32px' : '40px', marginBottom: '8px' }}>
                    {product.emoji || ''}
                  </div>
                  <h4 style={{ 
                    margin: '0 0 8px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.name}
                  </h4>
                  <p style={{ margin: '0 0 8px', fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#6366f1' }}>
                    {formatCurrency(product.sell_price)}
                  </p>
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: product.stock < 10 ? '#fee2e2' : '#d1fae5',
                    color: product.stock < 10 ? '#dc2626' : '#059669',
                    fontWeight: '600'
                  }}>
                    {product.stock} {lang === 'sw' ? 'zimebaki' : 'left'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div style={{ 
        width: isMobile ? '100%' : '400px',
        background: isDarkMode ? '#1e293b' : '#fff',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isMobile ? '500px' : 'none'
      }}>
        <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
          <h3 style={{ 
            margin: 0,
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icons.ShoppingCart size={24} />
            {lang === 'sw' ? 'Kikapu' : 'Cart'} ({cart.length})
          </h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              <Icons.ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '14px' }}>
                {lang === 'sw' ? 'Kikapu ni tupu' : 'Cart is empty'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: isDarkMode ? '#334155' : '#f8fafc',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '28px' }}>{item.emoji || '📦'}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                      {item.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6366f1', fontWeight: '600' }}>
                      {formatCurrency(item.sell_price)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                      background: isDarkMode ? '#475569' : '#e2e8f0',
                      color: isDarkMode ? '#f1f5f9' : '#0f172a',
                      cursor: 'pointer', fontWeight: '700', fontSize: '16px'
                    }}>-</button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                      background: '#6366f1', color: '#fff',
                      cursor: 'pointer', fontWeight: '700', fontSize: '16px'
                    }}>+</button>
                    <button onClick={() => removeFromCart(item.id)} style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                      background: '#ef4444', color: '#fff',
                      cursor: 'pointer', marginLeft: '4px'
                    }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: isMobile ? '16px' : '20px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              {lang === 'sw' ? 'Jumla:' : 'Total:'}
            </span>
            <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', color: '#6366f1' }}>
              {formatCurrency(getTotal())}
            </span>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              padding: isMobile ? '14px' : '16px',
              background: cart.length > 0 ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: isMobile ? '15px' : '16px',
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: isDarkMode ? '#1e293b' : '#fff',
            borderRadius: '16px',
            padding: isMobile ? '24px' : '32px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              margin: '0 0 24px',
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
              textAlign: 'center'
            }}>
              {lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}
            </h2>

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
                    border: `2px solid ${paymentMethod === method.id ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`,
                    background: paymentMethod === method.id ? (isDarkMode ? '#334155' : '#f0f7ff') : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>

            <div style={{ 
              background: isDarkMode ? '#334155' : '#f8fafc',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
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
                  background: isDarkMode ? '#334155' : '#f1f5f9',
                  color: isDarkMode ? '#f1f5f9' : '#475569',
                  border: 'none',
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