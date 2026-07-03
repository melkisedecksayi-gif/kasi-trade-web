import React, { useState, useEffect } from 'react';

const POS = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    if (currentShop?.id) {
      fetchProducts();
    }
  }, [currentShop]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.stock) return item;
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const total = getTotal();
      const profit = cart.reduce((sum, item) => 
        sum + ((item.sell_price - item.buy_price) * item.quantity), 0
      );

      // Save transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          shop_id: currentShop.id,
          total_amount: total,
          profit: profit,
          payment_method: paymentMethod,
          items_count: cart.reduce((sum, item) => sum + item.quantity, 0)
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
      }

      alert(lang === 'sw' ? 'Mauzo yamefanikiwa!' : 'Sale completed!');
      setCart([]);
      setShowCheckout(false);
      fetchProducts();
    } catch (err) {
      console.error('Checkout error:', err);
      alert(lang === 'sw' ? 'Hitilafu imetokea' : 'Error occurred');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: theme.bg }}>
      <h2 style={{ color: theme.text, marginBottom: '20px' }}>
        {lang === 'sw' ? 'Point of Sale' : 'Point of Sale'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Products Section */}
        <div>
          <input
            type="text"
            placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              background: theme.cardBg,
              color: theme.text,
              marginBottom: '20px'
            }}
          />

          {loading ? (
            <p style={{ color: theme.textMuted }}>Loading...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: product.stock > 0 ? 1 : 0.5,
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <h4 style={{ margin: '0 0 8px', color: theme.text, fontSize: '14px' }}>{product.name}</h4>
                  <p style={{ margin: '0 0 8px', color: '#6366f1', fontWeight: 'bold' }}>
                    TSh {product.sell_price?.toLocaleString()}
                  </p>
                  <div style={{
                    padding: '4px 8px',
                    background: product.stock < 10 ? '#fee2e2' : '#d1fae5',
                    color: product.stock < 10 ? '#dc2626' : '#059669',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    {product.stock} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ color: theme.text, marginBottom: '16px' }}>
            {lang === 'sw' ? 'Kikapu' : 'Cart'} ({cart.length})
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: theme.textMuted, textAlign: 'center', padding: '40px 0' }}>
              {lang === 'sw' ? 'Hakuna bidhaa kwenye kikapu' : 'Cart is empty'}
            </p>
          ) : (
            <>
              <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.text, fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
                      <div style={{ color: theme.textMuted, fontSize: '12px' }}>
                        TSh {item.sell_price?.toLocaleString()} x {item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: `1px solid ${theme.border}`,
                          background: theme.cardBg,
                          color: theme.text,
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span style={{ color: theme.text, minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: `1px solid ${theme.border}`,
                          background: theme.cardBg,
                          color: theme.text,
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `2px solid ${theme.border}`, paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: theme.text, fontWeight: 'bold' }}>Jumla:</span>
                  <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '20px' }}>
                    TSh {getTotal().toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {lang === 'sw' ? 'Lipa Sasa' : 'Checkout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>
              {lang === 'sw' ? 'Chagua Njia ya Malipo' : 'Select Payment Method'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              {['cash', 'mobile', 'card'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    margin: '8px 0',
                    border: `2px solid ${paymentMethod === method ? '#6366f1' : theme.border}`,
                    background: paymentMethod === method ? 'rgba(99, 102, 241, 0.1)' : theme.cardBg,
                    color: theme.text,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {method === 'cash' && '💵 '}
                  {method === 'mobile' && '📱 '}
                  {method === 'card' && '💳 '}
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCheckout(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: theme.cardBg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={handleCheckout}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {lang === 'sw' ? 'Thibitisha' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;