import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import ReceiptTemplates from './ReceiptTemplates';

const LOW_STOCK_THRESHOLD = 5;
const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, userId, theme }) => {
  const isDark = theme === 'dark';
  const t = translations[lang].sales;
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  const bg = isDark ? '#1e293b' : '#ffffff';
  const cardBg = isDark ? '#0f172a' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const btnBg = isDark ? '#334155' : '#f1f5f9';

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { if (active) setError(translations[lang].sales.saveError + err.message); }
    };
    fetchProducts();
    return () => { active = false; };
  }, [supabase, userId, lang]);

  const addToCart = (product) => {
    if (!product?.id) return;
    const stock = product.stock_quantity || 0;
    if (stock <= 0) { showNotification(`❌ ${product.name} imeisha stock!`, 'error'); return; }
    if (stock < LOW_STOCK_THRESHOLD) showNotification(`⚠️ ${product.name} ina stock chache (${stock})!`, 'warning');
    const price = product.selling_price || product.price || 0;
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        if (exists.qty + 1 > stock) { showNotification(`⚠️ Stock haiitoshi! Inapatikana: ${stock}`, 'warning'); return prev.map(i => i.id === product.id ? { ...i, qty: stock } : i); }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, price: Number(price), stock_limit: stock }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        if (newQty > i.stock_limit) { showNotification(`⚠️ Stock haiitoshi!`, 'warning'); return { ...i, qty: i.stock_limit }; }
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const totalAmount = cart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  const handleCheckout = async () => {
    if (!cart.length) return showNotification('Kikapu kipo tupu!', 'warning');
    if (!supabase || !userId) return showNotification('Database haiko tayari.', 'error');
    const stockIssues = cart.filter(item => item.qty > item.stock_limit);
    if (stockIssues.length > 0) { showNotification(`❌ Bidhaa ${stockIssues.length} zina stock isiyotosha.`, 'error'); return; }
    setLoading(true); setError('');
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      const { error: dbErr } = await supabase.from('sales').insert({ user_id: userId, items: cart.map(({ stock_limit, ...rest }) => rest), total_amount: totalAmount, payment_method: paymentMethod, receipt_number: recNo, created_at: new Date().toISOString() });
      if (dbErr) throw dbErr;
      for (const item of cart) await supabase.from('products').update({ stock_quantity: item.stock_limit - item.qty }).eq('id', item.id).eq('user_id', userId);
      setLastSale({ items: [...cart], total: totalAmount, receipt: recNo, date: new Date(), method: paymentMethod });
      setShowReceipt(true); setCart([]);
      showNotification('✅ Mauzo yamehifadhiwa!', 'success');
    } catch (err) { setError(t.saveError + err.message); showNotification(`❌ ${err.message}`, 'error'); }
    finally { setLoading(false); }
  };

  const filtered = products.filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', height: 'calc(100vh - 100px)', padding: '10px' }}>
      {notification && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', background: notification.type === 'error' ? (isDark ? '#451a1a' : '#fef2f2') : notification.type === 'warning' ? (isDark ? '#451a03' : '#fff7ed') : (isDark ? '#14532d' : '#f0fdf4'), color: notification.type === 'error' ? '#f87171' : notification.type === 'warning' ? '#fb923c' : '#4ade80', border: `1px solid ${notification.type === 'error' ? (isDark ? '#7f1d1d' : '#fecaca') : notification.type === 'warning' ? (isDark ? '#7c2d12' : '#fed7aa') : (isDark ? '#166534' : '#bbf7d0')}`, fontWeight: '500', fontSize: '14px', maxWidth: '90vw' }}>
          {notification.message}
        </div>
      )}
      {error && <div style={{ width: '100%', padding: '12px', background: isDark ? '#451a1a' : '#fef2f2', color: '#f87171', borderRadius: '8px', marginBottom: '10px', textAlign: 'center' }}>{error}<button onClick={()=>window.location.reload()} style={{ marginLeft:'10px', textDecoration:'underline', background:'none', border:'none', color:'#f87171', cursor:'pointer' }}>🔄 Refresh</button></div>}
      
      <div style={{ flex: '2 1 400px', background: bg, borderRadius: '12px', padding: '20px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto', border: `1px solid ${border}` }}>
        <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        {products.length === 0 ? <p style={{ textAlign: 'center', color: textSec, marginTop: '40px' }}>{t.noProducts}</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {filtered.map(p => {
              const displayPrice = p.selling_price || p.price || 0;
              const stock = p.stock_quantity || 0;
              const isOut = stock <= 0;
              const isLow = stock > 0 && stock < LOW_STOCK_THRESHOLD;
              const stockColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';
              const stockLabel = isOut ? 'IMEISHA' : isLow ? `CHACHE (${stock})` : `${stock} PO`;
              return (
                <button key={p.id} onClick={() => !isOut && addToCart(p)} disabled={isOut} style={{ background: cardBg, border: `1px solid ${isOut ? '#7f1d1d' : border}`, borderRadius: '8px', padding: '12px', cursor: isOut ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: isOut ? 0.6 : 1, transition: '0.2s' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: textMain }}>{p.name}</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: displayPrice > 0 ? '#4ade80' : '#f87171' }}>{fmt(displayPrice)} TSh</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: stockColor, background: `${stockColor}20`, padding: '2px 8px', borderRadius: '12px' }}>{stockLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 300px', background: bg, borderRadius: '12px', padding: '20px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', border: `1px solid ${border}` }}>
        <h3 style={{ margin: '0 0 15px', color: textMain }}>{t.cart} ({cart.length})</h3>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
          {cart.length === 0 ? <p style={{ color: textSec, textAlign: 'center', marginTop: '40px' }}>{t.emptyCart}</p> : cart.map(i => {
            const isMaxed = i.qty >= i.stock_limit;
            return (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}`, background: isMaxed ? (isDark ? '#451a03' : '#fff7ed') : 'transparent', borderRadius: '6px', padding: '8px', marginBottom: '4px' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '500', color: textMain }}>{i.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: isMaxed ? '#fb923c' : textSec }}>
                    {fmt(i.price)} x {i.qty} / {i.stock_limit} = <strong>{fmt((i.price||0)*(i.qty||1))}</strong>
                    {isMaxed && ' ⚠️ STOCK IMEISHA'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQty(i.id, -1)} style={{ background: btnBg, color: textMain, border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: textMain }}>{i.qty}</span>
                  <button onClick={() => updateQty(i.id, 1)} disabled={isMaxed} style={{ background: btnBg, color: textMain, border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: isMaxed ? 'not-allowed' : 'pointer', opacity: isMaxed ? 0.5 : 1 }}>+</button>
                  <button onClick={() => removeFromCart(i.id)} style={{ background: isDark ? '#451a1a' : '#fef2f2', color: '#f87171', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: `2px solid ${border}`, paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}><span style={{ color: textMain }}>{t.grandTotal}</span><span style={{ color: '#4ade80' }}>{fmt(totalAmount)} TSh</span></div>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px', fontSize: '14px' }}>
            <option value="Cash">{t.cash}</option><option value="M-Pesa">{t.mpesa}</option><option value="Bank">{t.bank}</option>
          </select>
          <button onClick={handleCheckout} disabled={loading || !cart.length} style={{ width: '100%', padding: '14px', background: loading || !cart.length ? '#475569' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading || !cart.length ? 'not-allowed' : 'pointer' }}>{loading ? t.processing : t.checkout}</button>
        </div>
      </div>

      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReceipt(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#fff', padding: '25px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: `2px solid ${isDark ? '#334155' : '#3b82f6'}` }}>
              <h2 style={{ margin: '0 0 5px', color: textMain, fontSize: '20px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: '12px', color: textSec }}>{t.receipt.subtitle}<br />📞 +255 622 995 734</p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px', color: textMain, fontSize: '16px' }}>{t.receipt.title}</h3>
              <p style={{ margin: '0', fontSize: '11px', color: textSec }}>{t.receipt.date}: {lastSale.date.toLocaleString()}<br/>{t.receipt.number}: #{lastSale.receipt}</p>
            </div>
            <hr style={{ border: `1px dashed ${border}`, margin: '15px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
              <thead><tr style={{ borderBottom: `2px solid ${textMain}` }}><th style={{ textAlign: 'left', padding: '5px 0', color: textMain }}>{t.receipt.item}</th><th style={{ textAlign: 'center', padding: '5px 0', color: textMain }}>{t.receipt.quantity}</th><th style={{ textAlign: 'right', padding: '5px 0', color: textMain }}>{t.receipt.subtotal}</th></tr></thead>
              <tbody>{lastSale.items.map((i, idx) => (<tr key={idx}><td style={{ padding: '6px 0', borderBottom: `1px solid ${border}`, color: textSec }}>{i.name || '-'}</td><td style={{ textAlign: 'center', padding: '6px 0', borderBottom: `1px solid ${border}`, color: textSec }}>{i.qty || 1}</td><td style={{ textAlign: 'right', padding: '6px 0', borderBottom: `1px solid ${border}`, color: textMain }}>{fmt((i.price||0)*(i.qty||1))}</td></tr>))}</tbody>
            </table>
            <hr style={{ border: `1px dashed ${border}`, margin: '15px 0' }} />
            <div style={{ background: isDark ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}><span style={{ color: textMain }}>{t.receipt.grandTotal}</span><span style={{ color: '#4ade80', fontSize: '18px' }}>{fmt(lastSale.total)} TSh</span></div>
            </div>
            <p style={{ fontSize: '12px', color: textSec, margin: '0 0 15px', textAlign: 'center' }}>{t.receipt.payment}: <strong>{lastSale.method}</strong></p>
            
            <button onClick={() => { setShowReceipt(false); setShowReceiptSettings(true); }} className="btn-micro" style={{ width: '100%', padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              🎨 {lang === 'sw' ? 'Badilisha Muundo wa Risiti' : 'Customize Receipt'}
            </button>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{t.receipt.print}</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: '12px', background: btnBg, color: textMain, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{t.receipt.close}</button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: textSec, borderTop: `1px solid ${border}`, paddingTop: '15px' }}>
              <p style={{ margin: '0 0 5px' }}>{t.receipt.thankYou}</p>
              <p style={{ margin: '0' }}>{t.receipt.support}: +255 622 995 734 | +255 613 808 727</p>
              <p style={{ margin: '5px 0 0', fontSize: '10px' }}>{t.receipt.copyright}</p>
            </div>
          </div>
        </div>
      )}

      <ReceiptTemplates isOpen={showReceiptSettings} onClose={() => setShowReceiptSettings(false)} receiptData={lastSale} lang={lang} />
    </div>
  );
};

export default Sales;