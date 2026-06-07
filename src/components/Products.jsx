import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const fmt = (val) => { 
  if (val == null || val === '') return '0'; 
  const n = Number(val); 
  return isNaN(n) ? '0' : n.toLocaleString(); 
};

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

  useEffect(() => {
    if (!supabase || !shopId) return;
    let active = true;
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { 
        showToast('❌ Imeshindwa kupakia bidhaa', 'error');
      } finally { 
        if (active) setLoading(false); 
      }
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
        shop_id: shopId 
      };
      
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
        setProducts(prev => [savedProduct, ...prev]);
      }

      showToast(t.saved, 'success');
      setShowForm(false); 
      setEditing(null);
      setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
    } catch (err) { 
      showToast(`❌ ${err.message || 'Imeshindwa kuhifadhi'}`, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ 
      name: p.name || '', 
      cost_price: p.cost_price || '', 
      selling_price: p.selling_price || '', 
      stock_quantity: p.stock_quantity || '', 
      barcode: p.barcode || '', 
      category: p.category || '' 
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(g.confirm + '?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await supabase.from('products').delete().eq('id', id).eq('shop_id', shopId);
      showToast(t.deleted, 'success');
    } catch (err) {
      showToast('❌ Imeshindwa kufuta', 'error');
    }
  };

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && String(p.barcode).includes(search))
  );

  return (
    <div style={{ background: colors.surface, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: '1 1 300px', padding: '12px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }} 
        />
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditing(null); 
            setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' }); 
          }} 
          style={{ padding: '12px 20px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {t.addProduct}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: isDark ? '#1e293b' : '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input required placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
          <input required type="number" placeholder={t.buyingPrice} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} style={{ padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
          <input required type="number" placeholder={t.sellingPrice} value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} style={{ padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: 'bold' }} />
          <input type="number" placeholder={t.stock} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={{ padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
          <input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={{ padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: loading ? '#64748b' : THEME.colors.success, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? g.loading : t.saveProduct}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {g.cancel}
            </button>
          </div>
        </form>
      )}
      
      {loading ? (
        <p style={{ textAlign: 'center', color: colors.textSec }}>{g.loading}</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.textSec }}>{t.noProducts}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {filtered.map(p => {
            const profit = (p.selling_price || 0) - (p.cost_price || 0);
            return (
              <div key={p.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', background: isDark ? '#1e293b' : '#ffffff' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: colors.text, lineHeight: '1.3' }}>{p.name}</h4>
                <p style={{ margin: '0 0 12px', color: THEME.colors.success, fontWeight: 'bold', fontSize: '1.1rem' }}>{fmt(p.selling_price)} TSh</p>
                
                {userRole === 'admin' && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${colors.border}` }}>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: THEME.colors.warning }}>Kununua: {fmt(p.cost_price)}</p>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: THEME.colors.success, fontWeight: 'bold' }}>📈 Faida: {fmt(profit)}</p>
                  </div>
                )}
                
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: colors.textSec }}>{t.stock}: {p.stock_quantity ?? '-'}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '8px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    {t.editProduct}
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '8px', background: THEME.colors.error, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    {t.deleteProduct}
                  </button>
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