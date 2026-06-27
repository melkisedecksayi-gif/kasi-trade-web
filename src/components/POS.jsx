import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';

const POS = ({ lang, supabase, currentShop }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Zote');
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [categories, setCategories] = useState(['Zote']);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) {
        setProducts(data);
        const uniqueCats = [...new Set(data.map(p => p.category))];
        setCategories(['Zote', ...uniqueCats]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [currentShop, supabase]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Zote' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product) => {
    if (product.stock <= 0) { alert(`⚠️ "${product.name}" imeisha!`); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { alert(`️ Huwezi kuongeza! Stock iliyobaki ni ${product.stock} tu.`); return prev; }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) { alert(`⚠️ Stock iliyobaki ni ${item.stock} tu!`); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const total = cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const processPayment = async () => {
    if (!currentShop?.id) return;
    const transactionData = { shop_id: currentShop.id, customer_name: 'Walk-in Customer', total_amount: total, payment_method: paymentMethod, items_count: cart.reduce((sum, item) => sum + item.quantity, 0), profit: cart.reduce((sum, item) => sum + ((item.sell_price - item.buy_price) * item.quantity), 0) };
    const { data, error } = await supabase.from('transactions').insert([transactionData]).select().single();
    
    if (!error && data) {
      for (const item of cart) { await supabase.from('products').update({ stock: item.stock - item.quantity }).eq('id', item.id); }
      const { data: updatedProducts } = await supabase.from('products').select('*').eq('shop_id', currentShop.id);
      if (updatedProducts) { setProducts(updatedProducts); setCategories(['Zote', ...new Set(updatedProducts.map(p => p.category))]); }
      setShowPaymentModal(false); setShowSuccess(true); setCart([]);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '20px', position: 'relative', zIndex: 10 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search size={20} /></span>
            <input type="text" placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 48px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', background: selectedCategory === cat ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#f1f5f9', color: selectedCategory === cat ? '#fff' : '#64748b', transition: 'all 0.2s' }}>{cat}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Icons.Clock size={32} style={{marginBottom: '10px'}}/> {lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div> : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><Icons.Box size={48} style={{marginBottom: '10px'}}/><p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock < 10;
                return (
                  <div key={product.id} onClick={() => !isOutOfStock && addToCart(product)} style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: isOutOfStock ? '1px solid #fee2e2' : '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.6 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.2s', position: 'relative' }}
                    onMouseEnter={(e) => { if (!isOutOfStock) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.15)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                    {isLowStock && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>Low</span>}
                    {isOutOfStock && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>Imeisha</span>}
                    <div style={{ fontSize: '32px', marginBottom: '12px', background: '#f8fafc', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{product.emoji || <Icons.Box size={24} />}</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.3' }}>{product.name}</h4>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>{product.category}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#6366f1' }}>{formatCurrency(product.sell_price)}</span>
                      <span style={{ fontSize: '11px', color: isLowStock ? '#d97706' : isOutOfStock ? '#dc2626' : '#10b981', fontWeight: '600' }}>{product.stock} {lang === 'sw' ? 'zipo' : 'left'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '380px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icons.ShoppingCart size={24} color="#0f172a" />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Kikapu' : 'Cart'}</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{cart.length} {lang === 'sw' ? 'bidhaa' : 'items'}</p>
            </div>
          </div>
          <button onClick={() => setCart([])} style={{ background: '#fee2e2', border: 'none', padding: '6px 12px', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Trash size={14} /> {lang === 'sw' ? 'Futa' : 'Clear'}</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Icons.ShoppingCart size={50} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>{lang === 'sw' ? 'Kikapu ni tupu' : 'Cart is empty'}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ fontSize: '20px', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.emoji || <Icons.Box size={18} />}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2' }}>{item.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>{formatCurrency(item.sell_price)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#ef4444' }}>-</button>
                  <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#10b981' }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginLeft: '8px', color: '#cbd5e1' }}><Icons.Trash size={16} /></button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '12px', borderTop: '2px dashed #cbd5e1' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Jumla' : 'Total'}</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#6366f1' }}>{formatCurrency(total)}</span>
          </div>
          <button onClick={() => cart.length > 0 && setShowPaymentModal(true)} disabled={cart.length === 0} style={{ width: '100%', padding: '14px', background: cart.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', boxShadow: cart.length > 0 ? '0 8px 20px rgba(99, 102, 241, 0.4)' : 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Icons.Card size={18} /> {lang === 'sw' ? 'Lipa Sasa' : 'Pay Now'}
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Icons.Card size={24} color="#6366f1" /> {lang === 'sw' ? 'Malipo' : 'Payment'}</h2>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Chagua njia ya malipo' : 'Select payment method'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[{ id: 'cash', label: lang === 'sw' ? 'Fedha' : 'Cash', icon: Icons.Cash }, { id: 'mobile', label: 'Mobile Money', icon: Icons.Mobile }, { id: 'card', label: lang === 'sw' ? 'Kadi' : 'Card', icon: Icons.Card }].map(method => (
                <button key={method.id} onClick={() => setPaymentMethod(method.id)} style={{ padding: '16px 8px', borderRadius: '12px', border: `2px solid ${paymentMethod === method.id ? '#6366f1' : '#e2e8f0'}`, background: paymentMethod === method.id ? '#f0f7ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  <method.icon size={24} color={paymentMethod === method.id ? '#6366f1' : '#64748b'} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: paymentMethod === method.id ? '#6366f1' : '#64748b' }}>{method.label}</span>
                </button>
              ))}
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>{lang === 'sw' ? 'Kiasi' : 'Amount'}</p>
              <p style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(total)}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#64748b' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
              <button onClick={processPayment} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Icons.Check size={18} /> {lang === 'sw' ? 'Maliza' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', background: '#10b981', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideIn 0.3s ease' }}>
          <Icons.CheckCircle size={24} />
          <div>
            <p style={{ margin: 0, fontWeight: '700' }}>{lang === 'sw' ? 'Mauzo Yamekamilika!' : 'Sale Completed!'}</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.9 }}>{lang === 'sw' ? 'Stock imesasishwa' : 'Stock updated'}</p>
          </div>
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
};

export default POS;