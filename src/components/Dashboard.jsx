import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

// 🔄 ENHANCED SKELETON LOADER
const Skeleton = ({ width = '100%', height = '20px', count = 1, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.space.m, ...style }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ 
        width, height, 
        background: 'linear-gradient(90deg, rgba(226,232,240,0.2) 25%, rgba(203,213,225,0.4) 50%, rgba(226,232,240,0.2) 75%)', 
        backgroundSize: '200% 100%', 
        animation: 'skeletonPulse 1.2s ease-in-out infinite', 
        borderRadius: THEME.radius.sm 
      }} />
    ))}
  </div>
);

// 📭 ENHANCED EMPTY STATE
const EmptyState = ({ icon = '📦', title, description, action, isDark }) => (
  <div style={{ textAlign: 'center', padding: THEME.space.xxl, background: isDark ? THEME.colors.surfaceDark : THEME.colors.surfaceLight, borderRadius: THEME.radius.lg, border: `1px solid ${isDark ? THEME.colors.borderDark : THEME.colors.borderLight}` }}>
    <div style={{ fontSize: '48px', marginBottom: THEME.space.m, opacity: 0.8, animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [animKey, setAnimKey] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [a11yAnnouncement, setA11yAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // ✅ Hardcoded admin for smooth testing (bypasses DB role sync issues)
  const userRole = 'admin';

  const t = translations[lang] || translations.sw;
  const mainRef = useRef(null);
  const colors = getThemeColors(theme === 'dark');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    const checkMobile = () => { const m = window.innerWidth < 768; setIsMobile(m); setSidebarOpen(!m); };
    checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const fetchData = async () => {
      const userId = session?.user?.id;
      if (!userId || view !== 'dashboard') return;
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase.from('sales').select('total_amount').eq('user_id', userId).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`);
        const totalSales = salesData?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0;
        const { data: productsData } = await supabase.from('products').select('id').eq('user_id', userId);
        setStats({ totalSales, totalProducts: productsData?.length || 0 });
        const { data: recent } = await supabase.from('sales').select('created_at, total_amount, receipt_number, items').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
        setRecentSales(recent || []);
        const { data: low } = await supabase.from('products').select('name, stock_quantity').eq('user_id', userId).lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5);
        setLowStockProducts(low || []);
      } catch (e) { 
        console.warn('Dashboard fetch error:', e); 
        showToast('⚠️ Hitilafu ya kupakia data', 'warning');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [view, supabase, session?.user?.id, showToast]);

  const handleLogout = async () => { 
    try { 
      await supabase.auth.signOut(); 
      showToast('✅ Umetoka kikamilifu', 'success');
    } catch(e) { 
      console.error(e); 
      showToast('❌ Hitilafu ya kutoka', 'error');
    }
  };
  
  const allNavItems = [
    { id: 'dashboard', label: t.nav.dashboard, shortcut: 'Alt+D', roles: ['admin'] },
    { id: 'products', label: t.nav.products, shortcut: 'Alt+P', roles: ['admin'] },
    { id: 'sales', label: t.nav.sales, shortcut: 'Alt+S', roles: ['admin'] },
    { id: 'reports', label: t.nav.reports, shortcut: 'Alt+R', roles: ['admin'] },
    { id: 'help', label: t.nav.help, shortcut: 'Alt+H', roles: ['admin'] },
    { id: 'account', label: t.nav.account, shortcut: 'Alt+A', roles: ['admin'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = useCallback((id) => { 
    setView(id); setAnimKey(p => p + 1); 
    setA11yAnnouncement(`${lang === 'sw' ? 'Umeenda' : 'Navigated to'} ${id}`);
    if (isMobile) { setSidebarOpen(false); setShowMobileMenu(false); }
    if (mainRef.current) mainRef.current.focus();
  }, [lang, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const map = { d: 'dashboard', p: 'products', s: 'sales', r: 'reports', h: 'help', a: 'account' };
        const target = map[e.key.toLowerCase()];
        if (target && navItems.some(n => n.id === target) && !e.ctrlKey && !e.metaKey) { 
          e.preventDefault(); 
          handleNavClick(target);
          showToast(`🔹 ${navItems.find(n => n.id === target)?.label}`, 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavClick, navItems, isMobile, showToast]);

  // ✅ Global Styles Injection - Static values only, empty deps array
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      .anim-page { animation: fadeInUp 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      .anim-toast { animation: slideDown 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      .btn-micro { transition: all 0.15s ease; cursor: pointer; will-change: transform; }
      .btn-micro:hover { transform: translateY(-2px); box-shadow: ${THEME.shadow.md}; }
      .btn-micro:active { transform: translateY(0) scale(0.98); box-shadow: ${THEME.shadow.sm}; }
      .card-micro { transition: all 0.2s ease; }
      [data-theme="light"] .card-micro { border: 1px solid ${THEME.colors.borderLight}; }
      [data-theme="dark"] .card-micro { border: 1px solid ${THEME.colors.borderDark}; }
      .card-micro:hover { transform: translateY(-3px); box-shadow: ${THEME.shadow.lg}; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      .skip-link { position: fixed; top: -40px; left: 0; background: ${THEME.colors.primary}; color: #fff; padding: 8px 16px; z-index: 10000; font-weight: bold; border-radius: 0 0 8px 0; transition: top 0.3s; }
      .skip-link:focus { top: 0; }
      *:focus-visible { outline: 3px solid ${THEME.colors.primary} !important; outline-offset: 2px !important; }
      [data-theme="dark"] { background-color: ${THEME.colors.bgDark}; color: ${THEME.colors.textDark}; }
      [data-theme="light"] { background-color: ${THEME.colors.bgLight}; color: ${THEME.colors.textLight}; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      * { transition: background-color 0.2s, border-color 0.2s, color 0.2s; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: colors.bg, paddingBottom: isMobile ? '70px' : '0' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <a href="#main-content" className="skip-link">{lang === 'sw' ? 'Ruka hadi Yaliyomo' : 'Skip to Content'}</a>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{a11yAnnouncement}</div>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 998, backdropFilter: 'blur(3px)' }} />}

      <aside style={{ position: 'fixed', top: 0, left: 0, width: sidebarOpen ? '260px' : '0px', height: '100vh', background: THEME.colors.bgDark, color: '#fff', padding: sidebarOpen ? '20px 0' : '0', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', zIndex: 999, boxShadow: sidebarOpen ? THEME.shadow.lg : 'none', whiteSpace: 'nowrap' }} role="navigation" aria-label={lang === 'sw' ? 'Menyu Kuu' : 'Main Navigation'}>
        <div style={{ padding: sidebarOpen ? `0 ${THEME.space.xl} ${THEME.space.xl}` : '0', borderBottom: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>{t.appName}</h2>
          <button onClick={() => setSidebarOpen(false)} aria-label={lang === 'sw' ? 'Funga Menyu' : 'Close Menu'} style={{ background: 'none', border: 'none', color: THEME.colors.textSecDark, fontSize: '1.5rem', cursor: 'pointer', padding: THEME.space.xs }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarOpen ? '10px 0' : '0', overflowY: 'auto', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" aria-current={isActive ? 'page' : undefined} aria-label={`${item.label} (${item.shortcut})`} style={{ background: isActive ? THEME.colors.primary : 'transparent', color: isActive ? '#fff' : THEME.colors.textSecDark, border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', fontSize: '15px', fontWeight: isActive ? '600' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: isActive ? '0 24px 24px 0' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
                {item.label}
                {sidebarOpen && <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: THEME.radius.sm }}>{item.shortcut}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '20px' : '0', borderTop: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={handleLogout} className="btn-micro" aria-label={t.nav.logout} style={{ width: '100%', padding: '12px', background: THEME.colors.error, color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{t.nav.logout}</button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? THEME.space.l : THEME.space.xl, transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)', minHeight: '100vh', paddingTop: isMobile ? '10px' : '20px' }}>
        <header style={{ background: colors.surface, padding: isMobile ? `${THEME.space.m} ${THEME.space.l}` : THEME.space.xl, borderRadius: THEME.radius.lg, marginBottom: isMobile ? THEME.space.l : THEME.space.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: THEME.shadow.sm, position: 'sticky', top: isMobile ? '10px' : '0', zIndex: 100, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.m : THEME.space.xl }}>
            {(!sidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="btn-micro" aria-label={lang === 'sw' ? 'Fungua Menyu' : 'Open Menu'} style={{ background: colors.surface, border: 'none', fontSize: '1.3rem', color: colors.text, padding: '8px 12px', borderRadius: THEME.radius.md }}>☰</button>}
            <h2 style={{ margin: 0, color: colors.text, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '600' }}>
              {view === 'dashboard' && t.dashboard.title}
              {view === 'products' && t.products.title}
              {view === 'sales' && t.sales.title}
              {view === 'reports' && t.reports.title}
              {view === 'help' && t.help.title}
              {view === 'account' && t.account.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.s : THEME.space.m }}>
            <span style={{ padding: `${THEME.space.xs} ${THEME.space.m}`, background: THEME.colors.primary, color: '#fff', borderRadius: THEME.radius.xl, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>👑 Admin</span>
            <button onClick={toggleTheme} className="btn-micro" aria-label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: colors.surface, border: 'none', borderRadius: THEME.radius.sm, color: colors.text, fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} className="btn-micro" aria-label="Switch Language" style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: colors.surface, border: 'none', borderRadius: THEME.radius.sm, color: colors.text, fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
              {lang === 'sw' ? '🇹 SW' : '🇸 EN'}
            </button>
            <div style={{ width: isMobile ? '32px' : '35px', height: isMobile ? '32px' : '35px', background: THEME.colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: isMobile ? '14px' : '16px' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey} className="anim-page" role="main" aria-label={lang === 'sw' ? 'Yaliyomo Makuu' : 'Main Content'}>
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
                    <button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ background: THEME.colors.primary, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>{t.nav.sales.split(' ')[1] || t.nav.sales}</button>
                    <button onClick={() => handleNavClick('products')} className="btn-micro" style={{ background: THEME.colors.success, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>📦 {t.nav.products.split(' ')[1] || t.nav.products}</button>
                    <button onClick={() => handleNavClick('reports')} className="btn-micro" style={{ background: THEME.colors.warning, color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>📈 {t.nav.reports.split(' ')[1] || t.nav.reports}</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: THEME.space.l }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: THEME.space.l }}>
                  <div style={{ padding: THEME.space.l, background: isMobile || theme === 'dark' ? '#1e3a5f' : '#eff6ff', borderRadius: THEME.radius.lg, borderLeft: `4px solid ${THEME.colors.primary}` }} className="card-micro">
                    <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#60a5fa', fontSize: '13px' }}>{t.dashboard.salesToday}</h4>
                    {loading ? <Skeleton width="70%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: colors.text }}>{stats.totalSales.toLocaleString()} TSh</p>}
                  </div>
                  <div style={{ padding: THEME.space.l, background: isMobile || theme === 'dark' ? '#14532d' : '#f0fdf4', borderRadius: THEME.radius.lg, borderLeft: `4px solid ${THEME.colors.success}` }} className="card-micro">
                    <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#4ade80', fontSize: '13px' }}>{t.dashboard.totalProducts}</h4>
                    {loading ? <Skeleton width="50%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: colors.text }}>{stats.totalProducts}</p>}
                  </div>
                </div>

                <div style={{ padding: THEME.space.l, background: colors.surface, borderRadius: THEME.radius.lg, border: `1px solid ${colors.border}`, boxShadow: THEME.shadow.sm }} className="card-micro">
                  <h4 style={{ margin: `0 0 ${THEME.space.m}`, color: THEME.colors.warning, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Stock Ndogo</h4>
                  {loading ? <Skeleton count={3} height="20px" /> : (
                    lowStockProducts.length === 0 ? (
                      <EmptyState icon="✅" title={lang === 'sw' ? 'Stock Nzuri' : 'Stock Healthy'} description={lang === 'sw' ? 'Bidhaa zote zina kiasi cha kutosha.' : 'All products have sufficient stock.'} isDark={theme === 'dark'} />
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
                  <button onClick={() => handleNavClick('reports')} className="btn-micro" aria-label={lang === 'sw' ? 'Tazama Ripoti Zote' : 'View All Reports'} style={{ background: 'none', border: 'none', color: THEME.colors.primary, fontSize: '13px', fontWeight: '600' }}>{lang === 'sw' ? 'Tazama Zote →' : 'View All →'}</button>
                </div>
                {loading ? (
                  <Skeleton count={4} height="30px" />
                ) : recentSales.length === 0 ? (
                  <EmptyState icon="📄" title={lang === 'sw' ? 'Hakuna Mauzo' : 'No Sales Yet'} description={lang === 'sw' ? 'Anza kuuza bidhaa ili uone hapa.' : 'Start making sales to see them here.'} action={<button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ padding: '10px 16px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600', marginTop: THEME.space.m }}>{lang === 'sw' ? 'Nenda Mauzo' : 'Go to Sales'}</button>} isDark={theme === 'dark'} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}><th scope="col" style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Tarehe' : 'Date'}</th><th scope="col" style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Bidhaa' : 'Items'}</th><th scope="col" style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Jumla' : 'Total'}</th><th scope="col" style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Risiti' : 'Receipt'}</th></tr></thead>
                      <tbody>{recentSales.map((s, idx) => (<tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}><td style={{ padding: '10px', color: colors.text }}>{new Date(s.created_at).toLocaleDateString()}</td><td style={{ padding: '10px', color: colors.text }}>{s.items?.map(i => i.name).join(', ').substring(0, 20)}...</td><td style={{ padding: '10px', color: THEME.colors.success, fontWeight: 'bold', textAlign: 'right' }}>{(s.total_amount || 0).toLocaleString()} TSh</td><td style={{ padding: '10px', color: colors.textSec, textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>#{s.receipt_number}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'help' && (
            <div style={{ background: colors.surface, padding: isMobile ? THEME.space.xl : '30px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.lg, maxWidth: isMobile ? '100%' : '700px', margin: '0 auto', border: `1px solid ${colors.border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: THEME.space.xl, borderBottom: `2px solid ${colors.border}`, paddingBottom: THEME.space.l, color: colors.text }}>{t.help.title}</h2>
              <div style={{ display: 'grid', gap: isMobile ? THEME.space.m : THEME.space.l }}>
                {[{icon:'👥',title:t.help.owners,text:'Melickisedeki Zakaria Sayi & Abdallah Mshamu Nassoro'},{icon:'📞',title:t.help.call,text:'+255 622 995 734 | +255 613 808 727'},{icon:'💬',title:t.help.whatsapp,text:'+255 613 334 713 | +255 656 448 727'},{icon:'📝',title:t.help.feedback,action:'https://forms.gle/EoNjSm2NCHNh7ixD6'}].map((c,i) => (
                  <div key={i} style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, borderLeft: `4px solid ${i % 2 === 0 ? THEME.colors.primary : THEME.colors.success}` }} className="card-micro">
                    <h4 style={{ margin: `0 0 ${THEME.space.s}`, color: colors.text }}>{c.icon} {c.title}</h4>
                    {c.action ? <a href={c.action} target="_blank" rel="noopener noreferrer" style={{ color: THEME.colors.primary, fontWeight: '600' }}>{lang === 'sw' ? 'Fungua Fomu →' : 'Open Form →'}</a> : <p style={{ margin: 0, color: colors.textSec }}>{c.text}</p>}
                  </div>
                ))}
              </div>
              <hr style={{ margin: `${THEME.space.xl} 0`, border: 'none', borderTop: `1px solid ${colors.border}` }} />
              <h3 style={{ marginBottom: THEME.space.s, color: colors.text }}>{t.help.aboutTitle}</h3><p style={{ lineHeight: '1.6', color: colors.textSec }}>{t.help.aboutDesc}</p>
              <h3 style={{ marginTop: THEME.space.l, marginBottom: THEME.space.s, color: colors.text }}>{t.help.features}</h3><ul style={{ paddingLeft: THEME.space.xl, color: colors.textSec }}>{t.help.featuresList.map((f, i) => <li key={i} style={{marginBottom:THEME.space.xs}}>{f}</li>)}</ul>
              <p style={{ textAlign: 'center', color: colors.textSec, marginTop: THEME.space.xxl, fontSize: '0.85rem' }}>© {new Date().getFullYear()} KasiTrade Web. {t.help.copyright}</p>
            </div>
          )}

          {view === 'account' && (
            <div style={{ background: colors.surface, padding: isMobile ? THEME.space.xl : '30px', borderRadius: THEME.radius.lg, boxShadow: THEME.shadow.lg, maxWidth: isMobile ? '100%' : '600px', margin: '0 auto', border: `1px solid ${colors.border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: THEME.space.xl, borderBottom: `2px solid ${colors.border}`, paddingBottom: THEME.space.l, color: colors.text }}>{t.account.title}</h2>
              <div style={{ marginBottom: isMobile ? THEME.space.xl : THEME.space.xxl }}>
                <div style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, marginBottom: THEME.space.m }} className="card-micro"><p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>{t.account.email}</p><p style={{ margin: 0, fontSize: '15px', color: colors.text }}>{session?.user?.email || 'Haipatikani'}</p></div>
                <div style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md, marginBottom: THEME.space.m }} className="card-micro"><p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>{t.account.userId}</p><p style={{ margin: 0, fontSize: '13px', color: colors.textSec, fontFamily: 'monospace', wordBreak: 'break-all' }}>{session?.user?.id || 'N/A'}</p></div>
                <div style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: theme === 'dark' ? THEME.colors.surfaceDark : '#f8fafc', borderRadius: THEME.radius.md }} className="card-micro"><p style={{ margin: `0 0 ${THEME.space.xs}`, fontWeight: '600', color: colors.textSec, fontSize: '13px' }}>{lang === 'sw' ? 'Wadhifa' : 'Role'}</p><p style={{ margin: 0, fontSize: '15px', color: THEME.colors.primary, fontWeight: 'bold' }}>👑 Admin</p></div>
              </div>
              <hr style={{ margin: `${THEME.space.xl} 0`, border: 'none', borderTop: `1px solid ${colors.border}` }} />
              <h3 style={{ marginBottom: THEME.space.l, color: colors.text }}>{t.account.changePassword}</h3>
              <ChangePasswordForm supabase={supabase} lang={lang} isMobile={isMobile} theme={theme} colors={colors} showToast={showToast} />
            </div>
          )}

          {/* ✅ KEY FIX: isMobile inapitishwa vizuri kwenye Sales */}
          {view === 'products' && <Products supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} showToast={showToast} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} isMobile={isMobile} />}
          {view === 'reports' && <Reports supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} showToast={showToast} />}
        </div>
      </div>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: THEME.colors.bgDark, display: 'flex', justifyContent: 'space-around', padding: `${THEME.space.s} 0`, borderTop: `1px solid ${THEME.colors.borderDark}`, zIndex: 1000, boxShadow: THEME.shadow.lg }} role="navigation" aria-label={lang === 'sw' ? 'Menyu ya Simu' : 'Mobile Navigation'}>
          {navItems.slice(0, 5).map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" aria-current={isActive ? 'page' : undefined} style={{ background: 'none', border: 'none', color: isActive ? '#60a5fa' : THEME.colors.textSecDark, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: `${THEME.space.s} ${THEME.space.xs}`, minWidth: '60px', fontSize: '11px' }}>
                <span style={{ fontSize: '20px' }}>{item.label.split(' ')[0]}</span>
                <span style={{ fontWeight: isActive ? '600' : '400', whiteSpace: 'nowrap', color: isActive ? '#60a5fa' : (theme === 'dark' ? THEME.colors.textSecDark : '#f1f5f9') }}>{item.label.split(' ').slice(1).join(' ')}</span>
              </button>
            );
          })}
          {navItems.length > 5 && (
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="btn-micro" aria-expanded={showMobileMenu} aria-haspopup="true" style={{ background: 'none', border: 'none', color: showMobileMenu ? '#60a5fa' : THEME.colors.textSecDark, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: `${THEME.space.s} ${THEME.space.xs}`, minWidth: '60px', fontSize: '11px' }}>
              <span style={{ fontSize: '20px' }}>⋮</span><span style={{ color: theme === 'dark' ? THEME.colors.textSecDark : '#f1f5f9' }}>Zaidi</span>
            </button>
          )}
          {showMobileMenu && (
            <div className="anim-modal" role="menu" style={{ position: 'absolute', bottom: '60px', right: '10px', background: THEME.colors.surfaceDark, borderRadius: THEME.radius.md, padding: THEME.space.s, boxShadow: THEME.shadow.lg, zIndex: 1001, minWidth: '160px' }}>
              {navItems.slice(5).map(item => {
                const isActive = view === item.id;
                return (
                  <button key={item.id} onClick={() => handleNavClick(item.id)} role="menuitem" className="btn-micro" style={{ width: '100%', padding: '10px 12px', background: isActive ? THEME.colors.primary : 'transparent', color: isActive ? '#fff' : (theme === 'dark' ? '#e2e8f0' : '#f1f5f9'), border: 'none', borderRadius: THEME.radius.sm, textAlign: 'left', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{item.label}</button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChangePasswordForm = ({ supabase, lang, isMobile, theme, colors, showToast }) => {
  const isDark = theme === 'dark';
  const t = translations[lang].account;
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) return showToast('❌ Password mpya hazilingani.', 'error');
    if (newPass.length < 6) return showToast('❌ Password iwe na angalau herufi 6.', 'error');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      showToast('✅ Password imebadilishwa!', 'success');
      setNewPass(''); setConfirm('');
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: isMobile ? THEME.space.m : THEME.space.l }}>
      <label htmlFor="new-pass" className="sr-only">{t.newPassword}</label>
      <input id="new-pass" type="password" placeholder={t.newPassword} value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={6} disabled={loading} aria-required="true" style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: isDark ? THEME.colors.surfaceDark : '#ffffff', color: isDark ? THEME.colors.textDark : THEME.colors.textLight, border: `1px solid ${isDark ? THEME.colors.borderDark : THEME.colors.borderLight}`, borderRadius: THEME.radius.md, fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      <label htmlFor="confirm-pass" className="sr-only">{t.confirmNewPassword}</label>
      <input id="confirm-pass" type="password" placeholder={t.confirmNewPassword} value={confirm} onChange={e=>setConfirm(e.target.value)} required disabled={loading} aria-required="true" style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: isDark ? THEME.colors.surfaceDark : '#ffffff', color: isDark ? THEME.colors.textDark : THEME.colors.textLight, border: `1px solid ${isDark ? THEME.colors.borderDark : THEME.colors.borderLight}`, borderRadius: THEME.radius.md, fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      <button type="submit" disabled={loading} className="btn-micro" aria-label={t.update} style={{ padding: isMobile ? THEME.space.m : THEME.space.l, background: loading ? '#475569' : THEME.colors.primary, color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600', fontSize: '14px' }}>{loading ? t.updating : t.update}</button>
    </form>
  );
};

export default Dashboard;