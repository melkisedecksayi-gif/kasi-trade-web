import React, { useState, useEffect, useCallback, useRef } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import ReceiptTemplates from './ReceiptTemplates';
import Toast from './Toast';

const LOW_STOCK_THRESHOLD = 5;
const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, userId, theme, mode = 'cashier', session, searchTrigger }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang]?.sales || translations.sw.sales;
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [toast, setToast] = useState(null);
  const [optimisticCart, setOptimisticCart] = useState([]);

  const effectiveUserId = userId || session?.user?.id;
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') { window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }
  }, []);

  useEffect(() => { if (searchTrigger > 0 && searchInputRef.current) searchInputRef.current.focus(); }, [searchTrigger]);

  const showToast = useCallback((message, type = 'info') => { setToast({ message, type, id: Date.now() }); }, []);

  useEffect(() => {
    if (!supabase || !effectiveUserId) return;
    let active = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('user_id', effectiveUserId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { if (active) showToast(`❌ ${err.message}`, 'error'); }
    };
    fetchProducts();
    return () => { active = false; };
  }, [supabase, effectiveUserId, lang, showToast]);

  const addToCart = useCallback((product) => {
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    if (!product?.id) return;
    const stock = product.stock_quantity || 0;
    if (stock <= 0) { showToast(`${product.name} imeisha stock!`, 'error'); return; }
    if (stock < LOW_STOCK_THRESHOLD) showToast(`${product.name} ina stock chache (${stock})!`, 'warning');
    setOptimisticCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      const price = product.selling_price || product.price || 0;
      if (exists) {
        if (exists.qty + 1 > stock) { showToast(`Stock haiitoshi!`, 'warning'); return prev.map(i => i.id === product.id ? { ...i, qty: stock } : i); }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, price: Number(price), stock_limit: stock }];
    });
  }, [mode, showToast]);

  const updateQty = useCallback((id, delta) => {
    if (mode === 'admin') return;
    setOptimisticCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        if (newQty > i.stock_limit) { showToast(`Stock haiitoshi!`, 'warning'); return { ...i, qty: i.stock_limit }; }
        return { ...i, qty: newQty };
      }
      return i;
    }));
  }, [mode, showToast]);

  const removeFromCart = useCallback((id) => { if (mode === 'admin') return; setOptimisticCart(prev => prev.filter(i => i.id !== id)); }, [mode]);

  const totalAmount = optimisticCart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  const handleCheckout = async () => {
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    if (!optimisticCart.length) return showToast('Kikapu kipo tupu!', 'warning');
    if (!supabase || !effectiveUserId) return showToast('Database haiko tayari.', 'error');
    setLoading(true);
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      const { error: dbErr } = await supabase.from('sales').insert({ user_id: effectiveUserId, items: optimisticCart.map(({ stock_limit, ...rest }) => rest), total_amount: totalAmount, payment_method: paymentMethod, receipt_number: recNo, created_at: new Date().toISOString() });
      if (dbErr) throw dbErr;
      for (const item of optimisticCart) await supabase.from('products').update({ stock_quantity: item.stock_limit - item.qty }).eq('id', item.id).eq('user_id', effectiveUserId);
      setLastSale({ items: [...optimisticCart], total: totalAmount, receipt: recNo, date: new Date(), method: paymentMethod });
      setShowReceipt(true); setOptimisticCart([]);
      showToast('✅ Mauzo yamehifadhiwa!', 'success');
    } catch (err) { showToast(`❌ ${err.message}`, 'error'); } finally { setLoading(false); }
  };

  const filtered = products.filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));
  const inputStyle = { padding: '14px', fontSize: '16px', background: isDark ? 'rgba(30,41,59,0.5)' : '#ffffff', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '12px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', padding: isMobile ? '12px' : THEME.space.m, height: '100%', paddingBottom: isMobile ? '100px' : '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {mode === 'admin' && (
        <div className="glass" style={{ width: '100%', padding: '12px', background: 'rgba(254, 243, 199, 0.9)', color: '#92400e', borderRadius: '12px', marginBottom: '12px', textAlign: 'center', border: '1px solid #f59e0b', fontWeight: 'bold', fontSize: '13px' }}>
          👑 Hali ya Admin: Unaweza kutazama tu.
        </div>
      )}
      
      {/* Products Section */}
      <div style={{ flex: isMobile ? 'none' : '2', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.5 }}>🔍</span>
          <input ref={searchInputRef} type="text" placeholder={`${t.searchPlaceholder} (Ctrl+K)`} value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>
        <div className="glass shadow-premium" style={{ flex: 1, overflowY: 'auto', padding: '12px', minHeight: '300px', borderRadius: '16px', background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255,255,255,0.8)' }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div><p style={{ color: colors.text }}>{t.noProducts}</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {filtered.map(p => {
                const displayPrice = p.selling_price || p.price || 0;
                const stock = p.stock_quantity || 0;
                const isOut = stock <= 0;
                const stockColor = isOut ? '#ef4444' : stock < LOW_STOCK_THRESHOLD ? '#f59e0b' : '#10b981';
                return (
                  <button key={p.id} onClick={() => !isOut && addToCart(p)} disabled={isOut || mode === 'admin'} style={{ background: isDark ? 'rgba(30,41,59,0.8)' : '#ffffff', border: `1px solid ${isOut ? '#7f1d1d' : colors.border}`, borderRadius: '12px', padding: '10px', cursor: (isOut || mode === 'admin') ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: (isOut || mode === 'admin') ? 0.6 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: colors.text, wordBreak: 'break-word' }}>{p.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: displayPrice > 0 ? '#10b981' : '#ef4444' }}>{fmt(displayPrice)} TSh</span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: stockColor, background: `${stockColor}20`, padding: '2px 8px', borderRadius: '12px' }}>{isOut ? 'IMEISHA' : `${stock} PO`}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="glass shadow-premium" style={{ flex: isMobile ? 'none' : '1', width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', borderRadius: '16px', background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255,255,255,0.9)', marginBottom: isMobile ? '0' : '0' }}>
        <h3 style={{ margin: '0 0 12px', color: colors.text, fontSize: '17px' }}>🛒 {t.cart} ({optimisticCart.length})</h3>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', minHeight: '150px' }}>
          {optimisticCart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: colors.textSec }}><div style={{ fontSize: '36px', marginBottom: '10px' }}>🛒</div><p style={{ fontSize: '13px' }}>{t.emptyCart}</p></div>
          ) : optimisticCart.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, padding: '8px 0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>{i.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: colors.textSec }}>{fmt(i.price)} × {i.qty} = <strong style={{ color: '#10b981' }}>{fmt((i.price||0)*(i.qty||1))} TSh</strong></p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => updateQty(i.id, -1)} disabled={mode === 'admin'} style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '4px 8px', cursor: mode === 'admin' ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: colors.text }}>{i.qty}</span>
                <button onClick={() => updateQty(i.id, 1)} disabled={mode === 'admin'} style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '4px 8px', cursor: mode === 'admin' ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>+</button>
                <button onClick={() => removeFromCart(i.id)} disabled={mode === 'admin'} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: mode === 'admin' ? 'not-allowed' : 'pointer', fontSize: '16px' }}>️</button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Checkout Controls */}
        {!isMobile && (
          <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <span style={{ color: colors.text }}>{t.grandTotal}</span><span style={{ color: '#10b981' }}>{fmt(totalAmount)} TSh</span>
            </div>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} disabled={mode === 'admin'} style={{ width: '100%', padding: '12px', marginBottom: '10px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '16px' }}>
              <option value="Cash">{t.cash}</option><option value="M-Pesa">{t.mpesa}</option><option value="Bank">{t.bank}</option>
            </select>
            <button onClick={handleCheckout} disabled={loading || !optimisticCart.length || mode === 'admin'} className="btn-micro gradient-primary shadow-premium" style={{ width: '100%', padding: '16px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', opacity: (loading || !optimisticCart.length || mode === 'admin') ? 0.6 : 1 }}>
              {loading ? t.processing : t.checkout}
            </button>
          </div>
        )}
      </div>

      {/* ✅ STICKY MOBILE CHECKOUT BAR */}
      {isMobile && optimisticCart.length > 0 && (
        <div style={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)', padding: '16px', 
          borderTop: `1px solid ${colors.border}`, zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.textSec, fontSize: '14px' }}>Jumla:</span>
            <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>{fmt(totalAmount)} TSh</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ flex: 1, padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '14px' }}>
              <option value="Cash">Cash</option><option value="M-Pesa">M-Pesa</option><option value="Bank">Bank</option>
            </select>
            <button onClick={handleCheckout} disabled={loading} className="btn-micro gradient-primary shadow-premium" style={{ flex: 2, padding: '14px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>
              {loading ? 'Inachakata...' : 'Maliza'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowReceipt(false)}>
          <div className="glass" style={{ padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '320px', maxHeight: '90vh', overflowY: 'auto', background: isDark ? '#0f172a' : '#fff' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '18px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: '11px', color: colors.textSec }}> +255 622 995 734</p>
            </div>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: '12px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '12px' }}>
              <tbody>{lastSale.items.map((i, idx) => (<tr key={idx}><td style={{ padding: '4px 0', color: colors.text }}>{i.name}</td><td style={{ textAlign: 'right', padding: '4px 0', color: colors.text }}>{i.qty} x {fmt(i.price)}</td></tr>))}</tbody>
            </table>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '16px' }}><span>Jumla:</span><span style={{ color: '#10b981' }}>{fmt(lastSale.total)} TSh</span></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} className="btn-micro gradient-primary" style={{ flex: 1, padding: '12px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Chapisha</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Funga</button>
            </div>
          </div>
        </div>
      )}
      <ReceiptTemplates isOpen={showReceiptSettings} onClose={() => setShowReceiptSettings(false)} receiptData={lastSale} lang={lang} />
    </div>
  );
};

export default Sales;