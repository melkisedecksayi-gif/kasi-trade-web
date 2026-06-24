import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const fmt = (val) => { 
  if (val == null || val === '') return '0'; 
  const n = Number(val); 
  return isNaN(n) ? '0' : n.toLocaleString(); 
};

const Products = ({ supabase, lang, userId, theme, showToast: parentShowToast, mode = 'cashier', session }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang]?.products || translations.sw.products;
  const g = translations[lang]?.general || translations.sw.general;
  
  // ✅ Fallback userId
  const effectiveUserId = userId || session?.user?.id;
  
  console.log('🔍 Products - userId:', userId, '| session:', session?.user?.id, '| effective:', effectiveUserId);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState('');

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

  // ✅ Load products
  useEffect(() => {
    if (!supabase) {
      console.error('❌ Supabase client missing');
      setLoadError('Database haiko tayari');
      setLoading(false);
      return;
    }
    
    if (!effectiveUserId) {
      console.error('❌ User ID missing');
      setLoadError('User ID haipatikani. Tafadhali ingia tena.');
      setLoading(false);
      return;
    }
    
    let active = true;
    const fetch = async () => {
      try {
        setLoading(true);
        setLoadError('');
        console.log('📡 Fetching products for user:', effectiveUserId);
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('name');
        
        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }
        
        console.log('✅ Products loaded:', data?.length || 0);
        
        if (active) {
          setProducts(Array.isArray(data) ? data : []);
          if (data.length === 0) {
            console.log('⚠️ No products found');
          }
        }
      } catch (err) { 
        console.error('❌ Fetch error:', err);
        setLoadError(err.message || 'Imeshindwa kupakia bidhaa');
        showToast('❌ Imeshindwa kupakia bidhaa', 'error');
      } finally { 
        if (active) setLoading(false); 
      }
    };
    
    fetch();
    return () => { active = false; };
  }, [supabase, effectiveUserId, lang, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    if (!effectiveUserId) { 
      showToast('❌ User ID haipatikani.', 'error'); 
      return; 
    }
    if (!form.name.trim()) { showToast('❌ Jina la bidhaa linahitajika!', 'error'); return; }
    if (!form.selling_price || Number(form.selling_price) <= 0) { showToast('❌ Bei ya kuuza inahitajika!', 'error'); return; }
    
    setSaving(true);
    try {
      const payload = { 
        name: form.name.trim(), 
        cost_price: Number(form.cost_price) || 0, 
        selling_price: Number(form.selling_price) || 0, 
        stock_quantity: Number(form.stock_quantity) || 0, 
        barcode: form.barcode?.trim() || null, 
        category: form.category?.trim() || null, 
        user_id: effectiveUserId 
      };
      
      let result;
      if (editing) {
        result = await supabase.from('products').update(payload).eq('id', editing.id).eq('user_id', effectiveUserId).select();
      } else {
        result = await supabase.from('products').insert(payload).select();
      }
      
      if (result.error) throw result.error;
      
      const { data: updatedProducts } = await supabase.from('products').select('*').eq('user_id', effectiveUserId).order('name');
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      
      showToast(editing ? '✅ Bidhaa imesasishwa!' : t.saved, 'success');
      setShowForm(false); 
      setEditing(null);
      setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' });
      
    } catch (err) { 
      showToast(`❌ ${err.message || 'Hitilafu ya kuhifadhi'}`, 'error'); 
    } finally { 
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
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
    if (mode === 'admin') return showToast('🔒 Hali ya Admin inaruhusu kutazama tu.', 'warning');
    if (!window.confirm(g.confirm + '?')) return;
    if (!effectiveUserId) {
      showToast('❌ User ID haipatikani.', 'error');
      return;
    }
    try {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('user_id', effectiveUserId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(t.deleted, 'success');
    } catch (err) { 
      showToast('❌ Imeshindwa kufuta', 'error'); 
    }
  };

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && String(p.barcode).includes(search))
  );

  // ✅ Mobile-optimized styles
  const containerStyle = {
    background: colors.surface,
    padding: isMobile ? '12px' : THEME.space.xl,
    borderRadius: THEME.radius.lg,
    boxShadow: THEME.shadow.sm,
    border: `1px solid ${colors.border}`,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    minHeight: '300px'
  };

  const buttonStyle = {
    padding: isMobile ? '14px 20px' : `${THEME.space.m} ${THEME.space.l}`,
    fontSize: isMobile ? '15px' : '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: THEME.radius.md,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: 'all 0.2s'
  };

  const inputStyle = {
    padding: isMobile ? '14px' : THEME.space.m,
    fontSize: '16px', // ✅ Prevent iOS zoom
    background: colors.surface,
    color: colors.text,
    border: `2px solid ${colors.border}`,
    borderRadius: THEME.radius.md,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <div style={containerStyle}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ✅ Header with Search */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : THEME.space.m,
        marginBottom: isMobile ? '16px' : THEME.space.xl
      }}>
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={inputStyle}
        />
        {mode === 'cashier' && (
          <button 
            onClick={() => { 
              setShowForm(true); 
              setEditing(null); 
              setForm({ name: '', cost_price: '', selling_price: '', stock_quantity: '', barcode: '', category: '' }); 
            }} 
            disabled={saving}
            style={{
              ...buttonStyle,
              background: saving ? '#475569' : THEME.colors.primary,
              color: '#fff',
              opacity: saving ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {t.addProduct}
          </button>
        )}
      </div>
      
      {/* ✅ Error Message */}
      {loadError && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: '16px',
          borderRadius: THEME.radius.md,
          marginBottom: THEME.space.m,
          border: '1px solid #fecaca',
          fontSize: isMobile ? '14px' : '15px'
        }}>
          ⚠️ {loadError}
        </div>
      )}
      
      {/* ✅ Form */}
      {showForm && mode === 'cashier' && (
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            background: isDark ? THEME.colors.surfaceDark : '#f8fafc', 
            padding: isMobile ? '16px' : THEME.space.l,
            borderRadius: THEME.radius.lg, 
            marginBottom: isMobile ? '16px' : THEME.space.xl, 
            display: 'grid', 
            gap: '12px', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            border: `2px solid ${THEME.colors.primary}`
          }}
        >
          <input required placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={saving} style={inputStyle} />
          <input required type="number" step="0.01" placeholder={t.buyingPrice} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} disabled={saving} style={inputStyle} />
          <input required type="number" step="0.01" placeholder={t.sellingPrice} value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} disabled={saving} style={{...inputStyle, fontWeight: 'bold'}} />
          <input type="number" placeholder={t.stock} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} disabled={saving} style={inputStyle} />
          <input placeholder={t.barcode} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} disabled={saving} style={inputStyle} />
          <input placeholder={t.category} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={saving} style={inputStyle} />
          
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px' 
          }}>
            <button 
              type="submit" 
              disabled={saving} 
              style={{
                ...buttonStyle,
                flex: 1,
                background: saving ? '#475569' : THEME.colors.success,
                color: '#fff',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {saving ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                  {lang === 'sw' ? 'Inahifadhi...' : 'Saving...'}
                </>
              ) : (
                t.saveProduct
              )}
            </button>
            <button 
              type="button" 
              onClick={() => { setShowForm(false); setEditing(null); }} 
              disabled={saving}
              style={{
                ...buttonStyle,
                flex: 1,
                background: colors.surface,
                color: colors.text,
                border: `2px solid ${colors.border}`,
                opacity: saving ? 0.6 : 1
              }}
            >
              {lang === 'sw' ? 'Ghairi' : 'Cancel'}
            </button>
          </div>
          
          {form.cost_price && form.selling_price && Number(form.selling_price) > Number(form.cost_price) && (
            <p style={{ 
              gridColumn: '1 / -1', 
              margin: '8px 0 0', 
              fontSize: isMobile ? '14px' : '15px',
              color: THEME.colors.success, 
              textAlign: 'center', 
              fontWeight: 'bold' 
            }}>
              {t.profitCalc} {(Number(form.selling_price) - Number(form.cost_price)).toLocaleString()} TSh
            </p>
          )}
        </form>
      )}
      
      {/* ✅ Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '60px 20px' : '80px 20px' }}>
          <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: THEME.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ color: colors.textSec, marginTop: '20px', fontSize: isMobile ? '15px' : '16px' }}>{g.loading}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '60px 20px' : '80px 20px',
          background: isDark ? THEME.colors.surfaceDark : '#f8fafc', 
          borderRadius: THEME.radius.md,
          border: `2px dashed ${colors.border}`
        }}>
          <div style={{ fontSize: isMobile ? '50px' : '60px', marginBottom: '16px' }}>📦</div>
          <p style={{ color: colors.text, fontSize: isMobile ? '15px' : '16px', fontWeight: '600', marginBottom: '8px' }}>
            {t.noProducts}
          </p>
          {mode === 'cashier' && (
            <button 
              onClick={() => setShowForm(true)}
              style={{
                ...buttonStyle,
                background: THEME.colors.primary,
                color: '#fff',
                marginTop: '16px'
              }}
            >
              {t.addProduct}
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: isMobile ? '12px' : THEME.space.m 
        }}>
          {filtered.map((p, index) => {
            const profit = (p.selling_price || 0) - (p.cost_price || 0);
            return (
              <div key={p.id || index} style={{ 
                border: `2px solid ${colors.border}`, 
                borderRadius: THEME.radius.lg, 
                padding: isMobile ? '14px' : THEME.space.l,
                background: isDark ? THEME.colors.surfaceDark : '#ffffff', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: 0, fontSize: isMobile ? '16px' : '17px', color: colors.text, fontWeight: '600', wordBreak: 'break-word' }}>{p.name}</h4>
                <p style={{ margin: 0, color: THEME.colors.success, fontWeight: 'bold', fontSize: isMobile ? '1.2rem' : '1.3rem' }}>
                  {fmt(p.selling_price)} TSh
                </p>
                
                {mode === 'admin' && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '10px', 
                    background: isDark ? '#1e3a5f' : '#eff6ff', 
                    borderRadius: THEME.radius.md, 
                    borderLeft: `4px solid ${THEME.colors.primary}` 
                  }}>
                    <p style={{ margin: '3px 0', fontSize: isMobile ? '12px' : '13px', color: THEME.colors.warning, fontWeight: '600' }}>
                      🏷️ Kununua: {fmt(p.cost_price)} TSh
                    </p>
                    <p style={{ margin: '3px 0', fontSize: isMobile ? '13px' : '14px', color: THEME.colors.success, fontWeight: 'bold' }}>
                      📈 Faida: {fmt(profit)} TSh
                    </p>
                  </div>
                )}
                
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '13px' : '14px', color: colors.textSec }}>
                  📦 {t.stock}: <strong style={{ color: (p.stock_quantity || 0) < 5 ? THEME.colors.error : colors.text }}>{p.stock_quantity ?? '-'}</strong>
                </p>
                
                {p.category && (
                  <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: colors.textSec, fontStyle: 'italic' }}>
                    🏷️ {p.category}
                  </p>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: 'auto', 
                  paddingTop: '8px',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <button 
                    onClick={() => handleEdit(p)} 
                    disabled={mode === 'admin'} 
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      padding: isMobile ? '12px' : '10px',
                      fontSize: isMobile ? '14px' : '13px',
                      background: mode === 'admin' ? '#475569' : THEME.colors.primary,
                      color: '#fff',
                      opacity: mode === 'admin' ? 0.5 : 1
                    }}
                  >
                    {t.editProduct}
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    disabled={mode === 'admin'} 
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      padding: isMobile ? '12px' : '10px',
                      fontSize: isMobile ? '14px' : '13px',
                      background: mode === 'admin' ? '#475569' : THEME.colors.error,
                      color: '#fff',
                      opacity: mode === 'admin' ? 0.5 : 1
                    }}
                  >
                    {t.deleteProduct}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;