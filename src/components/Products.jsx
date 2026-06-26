import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Products = ({ supabase, lang, userId, theme, showToast: parentShowToast, mode = 'cashier', session, searchTrigger }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang]?.products || translations.sw.products;
  
  const effectiveUserId = userId || session?.user?.id;
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [swipedId, setSwipedId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [form, setForm] = useState({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (parentShowToast) parentShowToast(message, type);
  }, [parentShowToast]);

  useEffect(() => {
    if (!supabase || !effectiveUserId) return;
    let active = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').eq('user_id', effectiveUserId).order('name');
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (err) { showToast(' Imeshindwa kupakia bidhaa', 'error'); } finally { if (active) setLoading(false); }
    };
    fetch();
    return () => { active = false; };
  }, [supabase, effectiveUserId, lang, showToast]);

  const openForm = (product = null) => {
    if (mode === 'admin') return showToast(' Hali ya Admin inaruhusu kutazama tu.', 'warning');
    setEditing(product);
    setForm({
      name: product?.name || '', cost_price: product?.cost_price || '', selling_price: product?.selling_price || '',
      stock_quantity: product?.stock_quantity || '', barcode: product?.barcode || '', category: product?.category || ''
    });
    setShowBottomSheet(true);
  };

  const closeForm = () => { setShowBottomSheet(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveUserId) { showToast('❌ User ID haipatikani.', 'error'); return; }
    if (!form.name.trim()) { showToast('❌ Jina la bidhaa linahitajika!', 'error'); return; }
    if (!form.selling_price || Number(form.selling_price) <= 0) { showToast('❌ Bei ya kuuza inahitajika!', 'error'); return; }
    
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), cost_price: Number(form.cost_price) || 0, selling_price: Number(form.selling_price) || 0, stock_quantity: Number(form.stock_quantity) || 0, barcode: form.barcode?.trim() || null, category: form.category?.trim() || null, user_id: effectiveUserId };
      let result = editing ? await supabase.from('products').update(payload).eq('id', editing.id).eq('user_id', effectiveUserId).select() : await supabase.from('products').insert(payload).select();
      if (result.error) throw result.error;
      const { data: updatedProducts } = await supabase.from('products').select('*').eq('user_id', effectiveUserId).order('name');
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      showToast(editing ? '✅ Bidhaa imesasishwa!' : t.saved, 'success');
      closeForm();
    } catch (err) { showToast(` ${err.message}`, 'error'); } finally { setSaving(false); }
  };

  const handleDeleteRequest = (id) => {
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    setDeleteId(id);
    setSwipedId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteId).eq('user_id', effectiveUserId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== deleteId));
      showToast(t.deleted, 'success');
    } catch (err) { showToast('❌ Imeshindwa kufuta', 'error'); } finally { setDeleteId(null); }
  };

  const handleTouchStart = (e, id) => { setTouchStartX(e.touches[0].clientX); setSwipedId(id); };
  const handleTouchEnd = (e, id) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff < 50) setSwipedId(null);
  };

  const filtered = products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.barcode && String(p.barcode).includes(search)));

  const inputStyle = { padding: '14px', fontSize: '16px', background: isDark ? 'rgba(30,41,59,0.5)' : '#ffffff', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '12px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'transparent', padding: isMobile ? '12px' : THEME.space.xl, width: '100%', boxSizing: 'border-box' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={!!deleteId} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} title="Futa Bidhaa" message="Je, una uhakika unataka kufuta bidhaa hii?" />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.5 }}>🔍</span>
          <input type="text" placeholder={`${t.searchPlaceholder} (Ctrl+K)`} value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}>✕</button>}
        </div>
        {mode === 'cashier' && (
          <button onClick={() => openForm()} disabled={saving} className="btn-micro gradient-primary shadow-premium" style={{ color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', opacity: saving ? 0.6 : 1 }}>
            {t.addProduct}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: THEME.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>
      ) : filtered.length === 0 ? (
        <div className="glass shadow-premium" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px' }}><div style={{ fontSize: '50px', marginBottom: '10px' }}>📦</div><p style={{ color: colors.text, fontSize: '15px', fontWeight: '500' }}>{t.noProducts}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {filtered.map(p => {
            const profit = (p.selling_price || 0) - (p.cost_price || 0);
            const isSwiped = swipedId === p.id;
            return (
              <div key={p.id} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                {isMobile && mode === 'cashier' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', zIndex: 1 }}>
                    <button onClick={() => handleDeleteRequest(p.id)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '20px' }}>🗑️</span> Futa
                    </button>
                  </div>
                )}
                
                <div 
                  className="glass"
                  onTouchStart={(e) => handleTouchStart(e, p.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, p.id)}
                  style={{ 
                    padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 2,
                    transform: isMobile && isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                    background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: colors.text, fontWeight: '600', flex: 1 }}>{p.name}</h4>
                    {mode === 'cashier' && !isMobile && (
                      <button onClick={() => openForm(p)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                    )}
                  </div>
                  <p style={{ margin: 0, color: THEME.colors.success, fontWeight: 'bold', fontSize: '1.2rem' }}>{fmt(p.selling_price)} TSh</p>
                  
                  {mode === 'admin' && (
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#f59e0b' }}>🏷️ Kununua: {fmt(p.cost_price)} TSh</p>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>📈 Faida: {fmt(profit)} TSh</p>
                    </div>
                  )}
                  
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSec }}> Stock: <strong style={{ color: (p.stock_quantity || 0) < 5 ? '#ef4444' : colors.text }}>{p.stock_quantity ?? '-'}</strong></p>
                  
                  {mode === 'cashier' && isMobile && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => openForm(p)} className="btn-micro" style={{ flex: 1, padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px' }}>✏️ Hariri</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMobile && showBottomSheet && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, animation: 'fadeIn 0.2s ease' }} onClick={closeForm} />
          <div style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, 
            background: isDark ? '#0f172a' : '#ffffff', 
            borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', 
            zIndex: 1000, maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 20px', color: colors.text, fontSize: '18px', fontWeight: '700' }}>{editing ? 'Hariri Bidhaa' : 'Ongeza Bidhaa Mpya'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              <input required placeholder="Jina la Bidhaa" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={saving} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input required type="number" step="0.01" placeholder="Bei ya Kununua" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} disabled={saving} style={inputStyle} />
                <input required type="number" step="0.01" placeholder="Bei ya Kuuza" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} disabled={saving} style={{...inputStyle, fontWeight: 'bold'}} />
              </div>
              <input type="number" placeholder="Idadi ya Stock" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} disabled={saving} style={inputStyle} />
              <input placeholder="Barcode (Hiari)" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} disabled={saving} style={inputStyle} />
              <input placeholder="Kategoria (Hiari)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={saving} style={inputStyle} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={closeForm} disabled={saving} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>Ghairi</button>
                <button type="submit" disabled={saving} className="btn-micro gradient-primary shadow-premium" style={{ flex: 1, padding: '16px', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Inahifadhi...' : (editing ? 'Sasisha' : 'Hifadhi')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {!isMobile && showBottomSheet && (
        <div className="glass shadow-premium" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '2px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 16px', color: colors.text }}>{editing ? 'Hariri Bidhaa' : 'Ongeza Bidhaa Mpya'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <input required placeholder="Jina la Bidhaa" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={saving} style={inputStyle} />
            <input required type="number" step="0.01" placeholder="Bei ya Kununua" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} disabled={saving} style={inputStyle} />
            <input required type="number" step="0.01" placeholder="Bei ya Kuuza" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} disabled={saving} style={{...inputStyle, fontWeight: 'bold'}} />
            <input type="number" placeholder="Stock" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} disabled={saving} style={inputStyle} />
            <input placeholder="Barcode" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} disabled={saving} style={inputStyle} />
            <input placeholder="Kategoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={saving} style={inputStyle} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={saving} className="btn-micro gradient-success shadow-premium" style={{ flex: 1, padding: '12px', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>{saving ? 'Inahifadhi...' : t.saveProduct}</button>
              <button type="button" onClick={closeForm} disabled={saving} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Ghairi</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Products;