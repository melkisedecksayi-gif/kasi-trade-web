import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Sales = ({ supabase, lang, userId }) => {
  const t = translations[lang].sales;
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { 
        if (active) setError(translations[lang].sales.saveError + err.message); 
      }
    };
    fetchProducts();
    return () => { active = false; };
  }, [supabase, userId, lang]);

  const addToCart = (product) => {
    if (!product?.id) return;
    // ✅ Tumia selling_price (au price kama fallback kwa data ya zamani)
    const price = product.selling_price || product.price || 0;
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      return exists 
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) 
        : [...prev, { ...product, qty: 1, price: Number(price), selling_price: Number(price) }];
    });
  };

  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const totalAmount = cart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  const handleCheckout = async () => {
    if (!cart.length) return alert(t.emptyCartAlert);
    if (!supabase || !userId) return alert(t.dbNotReady);
    setLoading(true); setError('');
    try {
      const recNo = `REC-${Date.now().toString().slice(-6)}`;
      const { error: dbErr } = await supabase.from('sales').insert({ 
        user_id: userId,
        items: cart, 
        total_amount: totalAmount, 
        payment_method: paymentMethod, 
        receipt_number: recNo, 
        created_at: new Date().toISOString() 
      });
      if (dbErr) throw dbErr;
      setLastSale({ items: [...cart], total: totalAmount, receipt: recNo, date: new Date(), method: paymentMethod });
      setShowReceipt(true); setCart([]);
    } catch (err) { setError(t.saveError + err.message); }
    finally { setLoading(false); }
  };

  const filtered = products.filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', height: 'calc(100vh - 100px)', padding: '10px' }}>
      {error && <div style={{ width: '100%', padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '10px', textAlign: 'center' }}>{error}<button onClick={()=>window.location.reload()} style={{ marginLeft:'10px', textDecoration:'underline', background:'none', border:'none', color:'#dc2626', cursor:'pointer' }}>🔄 Refresh</button></div>}
      
      <div style={{ flex: '2 1 400px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
        <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        {products.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>{t.noProducts}</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {filtered.map(p => {
              const displayPrice = p.selling_price || p.price || 0;
              return (<button key={p.id} onClick={() => addToCart(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{p.name}</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: displayPrice > 0 ? '#22c55e' : '#ef4444' }}>{fmt(displayPrice)} TSh</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.stock}: {p.stock ?? '-'}</span>
              </button>);
            })}
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 300px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 15px', color: '#0f172a' }}>{t.cart} ({cart.length})</h3>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
          {cart.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>{t.emptyCart}</p> : cart.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div><p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '500' }}>{i.name}</p><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{fmt(i.price)} x {i.qty || 1} = <strong>{fmt((i.price||0)*(i.qty||1))}</strong></p></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateQty(i.id, -1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{i.qty}</span>
                <button onClick={() => updateQty(i.id, 1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>+</button>
                <button onClick={() => removeFromCart(i.id)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}><span>{t.grandTotal}</span><span style={{ color: '#22c55e' }}>{fmt(totalAmount)} TSh</span></div>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}>
            <option value="Cash">{t.cash}</option><option value="M-Pesa">{t.mpesa}</option><option value="Bank">{t.bank}</option>
          </select>
          <button onClick={handleCheckout} disabled={loading || !cart.length} style={{ width: '100%', padding: '14px', background: loading || !cart.length ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading || !cart.length ? 'not-allowed' : 'pointer' }}>{loading ? t.processing : t.checkout}</button>
        </div>
      </div>

      {showReceipt && lastSale && Array.isArray(lastSale.items) && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReceipt(false)}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #3b82f6' }}>
              <h2 style={{ margin: '0 0 5px', color: '#0f172a', fontSize: '20px' }}>{t.receipt.company}</h2>
              <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>{t.receipt.subtitle}<br />📞 +255 622 995 734</p>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px', color: '#0f172a', fontSize: '16px' }}>{t.receipt.title}</h3>
              <p style={{ margin: '0', fontSize: '11px', color: '#94a3b8' }}>{t.receipt.date}: {lastSale.date.toLocaleString()}<br/>{t.receipt.number}: #{lastSale.receipt}</p>
            </div>
            <hr style={{ border: '1px dashed #cbd5e1', margin: '15px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
              <thead><tr style={{ borderBottom: '2px solid #0f172a' }}><th style={{ textAlign: 'left', padding: '5px 0' }}>{t.receipt.item}</th><th style={{ textAlign: 'center', padding: '5px 0' }}>{t.receipt.quantity}</th><th style={{ textAlign: 'right', padding: '5px 0' }}>{t.receipt.subtotal}</th></tr></thead>
              <tbody>{lastSale.items.map((i, idx) => (<tr key={idx}><td style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{i.name || '-'}</td><td style={{ textAlign: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{i.qty || 1}</td><td style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{fmt((i.price||0)*(i.qty||1))}</td></tr>))}</tbody>
            </table>
            <hr style={{ border: '1px dashed #cbd5e1', margin: '15px 0' }} />
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}><span>{t.receipt.grandTotal}</span><span style={{ color: '#22c55e', fontSize: '18px' }}>{fmt(lastSale.total)} TSh</span></div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 15px', textAlign: 'center' }}>{t.receipt.payment}: <strong>{lastSale.method}</strong></p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => { window.print(); setShowReceipt(false); }} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{t.receipt.print}</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{t.receipt.close}</button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <p style={{ margin: '0 0 5px' }}>{t.receipt.thankYou}</p>
              <p style={{ margin: '0' }}>{t.receipt.support}: +255 622 995 734 | +255 613 808 727</p>
              <p style={{ margin: '5px 0 0', fontSize: '10px' }}>{t.receipt.copyright}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;