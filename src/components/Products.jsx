import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const Products = ({ supabase, lang, userId }) => {
  const t = translations[lang].products;
  const g = translations[lang].general;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    name: '', buying_price: '', selling_price: '', stock: '', barcode: '', category: '', description: '' 
  });
  const [msg, setMsg] = useState('');

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
    if (!userId) return;
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        user_id: userId, 
        buying_price: Number(form.buying_price) || 0, 
        selling_price: Number(form.selling_price) || 0,
        stock: Number(form.stock) || 0
      };
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id).eq('user_id', userId);
      } else {
        await supabase.from('products').insert(payload);
      }
      setMsg(t.saved);
      setShowForm(false); setEditing(null); 
      setForm({ name: '', buying_price: '', selling_price: '', stock: '', barcode: '', category: '', description: '' });
      const { data } = await supabase.from('products').select('*').eq('user_id', userId).order('name');
      setProducts(data || []);
    } catch (err) { setMsg(t.errorSave + ' ' + err.message); console.error(err); }
    finally { setLoading(false); setTimeout(()=>setMsg(''), 3000); }
  };

  const handleEdit = (p) => { 
    setEditing(p); 
    setForm({ 
      name: p.name || '', 
      buying_price: p.buying_price || p.price || '', // fallback kwa data ya zamani
      selling_price: p.selling_price || p.price || '', 
      stock: p.stock || '', 
      barcode: p.barcode || '', 
      category: p.category || '', 
      description: p.description || '' 
    }); 
    setShowForm(true); 
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm(g.confirm + '?')) return;
    await supabase.from('products').delete().eq('id', id).eq('user_id', userId);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = products.filter(p => 
    (p.name||'').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && String(p.barcode).includes(search))
  );

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e=>setSearch(e.target.value)} style={{ flex: '1 1 300px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        <button onClick={()=>{ setShowForm(true); setEditing(null); setForm({ name: '', buying_price: '', selling_price: '', stock: '', barcode: '', category: '', description: '' }); }} style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.addProduct}</button>
      </div>

      {msg && <p style={{ padding: '10px', background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', color: msg.includes('✅') ? '#16a34a' : '#dc2626', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' }}>{msg}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input required placeholder={t.name} value={form.name} onChange={e=>setForm({...form, name: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          <input required type="number" placeholder={t.buyingPrice} value={form.buying_price} onChange={e=>setForm({...form, buying_price: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          <input required type="number" placeholder={t.sellingPrice} value={form.selling_price} onChange={e=>setForm({...form, selling_price: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }} />
          <input type="number" placeholder={t.stock} value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          <input placeholder={t.barcode} value={form.barcode} onChange={e=>setForm({...form, barcode: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          <input placeholder={t.category} value={form.category} onChange={e=>setForm({...form, category: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          <textarea placeholder={t.description} value={form.description} onChange={e=>setForm({...form, description: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '60px', gridColumn: '1 / -1' }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? '#94a3b8' : '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? g.loading : t.saveProduct}</button>
            <button type="button" onClick={()=>setShowForm(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{g.cancel}</button>
          </div>
          {/* Faida preview */}
          {form.buying_price && form.selling_price && (
            <p style={{ gridColumn: '1 / -1', margin: '5px 0 0', fontSize: '13px', color: '#16a34a', textAlign: 'center' }}>
              {t.profitCalc} {(Number(form.selling_price) - Number(form.buying_price)).toLocaleString()} TSh
            </p>
          )}
        </form>
      )}

      {loading ? <p style={{textAlign:'center', color:'#64748b'}}>{g.loading}</p> : filtered.length === 0 ? <p style={{textAlign:'center', color:'#64748b'}}>{t.noProducts}</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {filtered.map(p => {
            const profit = (p.selling_price || p.price || 0) - (p.buying_price || 0);
            return (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>{p.name}</h4>
                <p style={{ margin: 0, color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' }}>{(p.selling_price || p.price || 0).toLocaleString()} TSh</p>
                {profit > 0 && <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#16a34a' }}>📈 {t.profit}: {profit.toLocaleString()} TSh</p>}
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{t.stock}: {p.stock ?? '-'}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={()=>handleEdit(p)} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t.editProduct}</button>
                  <button onClick={()=>handleDelete(p.id)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{t.deleteProduct}</button>
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