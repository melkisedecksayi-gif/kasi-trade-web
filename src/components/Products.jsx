import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Products = ({ supabase, lang, shopId, theme, showToast: parentShowToast, userRole = 'cashier' }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang].products;
  const g = translations[lang].general;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (parentShowToast) parentShowToast(message, type);
  }, [parentShowToast]);

  // ✅ Fetch products using shopId
  useEffect(() => {
    if (!supabase || !shopId) return;
    let active = true;
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { 
        console.error(err); 
        showToast('❌ Imeshindwa kupakia bidhaa', 'error');
      } finally { if (active) setLoading(false); }
    };
    fetch();
    return () => { active = false; };
  }, [supabase, shopId, lang, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) { showToast('❌ Shop ID haipatikani!', 'error'); return; }
    setLoading(true);
    try {
      const payload = { 
        name: form.name, 
        cost_price: Number(form.cost_price) || 0, 
        selling_price: Number(form.selling_price) || 0, 
        stock_quantity: Number(form.stock_quantity) || 0, 
        barcode: form.barcode, 
        category: form.category, 
        shop_id: shopId // ✅ Link to shop, not individual user
      };
      
      if (!editing) {
        const newProduct = { ...payload, id: `temp-${Date.now()}`, created_at: new Date().toISOString() };
        setProducts(prev => [newProduct, ...prev]);
      }

      let result;
      if (editing) {
        result = await supabase.from('products').update(payload).eq('id', editing.id).eq('shop_id', shopId).select();
      } else {
        result = await supabase.from('products').insert(payload).select();
      }

      if (result.error) throw result.error;

      const savedProduct = result.data[0];
      if (editing) {
        setProducts(prev => prev.map(p => p.id === editing.id ? savedProduct : p));
      } else {
        setProducts(prev => prev.map(p => p.id === `temp-${Date.now()}` ? savedProduct : p));
      }

      showToast(t.saved, 'success');
      setShowForm(false); setEditing(null);
      setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
    } catch (err) { 
      console.error('🚨 DB Error:', err); 
      showToast(`❌ ${err.message || 'Imeshindwa kuhifadhi'}`, 'error'); 
    } finally { setLoading(false); }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name || '', cost_price: p.cost_price || '', selling_price: p.selling_price || '', stock_quantity: p.stock_quantity || '', barcode: p.barcode || '', category: p.category || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(g.confirm + '?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await supabase.from('products').delete().eq('id', id).eq('shop_id', shopId);
      showToast(t.deleted, 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ Imeshindwa kufuta', 'error');
    }
  };

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && String(p.barcode).includes(search))
  );

  return (
    <div style={{ background: colors.surface, padding: THEME.space.xl, borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.sm, border: `1px solid ${colors.border}` }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.space.xl, flexWrap: 'wrap', gap: THEME.space.m }}>
        <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 300px', padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' }); }} className="btn-micro" style={{ padding: `${THEME.space.m} ${THEME.space.l}`, background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: THEME.radius.md, cursor: 'pointer', fontWeight: 'bold' }}>{t.addProduct}</button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: isDark ? THEME.colors.surfaceDark : '#f8fafc', padding: THEME.space.xl, borderRadius: THEME.radius.lg, marginBottom: THEME.space.xl, display: 'grid', gap: THEME.space.m, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input required placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
          <input required type="number" placeholder={t.buyingPrice} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
          <input required type="number" placeholder={t.sellingPrice} value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md, fontWeight: 'bold' }} />
          <input type="number" placeholder={t.stock} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
          <input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
          <input placeholder={t.category} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: THEME.space.m, background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: THEME.space.m }}>
            <button type="submit" disabled={loading} className="btn-micro" style={{ flex: 1, padding: THEME.space.m, background: loading ? '#475569' : THEME.colors.success, color: '#fff', border: 'none', borderRadius: THEME.radius.md, cursor: 'pointer', fontWeight: 'bold' }}>{loading ? g.loading : t.saveProduct}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-micro" style={{ flex: 1, padding: THEME.space.m, background: colors.surface, color: colors.text, border: 'none', borderRadius: THEME.radius.md, cursor: 'pointer', fontWeight: 'bold' }}>{g.cancel}</button>
          </div>
          {form.cost_price && form.selling_price && (
            <p style={{ gridColumn: '1 / -1', margin: `${THEME.space.xs} 0 0`, fontSize: '13px', color: THEME.colors.success, textAlign: 'center' }}>
              {t.profitCalc} {(Number(form.selling_price) - Number(form.cost_price)).toLocaleString()} TSh
            </p>
          )}
        </form>
      )}
      
      {loading ? <p style={{ textAlign: 'center', color: colors.textSec }}>{g.loading}</p> : filtered.length === 0 ? <p style={{ textAlign: 'center', color: colors.textSec }}>{t.noProducts}</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: THEME.space.m }}>
          {filtered.map(p => {
            const profit = (p.selling_price || 0) - (p.cost_price || 0);
            return (
              <div key={p.id} style={{ border: `1px solid ${colors.border}`, borderRadius: THEME.radius.md, padding: THEME.space.l, background: isDark ? THEME.colors.surfaceDark : '#ffffff', display: 'flex', flexDirection: 'column', gap: THEME.space.xs }} className="card-micro">
                <h4 style={{ margin: 0, fontSize: '16px', color: colors.text }}>{p.name}</h4>
                <p style={{ margin: 0, color: THEME.colors.success, fontWeight: 'bold', fontSize: '1.1rem' }}>{(p.selling_price || 0).toLocaleString()} TSh</p>
                
                {/* ✅ FICHIA FAIDA NA BEI YA KUNUNUA KAMA SI ADMIN */}
                {userRole === 'admin' && (
                  <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: `1px dashed ${colors.border}` }}>
                    <p style={{ margin: '2px 0', fontSize: '12px', color: THEME.colors.warning }}>
                      Kununua: {fmt(p.cost_price)} TSh
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px', color: THEME.colors.success, fontWeight: 'bold' }}>
                      📈 Faida: {fmt(profit)} TSh
                    </p>
                  </div>
                )}
                
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSec }}>{t.stock}: {p.stock_quantity ?? '-'}</p>
                <div style={{ display: 'flex', gap: THEME.space.s, marginTop: 'auto' }}>
                  <button onClick={() => handleEdit(p)} className="btn-micro" style={{ flex: 1, padding: '8px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: THEME.radius.sm, cursor: 'pointer', fontSize: '13px' }}>{t.editProduct}</button>
                  <button onClick={() => handleDelete(p.id)} className="btn-micro" style={{ flex: 1, padding: '8px', background: THEME.colors.error, color: '#fff', border: 'none', borderRadius: THEME.radius.sm, cursor: 'pointer', fontSize: '13px' }}>{t.deleteProduct}</button>
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