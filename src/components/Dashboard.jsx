import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const Skeleton = ({ width = '100%', height = '20px', count = 1, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.space.m, ...style }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ width, height, background: 'linear-gradient(90deg, rgba(226,232,240,0.2) 25%, rgba(203,213,225,0.4) 50%, rgba(226,232,240,0.2) 75%)', backgroundSize: '200% 100%', animation: 'skeletonPulse 1.2s ease-in-out infinite', borderRadius: THEME.radius.sm }} />
    ))}
  </div>
);

const EmptyState = ({ icon = '📦', title, description, action, isDark }) => (
  <div style={{ textAlign: 'center', padding: THEME.space.xxl, background: isDark ? THEME.colors.surfaceDark : THEME.colors.surfaceLight, borderRadius: THEME.radius.lg, border: `1px solid ${isDark ? THEME.colors.borderDark : THEME.colors.borderLight}` }}>
    <div style={{ fontSize: '48px', marginBottom: THEME.space.m, opacity: 0.8 }}>{icon}</div>
    <h3 style={{ margin: `0 0 ${THEME.space.s}`, fontSize: '18px', color: isDark ? THEME.colors.textDark : THEME.colors.textLight }}>{title}</h3>
    <p style={{ margin: `0 0 ${THEME.space.m}`, color: isDark ? THEME.colors.textSecDark : THEME.colors.textSecLight }}>{description}</p>
    {action}
  </div>
);

const Dashboard = ({ session, supabase }) => {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('sw');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [animKey, setAnimKey] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [userRole, setUserRole] = useState('cashier');
  const [shopId, setShopId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'admin');

  const t = translations[lang] || translations.sw;
  const mainRef = useRef(null);
  const colors = getThemeColors(theme === 'dark');
  
  const effectiveRole = userRole === 'admin' ? viewMode : 'cashier';

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('role, shop_id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.warn('Profile error:', profileError.message);
          setUserRole('cashier');
          setShopId(session.user.id);
          return;
        }
        
        if (data) {
          const fetchedRole = data.role ? String(data.role).toLowerCase().trim() : 'cashier';
          setUserRole(fetchedRole);
          setShopId(data.shop_id || session.user.id);
          if (fetchedRole === 'cashier') {
            setViewMode('cashier');
          }
        } else {
          setUserRole('cashier');
          setShopId(session.user.id);
        }
      } catch (err) {
        console.warn('Profile fetch failed', err);
        setUserRole('cashier');
        setShopId(session?.user?.id);
      }
    };
    fetchProfile();
  }, [session, supabase]);

  useEffect(() => {
    const checkMobile = () => { const m = window.innerWidth < 768; setIsMobile(m); setSidebarOpen(!m); };
    checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(l => l === 'sw' ? 'en' : 'sw');
  
  const toggleViewMode = () => {
    if (userRole === 'admin') {
      setViewMode(prev => prev === 'admin' ? 'cashier' : 'admin');
      showToast(viewMode === 'admin' ? '🛒 Umebadilisha kuwa Cashier View' : '👑 Umebadilisha kuwa Admin View', 'info');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!shopId || view !== 'dashboard') return;
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase.from('sales').select('total_amount').eq('shop_id', shopId).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`);
        const totalSales = salesData?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0;
        const { data: productsData } = await supabase.from('products').select('id').eq('shop_id', shopId);
        setStats({ totalSales, totalProducts: productsData?.length || 0 });
        const { data: recent } = await supabase.from('sales').select('created_at, total_amount, receipt_number, items').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(5);
        setRecentSales(recent || []);
        const { data: low } = await supabase.from('products').select('name, stock_quantity').eq('shop_id', shopId).lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5);
        setLowStockProducts(low || []);
      } catch (e) { 
        console.warn('Dashboard fetch error:', e); 
        showToast('⚠️ Hitilafu ya kupakia data', 'warning');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [view, supabase, shopId, showToast]);

  const handleLogout = async () => { 
    try { await supabase.auth.signOut(); showToast('✅ Umetoka kikamilifu', 'success'); } 
    catch(e) { console.error(e); showToast('❌ Hitilafu ya kutoka', 'error'); }
  };
  
  const allNavItems = [
    { id: 'dashboard', label: t.nav.dashboard, shortcut: 'Alt+D', roles: ['admin', 'cashier'] },
    { id: 'products', label: t.nav.products, shortcut: 'Alt+P', roles: ['admin', 'cashier'] },
    { id: 'sales', label: t.nav.sales, shortcut: 'Alt+S', roles: ['admin', 'cashier'] },
    { id: 'reports', label: t.nav.reports, shortcut: 'Alt+R', roles: ['admin'] },
    { id: 'help', label: t.nav.help, shortcut: 'Alt+H', roles: ['admin', 'cashier'] },
    { id: 'account', label: t.nav.account, shortcut: 'Alt+A', roles: ['admin', 'cashier'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(effectiveRole));

  const handleNavClick = useCallback((id) => { 
    setView(id); setAnimKey(p => p + 1); 
    if (isMobile) { setSidebarOpen(false); }
    if (mainRef.current) mainRef.current.focus();
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const map = { d: 'dashboard', p: 'products', s: 'sales', r: 'reports', h: 'help', a: 'account' };
        const target = map[e.key.toLowerCase()];
        if (target && navItems.some(n => n.id === target) && !e.ctrlKey && !e.metaKey) { 
          e.preventDefault(); handleNavClick(target);
          showToast(`🔹 ${navItems.find(n => n.id === target)?.label}`, 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavClick, navItems, isMobile, showToast]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .anim-page { animation: fadeInUp 0.35s ease forwards; }
      .btn-micro { transition: all 0.15s ease; cursor: pointer; }
      .btn-micro:hover { transform: translateY(-2px); box-shadow: ${THEME.shadow.md}; }
      .card-micro { transition: all 0.2s ease; }
      .card-micro:hover { transform: translateY(-3px); box-shadow: ${THEME.shadow.lg}; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      * { transition: background-color 0.2s, border-color 0.2s, color 0.2s; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: colors.bg, paddingBottom: isMobile ? '70px' : '0' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside style={{ position: 'fixed', top: 0, left: 0, width: sidebarOpen ? '260px' : '0px', height: '100vh', background: THEME.colors.bgDark, color: '#fff', padding: sidebarOpen ? '20px 0' : '0', overflow: 'hidden', transition: 'all 0.35s', zIndex: 999, boxShadow: sidebarOpen ? THEME.shadow.lg : 'none' }}>
        <div style={{ padding: sidebarOpen ? `0 ${THEME.space.xl} ${THEME.space.xl}` : '0', borderBottom: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>{t.appName}</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <nav style={{ padding: sidebarOpen ? '10px 0' : '0' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" style={{ 
                background: isActive ? THEME.colors.primary : 'transparent', color: isActive ? '#fff' : '#94a3b8', 
                border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', fontSize: '15px', 
                fontWeight: isActive ? '600' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                borderRadius: isActive ? '0 24px 24px 0' : '0'
              }}>
                {item.label}
                {sidebarOpen && <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: THEME.radius.sm }}>{item.shortcut}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '20px' : '0', borderTop: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none' }}>
          <button onClick={handleLogout} className="btn-micro" style={{ width: '100%', padding: '12px', background: THEME.colors.error, color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600' }}>{t.nav.logout}</button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? THEME.space.l : THEME.space.xl, transition: 'margin-left 0.35s', minHeight: '100vh' }}>
        <header style={{ background: colors.surface, padding: isMobile ? `${THEME.space.m} ${THEME.space.l}` : THEME.space.xl, borderRadius: THEME.radius.lg, marginBottom: isMobile ? THEME.space.l : THEME.space.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: THEME.shadow.sm, position: 'sticky', top: isMobile ? '10px' : '0', zIndex: 100, border: `1px solid ${colors.border}`, flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.m : THEME.space.xl }}>
            {(!sidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="btn-micro" style={{ background: colors.surface, border: 'none', fontSize: '1.3rem', color: colors.text, padding: '8px 12px', borderRadius: THEME.radius.md }}>☰</button>}
            <h2 style={{ margin: 0, color: colors.text, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '600' }}>
              {view === 'dashboard' && t.dashboard.title}
              {view === 'products' && t.products.title}
              {view === 'sales' && t.sales.title}
              {view === 'reports' && t.reports.title}
              {view === 'help' && t.help.title}
              {view === 'account' && t.account.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.s : THEME.space.m, flexWrap: 'wrap' }}>
            
            {userRole === 'admin' && (
              <button 
                onClick={toggleViewMode} 
                className="btn-micro" 
                style={{ 
                  padding: isMobile ? '6px 10px' : '8px 14px', 
                  background: viewMode === 'admin' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: THEME.radius.sm, 
                  fontWeight: '700', 
                  fontSize: isMobile ? '11px' : '13px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                {viewMode === 'admin' ? '👁️ Ona kama Cashier' : '👁️ Ona kama Admin'}
              </button>
            )}
            
            <span style={{ padding: `${THEME.space.xs} ${THEME.space.m}`, background: effectiveRole === 'admin' ? THEME.colors.primary : THEME.colors.success, color: '#fff', borderRadius: THEME.radius.xl, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>
              {effectiveRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}
            </span>
            <button onClick={toggleTheme} className="btn-micro" style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.sm, color: colors.text, fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={toggleLang} className="btn-micro" style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: THEME.radius.sm, color: colors.text, fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
              {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
            </button>
            <div style={{ width: isMobile ? '32px' : '35px', height: isMobile ? '32px' : '35px', background: THEME.colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: isMobile ? '14px' : '16px' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey} className="anim-page">
          {view === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? THEME.space.l : THEME.space.xl }}>
              <div style={{ background: colors.surface, padding: isMobile ? THEME.space.xl : '25px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.sm, border: `1px solid ${colors.border}` }} className="card-micro">
                <h2 style={{ margin: `0 0 ${THEME.space.s}`, color: colors.text }}>{t.general.welcome}, {session?.user?.email?.split('@')[0] || 'Mtu'}! 👋</h2>
                <p style={{ color: colors.textSec, margin: `0 0 ${THEME.space.xl}` }}>{t.dashboard.subtitle}</p>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: THEME.space.l }}>
                    <Skeleton height="60px" /> <Skeleton height="60px" /> <Skeleton height="60px" />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: THEME.space.l }}>
                    <button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ background: THEME.colors.primary, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px' }}>🛒 {t.nav.sales}</button>
                    <button onClick={() => handleNavClick('products')} className="btn-micro" style={{ background: THEME.colors.success, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px' }}>📦 {t.nav.products}</button>
                    {effectiveRole === 'admin' && (
                      <button onClick={() => handleNavClick('reports')} className="btn-micro" style={{ background: THEME.colors.warning, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px' }}>📈 {t.nav.reports}</button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: THEME.space.l }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: THEME.space.l }}>
                  <div style={{ padding: THEME.space.l, background: theme === 'dark' ? '#1e3a5f' : '#eff6ff', borderRadius: THEME.radius.lg, borderLeft: `4px solid ${THEME.colors.primary}` }} className="card-micro">
                    <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#60a5fa', fontSize: '13px' }}>{t.dashboard.salesToday}</h4>
                    {loading ? <Skeleton width="70%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: colors.text }}>{stats.totalSales.toLocaleString()} TSh</p>}
                  </div>
                  <div style={{ padding: THEME.space.l, background: theme === 'dark' ? '#14532d' : '#f0fdf4', borderRadius: THEME.radius.lg, borderLeft: `4px solid ${THEME.colors.success}` }} className="card-micro">
                    <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#4ade80', fontSize: '13px' }}>{t.dashboard.totalProducts}</h4>
                    {loading ? <Skeleton width="50%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: colors.text }}>{stats.totalProducts}</p>}
                  </div>
                </div>

                <div style={{ padding: THEME.space.l, background: colors.surface, borderRadius: THEME.radius.lg, border: `1px solid ${colors.border}`, boxShadow: THEME.shadow.sm }} className="card-micro">
                  <h4 style={{ margin: `0 0 ${THEME.space.m}`, color: THEME.colors.warning, fontSize: '14px' }}>⚠️ Stock Ndogo</h4>
                  {loading ? <Skeleton count={3} height="20px" /> : (
                    lowStockProducts.length === 0 ? (
                      <EmptyState icon="✅" title="Stock Nzuri" description="Bidhaa zote zina kiasi cha kutosha." isDark={theme === 'dark'} />
                    ) : (
                      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {lowStockProducts.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: `${THEME.space.s} 0`, borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>
                            <span style={{ color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.name}</span>
                            <span style={{ color: THEME.colors.error, fontWeight: 'bold' }}>{p.stock_quantity || 0} {lang === 'sw' ? 'po' : 'left'}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div style={{ background: colors.surface, padding: '20px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.sm, border: `1px solid ${colors.border}` }} className="card-micro">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.space.l }}>
                  <h3 style={{ margin: 0, color: colors.text, fontSize: '16px' }}>🕒 {lang === 'sw' ? 'Mauzo ya Hivi Punde' : 'Recent Sales'}</h3>
                  {effectiveRole === 'admin' && (
                    <button onClick={() => handleNavClick('reports')} className="btn-micro" style={{ background: 'none', border: 'none', color: THEME.colors.primary, fontSize: '13px', fontWeight: '600' }}>{lang === 'sw' ? 'Tazama Zote →' : 'View All →'}</button>
                  )}
                </div>
                {loading ? (
                  <Skeleton count={4} height="30px" />
                ) : recentSales.length === 0 ? (
                  <EmptyState icon="📄" title="Hakuna Mauzo" description="Anza kuuza bidhaa ili uone hapa." action={<button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ padding: '10px 16px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600', marginTop: THEME.space.m }}>Nenda Mauzo</button>} isDark={theme === 'dark'} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Tarehe</th><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Bidhaa</th><th style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Jumla</th><th style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Risiti</th></tr></thead>
                      <tbody>{recentSales.map((s, idx) => (<tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}><td style={{ padding: '10px', color: colors.text }}>{new Date(s.created_at).toLocaleDateString()}</td><td style={{ padding: '10px', color: colors.text }}>{s.items?.map(i => i.name).join(', ').substring(0, 20)}...</td><td style={{ padding: '10px', color: THEME.colors.success, fontWeight: 'bold', textAlign: 'right' }}>{(s.total_amount || 0).toLocaleString()} TSh</td><td style={{ padding: '10px', color: colors.textSec, textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>#{s.receipt_number}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'products' && <Products supabase={supabase} lang={lang} shopId={shopId} theme={theme} showToast={showToast} userRole={effectiveRole} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} shopId={shopId} theme={theme} />}
          {view === 'reports' && effectiveRole === 'admin' && <Reports supabase={supabase} lang={lang} shopId={shopId} theme={theme} showToast={showToast} />}
          
          {view === 'reports' && effectiveRole !== 'admin' && (
            <div style={{ textAlign: 'center', padding: '60px', background: colors.surface, borderRadius: THEME.radius.lg, border: `1px solid ${colors.border}` }}>
              <h3 style={{ color: THEME.colors.warning }}>🚫 Huna ruhusa ya kutazama ripoti.</h3>
              <button onClick={() => handleNavClick('dashboard')} style={{ marginTop: '15px', padding: '10px 20px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Rudi Dashboard</button>
            </div>
          )}

          {view === 'help' && (
            <div style={{ background: colors.surface, padding: '32px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.lg, maxWidth: '700px', margin: '0 auto', border: `1px solid ${colors.border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: THEME.space.xl, color: colors.text }}>{t.help.title}</h2>
              <div style={{ display: 'grid', gap: THEME.space.l }}>
                {[{icon:'👥',title:'Wamiliki',text:'Melickisedeki Zakaria Sayi & Abdallah Mshamu Nassoro'},{icon:'📞',title:'Simu',text:'+255 622 995 734 | +255 613 808 727'},{icon:'💬',title:'WhatsApp',text:'+255 613 334 713 | +255 656 448 727'}].map((c,i) => (
                  <div key={i} style={{ padding: THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, borderLeft: `4px solid ${i % 2 === 0 ? THEME.colors.primary : THEME.colors.success}` }}>
                    <h4 style={{ margin: `0 0 ${THEME.space.s}`, color: colors.text }}>{c.icon} {c.title}</h4>
                    <p style={{ margin: 0, color: colors.textSec }}>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'account' && (
            <div style={{ background: colors.surface, padding: '32px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.lg, maxWidth: '600px', margin: '0 auto', border: `1px solid ${colors.border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: THEME.space.xl, color: colors.text }}>{t.account.title}</h2>
              <div style={{ marginBottom: THEME.space.l }}>
                <div style={{ padding: THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, marginBottom: THEME.space.m }}>
                  <p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>Email</p>
                  <p style={{ margin: 0, fontSize: '15px', color: colors.text }}>{session?.user?.email}</p>
                </div>
                <div style={{ padding: THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md }}>
                  <p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>Wadhifa Halisi</p>
                  <p style={{ margin: 0, fontSize: '15px', color: userRole === 'admin' ? THEME.colors.primary : THEME.colors.success, fontWeight: 'bold' }}>
                    {userRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}
                  </p>
                </div>
                {userRole === 'admin' && (
                  <div style={{ padding: THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, marginTop: THEME.space.m }}>
                    <p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>Mtazamo wa Sasa</p>
                    <p style={{ margin: 0, fontSize: '15px', color: viewMode === 'admin' ? THEME.colors.primary : THEME.colors.success, fontWeight: 'bold' }}>
                      {viewMode === 'admin' ? '👑 Mtazamo wa Admin' : '🛒 Mtazamo wa Cashier'}
                    </p>
                    <p style={{ margin: `${THEME.space.xs} 0 0`, fontSize: '12px', color: colors.textSec }}>
                      Bonyeza button ya "Ona kama..." juu kubadilisha.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: THEME.colors.bgDark, display: 'flex', justifyContent: 'space-around', padding: `${THEME.space.s} 0`, borderTop: `1px solid ${THEME.colors.borderDark}`, zIndex: 1000, boxShadow: THEME.shadow.lg }}>
          {navItems.slice(0, 5).map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" style={{ background: 'none', border: 'none', color: isActive ? '#60a5fa' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: `${THEME.space.s} ${THEME.space.xs}`, minWidth: '60px', fontSize: '11px' }}>
                <span style={{ fontSize: '20px' }}>{item.label.split(' ')[0]}</span>
                <span style={{ fontWeight: isActive ? '600' : '400', whiteSpace: 'nowrap' }}>{item.label.split(' ').slice(1).join(' ')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;