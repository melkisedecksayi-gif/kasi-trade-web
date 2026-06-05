import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import ReceiptTemplates from './ReceiptTemplates';
import Toast from './Toast';

const LOW_STOCK_THRESHOLD = 5;
const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, shopId, theme }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang].sales;
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [optimisticCart, setOptimisticCart] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  // ✅ SOMA BIDHAA KWA KUTUMIA shopId
  useEffect(() => {
    if (!supabase || !shopId) return;
    let active = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { if (active) setError(translations[lang].sales.saveError + err.message); }
    };
    fetchProducts();
    return () => { active = false; };
  }, [supabase, shopId, lang]);

  const addToCart = useCallback((product) => {
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
  }, [showToast]);

  const updateQty = useCallback((id, delta) => {
    setOptimisticCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        if (newQty > i.stock_limit) { showToast(`Stock haiitoshi!`, 'warning'); return { ...i, qty: i.stock_limit }; }
        return { ...i, qty: newQty };
      }
      return i;
    }));
  }, [showToast]);

  const removeFromCart = useCallback((id) => {
    setOptimisticCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const totalAmount = optimisticCart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  const handleCheckout = async () => {
    if (!optimisticCart.length) return showToast('Kikapu kipo tupu!', 'warning');
    if (!supabase || !shopId) return showToast('Database haiko tayari.', 'error');
    
    const stockIssues = optimisticCart.filter(item => item.qty > item.stock_limit);
    if (stockIssues.length > 0) { showToast(`Bidhaa ${stockIssues.length} zina stock isiyotosha.`, 'error'); return; }
    
    setLoading(true); setError('');
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      
      // ✅ HIFADHI MAUZO CHINI YA shopId
      const { error: dbErr } = await supabase.from('sales').insert({ 
        shop_id: shopId, 
        items: optimisticCart.map(({ stock_limit, ...rest }) => rest), 
        total_amount: totalAmount, 
        payment_method: paymentMethod, 
        receipt_number: recNo, 
        created_at: new Date().toISOString() 
      });
      if (dbErr) throw dbErr;
      
      // ✅ PUNGUZA STOCK CHINI YA shopId
      for (const item of optimisticCart) {
        await supabase.from('products').update({ stock_quantity: item.stock_limit - item.qty }).eq('id', item.id).eq('shop_id', shopId);
      }
      
      setLastSale({ items: [...optimisticCart], total: totalAmount, receipt: recNo, date: new Date(), method: paymentMethod });
      setShowReceipt(true); 
      setOptimisticCart([]);
      showToast('✅ Mauzo yamehifadhiwa!', 'success');
    } catch (err) { 
      setError(t.saveError + err.message); 
      showToast(`❌ ${err.message}`, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const filtered = products.filter(p => 
    (p.name||'').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && String(p.barcode).includes(search))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0', height: '100%' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {error && <div style={{ padding: '16px', background: isDark ? '#451a1a' : '#fef2f2', color: THEME.colors.error, borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* SEARCH & PRODUCTS */}
        <div style={{ background: colors.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.border}` }}>
          <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px' }} />
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {products.length === 0 ? <p style={{ textAlign: 'center', color: colors.textSec, marginTop: '40px' }}>{t.noProducts}</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {filtered.map(p => {
                  const displayPrice = p.selling_price || p.price || 0;
                  const stock = p.stock_quantity || 0;
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock < LOW_STOCK_THRESHOLD;
                  const stockColor = isOut ? THEME.colors.error : isLow ? THEME.colors.warning : THEME.colors.success;
                  const stockLabel = isOut ? 'IMEISHA' : isLow ? `CHACHE (${stock})` : `${stock} PO`;
                  return (
                    <button key={p.id} onClick={() => !isOut && addToCart(p)} disabled={isOut} style={{ 
                      background: colors.bg, border: `1px solid ${isOut ? '#7f1d1d' : colors.border}`, borderRadius: '10px', padding: '12px', 
                      cursor: isOut ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', 
                      opacity: isOut ? 0.6 : 1 
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>{p.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: displayPrice > 0 ? THEME.colors.success : THEME.colors.error }}>{fmt(displayPrice)} TSh</span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: stockColor, background: `${stockColor}20`, padding: '2px 8px', borderRadius: '12px' }}>{stockLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CART */}
        <div style={{ background: colors.surface, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px', color: colors.text }}>{t.cart} ({optimisticCart.length})</h3>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '40vh' }}>
            {optimisticCart.length === 0 ? <p style={{ color: colors.textSec, textAlign: 'center', marginTop: '40px' }}>{t.emptyCart}</p> : optimisticCart.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, padding: '12px 0' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>{i.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.textSec }}>{fmt(i.price)} x {i.qty} = <strong>{fmt((i.price||0)*(i.qty||1))}</strong></p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQty(i.id, -1)} style={{ background: colors.bg, color: colors.text, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: colors.text }}>{i.qty}</span>
                  <button onClick={() => updateQty(i.id, 1)} style={{ background: colors.bg, color: colors.text, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>+</button>
                  <button onClick={() => removeFromCart(i.id)} style={{ background: isDark ? '#451a1a' : '#fef2f2', color: THEME.colors.error, border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}><span style={{ color: colors.text }}>{t.grandTotal}</span><span style={{ color: THEME.colors.success }}>{fmt(totalAmount)} TSh</span></div>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
              <option value="Cash">{t.cash}</option><option value="M-Pesa">{t.mpesa}</option><option value="Bank">{t.bank}</option>
            </select>
            <button onClick={handleCheckout} disabled={loading || !optimisticCart.length} style={{ width: '100%', padding: '14px', background: loading || !optimisticCart.length ? '#64748b' : THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading || !optimisticCart.length ? 'not-allowed' : 'pointer' }}>{loading ? t.processing : t.checkout}</button>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReceipt(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#fff', padding: '24px', borderRadius: '16px', width: '95%', maxWidth: '320px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${isDark ? '#334155' : THEME.colors.primary}` }}>
              <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '20px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: '12px', color: colors.textSec }}>📞 +255 622 995 734</p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px', color: colors.text, fontSize: '16px' }}>{t.receipt.title}</h3>
              <p style={{ margin: '0', fontSize: '11px', color: colors.textSec }}>{t.receipt.date}: {lastSale.date.toLocaleString()}<br/>{t.receipt.number}: #{lastSale.receipt}</p>
            </div>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: '12px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px' }}>
              <thead><tr style={{ borderBottom: `2px solid ${colors.text}` }}><th style={{ textAlign: 'left', padding: '4px 0', color: colors.text }}>{t.receipt.item}</th><th style={{ textAlign: 'center', padding: '4px 0', color: colors.text }}>{t.receipt.quantity}</th><th style={{ textAlign: 'right', padding: '4px 0', color: colors.text }}>{t.receipt.subtotal}</th></tr></thead>
              <tbody>{lastSale.items.map((i, idx) => (<tr key={idx}><td style={{ padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.textSec }}>{i.name || '-'}</td><td style={{ textAlign: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.textSec }}>{i.qty || 1}</td><td style={{ textAlign: 'right', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.text }}>{fmt((i.price||0)*(i.qty||1))}</td></tr>))}</tbody>
            </table>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: '12px 0' }} />
            <div style={{ background: isDark ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}><span style={{ color: colors.text }}>{t.receipt.grandTotal}</span><span style={{ color: THEME.colors.success, fontSize: '18px' }}>{fmt(lastSale.total)} TSh</span></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} style={{ flex: 1, padding: '12px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{t.receipt.print}</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: '12px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{t.receipt.close}</button>
            </div>
          </div>
        </div>
      )}
      <ReceiptTemplates isOpen={showReceiptSettings} onClose={() => setShowReceiptSettings(false)} receiptData={lastSale} lang={lang} />
    </div>
  );
};

export default Sales;