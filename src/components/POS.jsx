import React, { useState, useMemo } from 'react';

const POS = ({ lang, supabase, currentShop }) => {
  // --- STATE MANAGEMENT ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Zote');
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSuccess, setShowSuccess] = useState(false);

  // --- MOCK DATA (In production, fetch from Supabase based on currentShop.id) ---
  const categories = ['Zote', 'Vyakula', 'Vinywaji', 'Vipodozi', 'Elektroniki', 'Nyumbani'];
  
  const mockProducts = [
    { id: 1, name: 'Mchezo wa Darasa', category: 'Vyakula', price: 2500, stock: 45, emoji: '🍚' },
    { id: 2, name: 'Mafuta ya Kupikia 1L', category: 'Vyakula', price: 4500, stock: 20, emoji: '' },
    { id: 3, name: 'Sukari 1kg', category: 'Vyakula', price: 3000, stock: 5, emoji: '🧂' },
    { id: 4, name: 'Chai ya Lipton', category: 'Vyakula', price: 1500, stock: 30, emoji: '🍵' },
    { id: 5, name: 'Maji ya Mineral 500ml', category: 'Vinywaji', price: 1000, stock: 100, emoji: '💧' },
    { id: 6, name: 'Coca Cola 500ml', category: 'Vinywaji', price: 1500, stock: 40, emoji: '🥤' },
    { id: 7, name: 'Juisi ya Mango', category: 'Vinywaji', price: 2000, stock: 25, emoji: '🧃' },
    { id: 8, name: 'Sabuni ya Kufulia', category: 'Nyumbani', price: 2500, stock: 18, emoji: '' },
    { id: 9, name: 'Dawa ya Meno', category: 'Vipodozi', price: 3500, stock: 12, emoji: '' },
    { id: 10, name: 'Karatasi ya Chooni', category: 'Nyumbani', price: 1500, stock: 50, emoji: '' },
    { id: 11, name: 'Mkate wa White', category: 'Vyakula', price: 1500, stock: 8, emoji: '🍞' },
    { id: 12, name: 'Yai (Tray)', category: 'Vyakula', price: 8500, stock: 5, emoji: '🥚' },
  ];

  // --- LOGIC ---
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Zote' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Discount logic can be added later

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    // In production: Save transaction to Supabase here
    setShowPaymentModal(false);
    setShowSuccess(true);
    setCart([]);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '20px', position: 'relative', zIndex: 10 }}>
      
      {/* ================= LEFT PANEL: PRODUCTS ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        
        {/* Search & Categories */}
        <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>🔍</span>
            <input 
              type="text" 
              placeholder={lang === 'sw' ? 'Tafuta bidhaa, barcode, au SKU...' : 'Search products, barcode, or SKU...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 48px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                  color: selectedCategory === cat ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                  padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}
              >
                {/* ✅ ICON FIX: Uses emoji or defaults to 📦 */}
                <div style={{ fontSize: '40px', marginBottom: '12px', background: '#f8fafc', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.emoji || '📦'}
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1.3' }}>{product.name}</h4>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>{product.category}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#667eea' }}>{formatCurrency(product.price)}</span>
                  <span style={{ fontSize: '11px', color: product.stock < 10 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                    {product.stock} {lang === 'sw' ? 'zipo' : 'left'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
              <p>{lang === 'sw' ? 'Hakuna bidhaa zilizopatikana.' : 'No products found.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANEL: CART ================= */}
      <div style={{ 
        width: '380px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', 
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.5)', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' 
      }}>
        
        {/* Cart Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>🛒 {lang === 'sw' ? 'Kikapu' : 'Cart'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{cart.length} {lang === 'sw' ? 'bidhaa' : 'items'}</p>
          </div>
          <button 
            onClick={() => setCart([])}
            style={{ background: '#fee2e2', border: 'none', padding: '8px 12px', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            {lang === 'sw' ? 'Futa Yote' : 'Clear'}
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '50px', marginBottom: '10px', opacity: 0.5 }}>🛒</div>
              <p style={{ fontSize: '14px' }}>{lang === 'sw' ? 'Kikapu ni tupu. Bofya bidhaa kuanza.' : 'Cart is empty. Click products to start.'}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ fontSize: '24px', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.emoji || '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b', lineHeight: '1.2' }}>{item.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#667eea', fontWeight: '600' }}>{formatCurrency(item.price)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#ef4444' }}>-</button>
                  <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#10b981' }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginLeft: '8px', color: '#cbd5e1' }}>🗑️</button>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Actions */}
        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '12px', borderTop: '2px dashed #cbd5e1' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{lang === 'sw' ? 'Jumla Kubwa' : 'Total'}</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#667eea' }}>{formatCurrency(total)}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{
              width: '100%', padding: '16px', 
              background: cart.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', border: 'none', borderRadius: '12px', 
              fontSize: '16px', fontWeight: '700', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: cart.length > 0 ? '0 8px 20px rgba(102, 126, 234, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {lang === 'sw' ? '💳 Lipa Sasa' : '💳 Pay Now'}
          </button>
        </div>
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>💳 {lang === 'sw' ? 'Malipo' : 'Payment'}</h2>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Chagua njia ya malipo' : 'Select payment method'}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { id: 'cash', label: lang === 'sw' ? 'Fedha' : 'Cash', icon: '💵' },
                { id: 'mobile', label: 'Mobile Money', icon: '📱' },
                { id: 'card', label: lang === 'sw' ? 'Kadi' : 'Card', icon: '💳' }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '16px 8px', borderRadius: '12px', border: `2px solid ${paymentMethod === method.id ? '#667eea' : '#e2e8f0'}`,
                    background: paymentMethod === method.id ? '#f0f7ff' : '#fff', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: paymentMethod === method.id ? '#667eea' : '#64748b' }}>{method.label}</span>
                </button>
              ))}
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>{lang === 'sw' ? 'Kiasi cha Kulipa' : 'Amount to Pay'}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{formatCurrency(total)}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#64748b' }}>
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
              <button onClick={processPayment} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                ✅ {lang === 'sw' ? 'Maliza & Piga Risiti' : 'Complete & Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS TOAST ================= */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', background: '#10b981', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideIn 0.3s ease' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: '700' }}>{lang === 'sw' ? 'Mauzo Yamekamilika!' : 'Sale Completed!'}</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.9 }}>{lang === 'sw' ? 'Risiti imetolewa.' : 'Receipt printed.'}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default POS;