import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const Products = ({ supabase, lang, userId, theme }) => {
  const isDark = theme === 'dark';
  const t = translations[lang].products;
  const g = translations[lang].general;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
  const [msg, setMsg] = useState('');

  const bg = isDark ? '#1e293b' : '#ffffff';
  const cardBg = isDark ? '#0f172a' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const btnBg = isDark ? '#334155' : '#f1f5f9';

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
      finally { if (active) setLoading(false); }
    };
    fetch();
    return () => { active = false; };
  }, [supabase, userId, lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { setMsg('❌ User ID haipatikani!'); return; }
    setLoading(true);
    try {
      const payload = { name: form.name, cost_price: Number(form.cost_price) || 0, selling_price: Number(form.selling_price) || 0, stock_quantity: Number(form.stock_quantity) || 0, barcode: form.barcode, category: form.category, user_id: userId };
      let result;
      if (editing) result = await supabase.from('products').update(payload).eq('id', editing.id).eq('user_id', userId).select();
      else result = await supabase.from('products').insert(payload).select();
      if (result.error) throw result.error;
      const newProduct = result.data[0];
      if (!editing) setProducts(prev => [newProduct, ...prev]);
      else setProducts(prev => prev.map(p => p.id === newProduct.id ? newProduct : p));
      setMsg(t.saved); setShowForm(false); setEditing(null);
      setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
    } catch (err) { console.error(' DB Error:', err); setMsg(`❌ ${err.message || 'Imeshindwa'}`); }
    finally { setLoading(false); setTimeout(() => setMsg(''), 3000); }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name || '', cost_price: p.cost_price || '', selling_price: p.selling_price || '', stock_quantity: p.stock_quantity || '', barcode: p.barcode || '', category: p.category || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(g.confirm + '?')) return;
    await supabase.from('products').delete().eq('id', id).eq('user_id', userId);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));

  return (
    <div style={{ background: bg, padding: '20px', borderRadius: '12px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 300px', padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' }); }} style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.addProduct}</button>
      </div>
      {msg && <p style={{ padding: '10px', background: msg.includes('✅') ? (isDark ? '#14532d' : '#f0fdf4') : (isDark ? '#451a1a' : '#fef2f2'), color: msg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' }}>{msg}</p>}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: cardBg, padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input required placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
          <input required type="number" placeholder={t.buyingPrice} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
          <input required type="number" placeholder={t.sellingPrice} value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px', fontWeight: 'bold' }} />
          <input type="number" placeholder={t.stock} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
          <input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
          <input placeholder={t.category} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: '10px', background: inputBg, color: textMain, border: `1px solid ${border}`, borderRadius: '6px' }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? '#475569' : '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? g.loading : t.saveProduct}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: btnBg, color: textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{g.cancel}</button>
          </div>
          {form.cost_price && form.selling_price && (
            <p style={{ gridColumn: '1 / -1', margin: '5px 0 0', fontSize: '13px', color: '#4ade80', textAlign: 'center' }}>
              {t.profitCalc} {(Number(form.selling_price) - Number(form.cost_price)).toLocaleString()} TSh
            </p>
          )}
        </form>
      )}
      {loading ? <p style={{ textAlign: 'center', color: textSec }}>{g.loading}</p> : filtered.length === 0 ? <p style={{ textAlign: 'center', color: textSec }}>{t.noProducts}</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {filtered.map(p => {
            const profit = (p.selling_price || 0) - (p.cost_price || 0);
            return (
              <div key={p.id} style={{ border: `1px solid ${border}`, borderRadius: '8px', padding: '15px', background: cardBg, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: textMain }}>{p.name}</h4>
                <p style={{ margin: 0, color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem' }}>{(p.selling_price || 0).toLocaleString()} TSh</p>
                {profit > 0 && <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#4ade80' }}>📈 {t.profit}: {profit.toLocaleString()} TSh</p>}
                <p style={{ margin: 0, fontSize: '13px', color: textSec }}>{t.stock}: {p.stock_quantity ?? '-'}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t.editProduct}</button>
                  <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t.deleteProduct}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;