import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import ReceiptTemplates from './ReceiptTemplates';
import Toast from './Toast';

const LOW_STOCK_THRESHOLD = 5;
const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, userId, theme, mode = 'cashier', session }) => {
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
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [optimisticCart, setOptimisticCart] = useState([]);

  const effectiveUserId = userId || session?.user?.id;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!supabase || !effectiveUserId) return;
    let active = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('user_id', effectiveUserId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { if (active) setError(t.saveError + err.message); }
    };
    fetchProducts();
    return () => { active = false; };
  }, [supabase, effectiveUserId, lang]);

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

  const removeFromCart = useCallback((id) => {
    if (mode === 'admin') return;
    setOptimisticCart(prev => prev.filter(i => i.id !== id));
  }, [mode]);

  const totalAmount = optimisticCart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  const handleCheckout = async () => {
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    if (!optimisticCart.length) return showToast('Kikapu kipo tupu!', 'warning');
    if (!supabase || !effectiveUserId) return showToast('Database haiko tayari.', 'error');
    const stockIssues = optimisticCart.filter(item => item.qty > item.stock_limit);
    if (stockIssues.length > 0) { showToast(`Bidhaa ${stockIssues.length} zina stock isiyotosha.`, 'error'); return; }
    setLoading(true); setError('');
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      const { error: dbErr } = await supabase.from('sales').insert({ 
        user_id: effectiveUserId, items: optimisticCart.map(({ stock_limit, ...rest }) => rest), 
        total_amount: totalAmount, payment_method: paymentMethod, receipt_number: recNo, created_at: new Date().toISOString() 
      });
      if (dbErr) throw dbErr;
      for (const item of optimisticCart) await supabase.from('products').update({ stock_quantity: item.stock_limit - item.qty }).eq('id', item.id).eq('user_id', effectiveUserId);
      setLastSale({ items: [...optimisticCart], total: totalAmount, receipt: recNo, date: new Date(), method: paymentMethod });
      setShowReceipt(true); setOptimisticCart([]);
      showToast('✅ Mauzo yamehifadhiwa!', 'success');
    } catch (err) { setError(t.saveError + err.message); showToast(`❌ ${err.message}`, 'error'); } finally { setLoading(false); }
  };

  const filtered = products.filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));

  // ✅ Mobile styles
  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '12px' : THEME.space.l,
    padding: isMobile ? '12px' : THEME.space.m,
    height: '100%',
    overflow: 'auto'
  };

  const inputStyle = {
    padding: isMobile ? '14px' : THEME.space.m,
    fontSize: '16px',
    background: colors.surface,
    color: colors.text,
    border: `2px solid ${colors.border}`,
    borderRadius: THEME.radius.md,
    width: '100%',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: isMobile ? '14px 20px' : `${THEME.space.m} ${THEME.space.l}`,
    fontSize: isMobile ? '15px' : '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: THEME.radius.md,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent'
  };

  return (
    <div style={containerStyle}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {mode === 'admin' && (
        <div style={{ 
          width: '100%', 
          padding: isMobile ? '12px' : THEME.space.m, 
          background: '#fef3c7', 
          color: '#92400e', 
          borderRadius: THEME.radius.md, 
          marginBottom: isMobile ? '12px' : THEME.space.m, 
          textAlign: 'center', 
          border: `2px solid #f59e0b`, 
          fontWeight: 'bold',
          fontSize: isMobile ? '13px' : '14px'
        }}>
          👑 Hali ya Admin: Unaweza kutazama tu. Badilisha kuwa Cashier kufanya mauzo.
        </div>
      )}
      
      {/* ✅ Products Section */}
      <div style={{ flex: isMobile ? 'none' : '2', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : THEME.space.m }}>
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={inputStyle}
        />
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: colors.surface, 
          borderRadius: THEME.radius.lg, 
          padding: isMobile ? '12px' : THEME.space.m, 
          boxShadow: THEME.shadow.sm, 
          border: `2px solid ${colors.border}`,
          minHeight: isMobile ? '300px' : '200px'
        }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 20px' }}>
              <div style={{ fontSize: isMobile ? '40px' : '48px', marginBottom: '10px' }}>📦</div>
              <p style={{ color: colors.text, fontSize: isMobile ? '14px' : '16px', fontWeight: '500' }}>{t.noProducts}</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: isMobile ? '10px' : '12px'
            }}>
              {filtered.map(p => {
                const displayPrice = p.selling_price || p.price || 0;
                const stock = p.stock_quantity || 0;
                const isOut = stock <= 0;
                const isLow = stock > 0 && stock < LOW_STOCK_THRESHOLD;
                const stockColor = isOut ? THEME.colors.error : isLow ? THEME.colors.warning : THEME.colors.success;
                const stockLabel = isOut ? 'IMEISHA' : isLow ? `CHACHE (${stock})` : `${stock} PO`;
                return (
                  <button 
                    key={p.id} 
                    onClick={() => !isOut && addToCart(p)} 
                    disabled={isOut || mode === 'admin'} 
                    style={{ 
                      background: colors.surface, 
                      border: `2px solid ${isOut ? '#7f1d1d' : colors.border}`, 
                      borderRadius: THEME.radius.md, 
                      padding: isMobile ? '10px' : '12px', 
                      cursor: (isOut || mode === 'admin') ? 'not-allowed' : 'pointer', 
                      textAlign: 'center', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '6px', 
                      opacity: (isOut || mode === 'admin') ? 0.6 : 1
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: colors.text, wordBreak: 'break-word' }}>{p.name}</span>
                    <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 'bold', color: displayPrice > 0 ? THEME.colors.success : THEME.colors.error }}>
                      {fmt(displayPrice)} TSh
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: stockColor, background: `${stockColor}20`, padding: '2px 8px', borderRadius: '12px' }}>
                      {stockLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Cart Section */}
      <div style={{ 
        flex: isMobile ? 'none' : '1', 
        width: '100%', 
        background: colors.surface, 
        borderRadius: THEME.radius.lg, 
        padding: isMobile ? '14px' : '16px', 
        boxShadow: THEME.shadow.sm, 
        display: 'flex', 
        flexDirection: 'column', 
        border: `2px solid ${colors.border}`
      }}>
        <h3 style={{ margin: `0 0 ${isMobile ? '12px' : '12px'}`, color: colors.text, fontSize: isMobile ? '17px' : '18px' }}>
          🛒 {t.cart} ({optimisticCart.length})
        </h3>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', minHeight: isMobile ? '150px' : 'auto' }}>
          {optimisticCart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '30px 10px' : '40px 10px', color: colors.textSec }}>
              <div style={{ fontSize: isMobile ? '36px' : '40px', marginBottom: '10px' }}>🛒</div>
              <p style={{ fontSize: isMobile ? '13px' : '14px' }}>{t.emptyCart}</p>
            </div>
          ) : optimisticCart.map(i => {
            const isMaxed = i.qty >= i.stock_limit;
            return (
              <div key={i.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: `1px solid ${colors.border}`, 
                background: isMaxed ? (isDark ? '#451a03' : '#fff7ed') : 'transparent', 
                borderRadius: THEME.radius.sm, 
                padding: isMobile ? '8px' : '10px', 
                marginBottom: '6px'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: isMobile ? '14px' : '15px', fontWeight: '500', color: colors.text, wordBreak: 'break-word' }}>{i.name}</p>
                  <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: isMaxed ? THEME.colors.warning : colors.textSec }}>
                    {fmt(i.price)} × {i.qty} = <strong style={{ color: THEME.colors.success }}>{fmt((i.price||0)*(i.qty||1))} TSh</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => updateQty(i.id, -1)} disabled={mode === 'admin'} style={{ 
                    background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', padding: isMobile ? '6px 10px' : '4px 8px', 
                    cursor: mode === 'admin' ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: isMobile ? '16px' : '14px'
                  }}>-</button>
                  <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: colors.text, fontSize: isMobile ? '14px' : '15px' }}>{i.qty}</span>
                  <button onClick={() => updateQty(i.id, 1)} disabled={isMaxed || mode === 'admin'} style={{ 
                    background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', padding: isMobile ? '6px 10px' : '4px 8px', 
                    cursor: (isMaxed || mode === 'admin') ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: isMobile ? '16px' : '14px'
                  }}>+</button>
                  <button onClick={() => removeFromCart(i.id)} disabled={mode === 'admin'} style={{ 
                    background: isDark ? '#451a1a' : '#fef2f2', color: THEME.colors.error, 
                    border: 'none', borderRadius: '6px', padding: isMobile ? '6px 8px' : '4px 6px', 
                    cursor: mode === 'admin' ? 'not-allowed' : 'pointer', fontSize: isMobile ? '16px' : '14px'
                  }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: `2px solid ${colors.border}`, paddingTop: isMobile ? '12px' : '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: isMobile ? '18px' : '20px', 
            fontWeight: 'bold', 
            marginBottom: isMobile ? '12px' : '12px', 
            padding: isMobile ? '10px' : '10px', 
            background: isDark ? '#1e3a5f' : '#eff6ff', 
            borderRadius: '8px'
          }}>
            <span style={{ color: colors.text }}>{t.grandTotal}</span>
            <span style={{ color: THEME.colors.success }}>{fmt(totalAmount)} TSh</span>
          </div>
          <select 
            value={paymentMethod} 
            onChange={e => setPaymentMethod(e.target.value)} 
            disabled={mode === 'admin'} 
            style={{ 
              width: '100%', 
              padding: isMobile ? '12px' : '10px', 
              marginBottom: isMobile ? '10px' : '10px', 
              background: colors.surface, 
              color: colors.text, 
              border: `2px solid ${colors.border}`, 
              borderRadius: '8px', 
              fontSize: isMobile ? '16px' : '14px',
              opacity: mode === 'admin' ? 0.6 : 1
            }}
          >
            <option value="Cash">{t.cash}</option>
            <option value="M-Pesa">{t.mpesa}</option>
            <option value="Bank">{t.bank}</option>
          </select>
          <button 
            onClick={handleCheckout} 
            disabled={loading || !optimisticCart.length || mode === 'admin'} 
            style={{ 
              width: '100%', 
              padding: isMobile ? '16px' : '14px', 
              background: (loading || !optimisticCart.length || mode === 'admin') ? '#475569' : THEME.colors.primary, 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '16px' : '16px', 
              cursor: (loading || !optimisticCart.length || mode === 'admin') ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t.processing : t.checkout}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '20px' : '20px' }} onClick={() => setShowReceipt(false)}>
          <div style={{ 
            background: isDark ? THEME.colors.surfaceDark : '#fff', 
            padding: isMobile ? '20px' : '24px', 
            borderRadius: '16px', 
            width: isMobile ? '95%' : '100%',
            maxWidth: '320px',
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: THEME.shadow.lg 
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '16px', paddingBottom: isMobile ? '12px' : '12px', borderBottom: `2px solid ${isDark ? THEME.colors.borderDark : THEME.colors.primary}` }}>
              <h2 style={{ margin: `0 0 4px`, color: colors.text, fontSize: isMobile ? '18px' : '20px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: isMobile ? '11px' : '12px', color: colors.textSec }}>{t.receipt.subtitle}<br />📞 +255 622 995 734</p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '16px' }}>
              <h3 style={{ margin: `0 0 4px`, color: colors.text, fontSize: isMobile ? '15px' : '16px' }}>{t.receipt.title}</h3>
              <p style={{ margin: '0', fontSize: isMobile ? '10px' : '11px', color: colors.textSec }}>{t.receipt.date}: {lastSale.date.toLocaleString()}<br/>{t.receipt.number}: #{lastSale.receipt}</p>
            </div>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: isMobile ? '12px 0' : '12px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '12px' : '13px', marginBottom: isMobile ? '12px' : '12px' }}>
              <thead><tr style={{ borderBottom: `2px solid ${colors.text}` }}><th style={{ textAlign: 'left', padding: '4px 0', color: colors.text }}>{t.receipt.item}</th><th style={{ textAlign: 'center', padding: '4px 0', color: colors.text }}>{t.receipt.quantity}</th><th style={{ textAlign: 'right', padding: '4px 0', color: colors.text }}>{t.receipt.subtotal}</th></tr></thead>
              <tbody>{lastSale.items.map((i, idx) => (<tr key={idx}><td style={{ padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.textSec }}>{i.name || '-'}</td><td style={{ textAlign: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.textSec }}>{i.qty || 1}</td><td style={{ textAlign: 'right', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, color: colors.text }}>{fmt((i.price||0)*(i.qty||1))}</td></tr>))}</tbody>
            </table>
            <hr style={{ border: `1px dashed ${colors.border}`, margin: isMobile ? '12px 0' : '12px 0' }} />
            <div style={{ background: isDark ? THEME.colors.bgDark : '#f8fafc', padding: isMobile ? '10px' : '10px', borderRadius: '10px', marginBottom: isMobile ? '10px' : '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: isMobile ? '15px' : '16px' }}><span style={{ color: colors.text }}>{t.receipt.grandTotal}</span><span style={{ color: THEME.colors.success, fontSize: isMobile ? '17px' : '18px' }}>{fmt(lastSale.total)} TSh</span></div>
            </div>
            <p style={{ fontSize: isMobile ? '11px' : '12px', color: colors.textSec, margin: `0 0 12px`, textAlign: 'center' }}>{t.receipt.payment}: <strong>{lastSale.method}</strong></p>
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} style={{ flex: 1, padding: isMobile ? '12px' : '12px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '14px' : '14px' }}>{t.receipt.print}</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: isMobile ? '12px' : '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '14px' : '14px' }}>{t.receipt.close}</button>
            </div>
          </div>
        </div>
      )}
      <ReceiptTemplates isOpen={showReceiptSettings} onClose={() => setShowReceiptSettings(false)} receiptData={lastSale} lang={lang} />
    </div>
  );
};

export default Sales;