import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import ReceiptTemplates from './ReceiptTemplates';
import Toast from './Toast';
import BarcodeScanner from './BarcodeScanner';

const LOW_STOCK_THRESHOLD = 5;
const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, userId, theme }) => {
  console.log('🔍 [SALES] Component rendered');
  
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang].sales;
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [optimisticCart, setOptimisticCart] = useState([]);
  const [portalReady, setPortalReady] = useState(false);

  // ✅ Check if document.body is ready
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      console.log('✅ [SALES] document.body is ready');
      setPortalReady(true);
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

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
    if (!supabase || !userId) return showToast('Database haiko tayari.', 'error');
    
    setLoading(true); setError('');
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      const { error: dbErr } = await supabase.from('sales').insert({ 
        user_id: userId, 
        items: optimisticCart.map(({ stock_limit, ...rest }) => rest), 
        total_amount: totalAmount, 
        payment_method: paymentMethod, 
        receipt_number: recNo, 
        created_at: new Date().toISOString() 
      });
      if (dbErr) throw dbErr;
      
      for (const item of optimisticCart) {
        await supabase.from('products').update({ stock_quantity: item.stock_limit - item.qty }).eq('id', item.id).eq('user_id', userId);
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

  // ✅ PORTAL BUTTON 1: TOP (Full width red)
  const ScannerPortalTop = () => {
    if (!portalReady) {
      console.log('⏳ [PORTAL-TOP] Waiting for document.body...');
      return null;
    }
    
    console.log('✅ [PORTAL-TOP] Rendering portal button at top');
    
    return createPortal(
      <button 
        onClick={() => {
          console.log('📷 [PORTAL-TOP] Button clicked!');
          setShowScanner(true);
        }}
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          padding: '18px',
          background: '#ff0000',
          color: '#ffffff',
          border: 'none',
          fontSize: '18px',
          fontWeight: '900',
          zIndex: '999999999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        📷 {lang === 'sw' ? 'BONYEZA HAPA KUSCAN (JUU)' : 'TAP HERE TO SCAN (TOP)'}
      </button>,
      document.body
    );
  };

  // ✅ PORTAL BUTTON 2: BOTTOM RIGHT (Floating orange)
  const ScannerPortalBottom = () => {
    if (!portalReady) return null;
    
    console.log('✅ [PORTAL-BOTTOM] Rendering portal button at bottom');
    
    return createPortal(
      <button 
        onClick={() => {
          console.log('📷 [PORTAL-BOTTOM] Button clicked!');
          setShowScanner(true);
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: '#ff6600',
          color: '#ffffff',
          border: '3px solid #ffffff',
          fontSize: '30px',
          fontWeight: '900',
          zIndex: '999999998',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 25px rgba(0,0,0,0.6)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          animation: 'pulse 2s infinite'
        }}
      >
        📷
      </button>,
      document.body
    );
  };

  return (
    <>
      {/* ✅ RENDER BOTH PORTAL BUTTONS */}
      <ScannerPortalTop />
      <ScannerPortalBottom />

      {/* ✅ MAIN LAYOUT */}
      <div style={{ 
        minHeight: '100vh', 
        background: colors.bg,
        maxWidth: '100vw',
        overflowX: 'hidden',
        paddingTop: '70px' // Space for top button
      }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {error && <div style={{ width: '100%', padding: THEME.space.m, background: isDark ? '#451a1a' : '#fef2f2', color: THEME.colors.error, borderRadius: THEME.radius.md, marginBottom: THEME.space.m, textAlign: 'center' }}>{error}</div>}
        
        {/* ✅ SEARCH & PRODUCTS */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: THEME.space.m, padding: THEME.space.m }}>
          <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} />
          
          <div style={{ flex: 1, overflowY: 'auto', background: colors.surface, borderRadius: '12px', padding: THEME.space.m, boxShadow: THEME.shadow.sm, border: `1px solid ${colors.border}`, minHeight: '300px' }}>
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
                    <button key={p.id} onClick={() => !isOut && addToCart(p)} disabled={isOut} className="btn-micro" style={{ 
                      background: colors.surface, border: `1px solid ${isOut ? '#7f1d1d' : colors.border}`, borderRadius: '10px', padding: '12px', 
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

        {/* ✅ CART SECTION */}
        <div style={{ width: '100%', background: colors.surface, borderRadius: '12px', padding: '16px', boxShadow: THEME.shadow.sm, border: `1px solid ${colors.border}`, margin: THEME.space.m }}>
          <h3 style={{ margin: '0 0 12px', color: colors.text }}>{t.cart} ({optimisticCart.length})</h3>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', maxHeight: '300px' }}>
            {optimisticCart.length === 0 ? <p style={{ color: colors.textSec, textAlign: 'center', marginTop: '30px' }}>{t.emptyCart}</p> : optimisticCart.map(i => {
              const isMaxed = i.qty >= i.stock_limit;
              return (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, background: isMaxed ? (isDark ? '#451a03' : '#fff7ed') : 'transparent', borderRadius: '8px', padding: '8px', marginBottom: '6px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>{i.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: isMaxed ? THEME.colors.warning : colors.textSec }}>
                      {fmt(i.price)} x {i.qty} = <strong>{fmt((i.price||0)*(i.qty||1))}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => updateQty(i.id, -1)} className="btn-micro" style={{ background: colors.surface, color: colors.text, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: colors.text }}>{i.qty}</span>
                    <button onClick={() => updateQty(i.id, 1)} disabled={isMaxed} className="btn-micro" style={{ background: colors.surface, color: colors.text, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: isMaxed ? 'not-allowed' : 'pointer', opacity: isMaxed ? 0.5 : 1 }}>+</button>
                    <button onClick={() => removeFromCart(i.id)} className="btn-micro" style={{ background: isDark ? '#451a1a' : '#fef2f2', color: THEME.colors.error, border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}><span style={{ color: colors.text }}>{t.grandTotal}</span><span style={{ color: THEME.colors.success }}>{fmt(totalAmount)} TSh</span></div>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '14px' }}>
              <option value="Cash">{t.cash}</option><option value="M-Pesa">{t.mpesa}</option><option value="Bank">{t.bank}</option>
            </select>
            <button onClick={handleCheckout} disabled={loading || !optimisticCart.length} className="btn-micro" style={{ width: '100%', padding: '14px', background: loading || !optimisticCart.length ? '#475569' : THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: loading || !optimisticCart.length ? 'not-allowed' : 'pointer' }}>{loading ? t.processing : t.checkout}</button>
          </div>
        </div>
      </div>

      {/* ✅ SCANNER MODAL */}
      {showScanner && (
        <BarcodeScanner 
          onScan={(product) => {
            addToCart(product);
            setShowScanner(false);
            showToast(`✅ ${product.name} imeongezwa!`, 'success');
          }}
          onClose={() => setShowScanner(false)}
          products={products}
          lang={lang}
        />
      )}

      {/* ✅ RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReceipt(false)}>
          <div style={{ background: isDark ? THEME.colors.surfaceDark : '#fff', padding: '24px', borderRadius: '16px', width: '95%', maxWidth: '320px', maxHeight: '90vh', overflowY: 'auto', boxShadow: THEME.shadow.lg }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${isDark ? THEME.colors.borderDark : THEME.colors.primary}` }}>
              <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '20px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: '12px', color: colors.textSec }}>{t.receipt.subtitle}<br />📞 +255 622 995 734</p>
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
            <div style={{ background: isDark ? THEME.colors.bgDark : '#f8fafc', padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}><span style={{ color: colors.text }}>{t.receipt.grandTotal}</span><span style={{ color: THEME.colors.success, fontSize: '18px' }}>{fmt(lastSale.total)} TSh</span></div>
            </div>
            <p style={{ fontSize: '12px', color: colors.textSec, margin: '0 0 12px', textAlign: 'center' }}>{t.receipt.payment}: <strong>{lastSale.method}</strong></p>
            <button onClick={() => { setShowReceipt(false); setShowReceiptSettings(true); }} className="btn-micro" style={{ width: '100%', padding: '12px', background: THEME.colors.warning, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>🎨 {lang === 'sw' ? 'Badilisha Muundo' : 'Customize'}</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} className="btn-micro" style={{ flex: 1, padding: '12px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>{t.receipt.print}</button>
              <button onClick={() => setShowReceipt(false)} className="btn-micro" style={{ flex: 1, padding: '12px', background: colors.surface, color: colors.text, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>{t.receipt.close}</button>
            </div>
          </div>
        </div>
      )}

      <ReceiptTemplates isOpen={showReceiptSettings} onClose={() => setShowReceiptSettings(false)} receiptData={lastSale} lang={lang} />

      {/* ✅ Pulse animation for bottom button */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 6px 25px rgba(255,102,0,0.6); }
          50% { transform: scale(1.05); box-shadow: 0 8px 30px rgba(255,102,0,0.9); }
        }
      `}</style>
    </>
  );
};

export default Sales;