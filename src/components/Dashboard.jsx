import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import Settings from './Settings';
import Help from './Help';
import Footer from './Footer';
import Auth from './Auth';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const EmptyState = ({ icon = '', title, description, action, isDark }) => (
  <div style={{ textAlign: 'center', padding: THEME.space.xxl, background: isDark ? THEME.colors.surfaceDark : THEME.colors.surfaceLight, borderRadius: THEME.radius.lg, border: `1px solid ${isDark ? THEME.colors.borderDark : THEME.colors.borderLight}` }}>
    <div style={{ fontSize: '48px', marginBottom: THEME.space.m, opacity: 0.8, animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
    <h3 style={{ margin: `0 0 ${THEME.space.s}`, fontSize: '18px', color: isDark ? THEME.colors.textDark : THEME.colors.textLight }}>{title}</h3>
    <p style={{ margin: `0 0 ${THEME.space.m}`, color: isDark ? THEME.colors.textSecDark : THEME.colors.textSecLight }}>{description}</p>
    {action}
  </div>
);

const Dashboard = ({ supabase }) => {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [animKey, setAnimKey] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('cashier');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [weeklyChartData, setWeeklyChartData] = useState([]);
  const [topProduct, setTopProduct] = useState(null);

  const t = translations[lang] || translations.sw;
  const mainRef = useRef(null);
  const colors = getThemeColors(theme === 'dark');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const checkMobile = () => { const m = window.innerWidth < 768; setIsMobile(m); setSidebarOpen(!m); };
    checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id || view !== 'dashboard') return;
      try {
        const userId = session.user.id;
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase.from('sales').select('total_amount').eq('user_id', userId).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`);
        setStats({ totalSales: salesData?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0, totalProducts: 0 });
        const { data: recent } = await supabase.from('sales').select('created_at, total_amount, receipt_number, items').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
        setRecentSales(recent || []);
        const { data: low } = await supabase.from('products').select('name, stock_quantity').eq('user_id', userId).lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5);
        setLowStockProducts(low || []);
        
        const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
        const { data: weekSales } = await supabase.from('sales').select('created_at, total_amount').eq('user_id', userId).gte('created_at', last7Days.toISOString());
        const chartData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          const dayStr = d.toISOString().split('T')[0];
          const dayLabel = d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { weekday: 'short' });
          const amount = weekSales?.filter(s => s.created_at.startsWith(dayStr)).reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
          return { label: dayLabel, amount };
        });
        setWeeklyChartData(chartData);
        
        const { data: allSales } = await supabase.from('sales').select('items').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
        const productCounts = {};
        allSales?.forEach(sale => sale.items?.forEach(item => { productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 1); }));
        const sorted = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
        setTopProduct(sorted.length > 0 ? { name: sorted[0][0], qty: sorted[0][1] } : null);
      } catch (e) { console.warn(e); }
    };
    fetchData();
  }, [view, supabase, session?.user?.id, lang]);

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };
  
  const allNavItems = [
    { id: 'dashboard', label: t.nav.dashboard, shortcut: 'Alt+D', modes: ['cashier', 'admin'] },
    { id: 'products', label: t.nav.products, shortcut: 'Alt+P', modes: ['cashier', 'admin'] },
    { id: 'sales', label: t.nav.sales, shortcut: 'Alt+S', modes: ['cashier', 'admin'] },
    { id: 'reports', label: t.nav.reports, shortcut: 'Alt+R', modes: ['admin'] },
    { id: 'settings', label: t.nav.settings || '⚙️ Settings', shortcut: 'Alt+T', modes: ['cashier', 'admin'] },
    { id: 'help', label: t.nav.help, shortcut: 'Alt+H', modes: ['cashier', 'admin'] },
  ];
  const navItems = allNavItems.filter(item => item.modes.includes(mode));

  const handleNavClick = useCallback((id) => { 
    setView(id); setAnimKey(p => p + 1); 
    if (isMobile) setSidebarOpen(false);
    if (mainRef.current) mainRef.current.focus();
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const map = { d: 'dashboard', p: 'products', s: 'sales', r: 'reports', t: 'settings', h: 'help' };
        const target = map[e.key.toLowerCase()];
        if (target && navItems.some(n => n.id === target)) { e.preventDefault(); handleNavClick(target); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchTrigger(prev => prev + 1); }
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavClick, navItems]);

  if (!session) return <Auth supabase={supabase} onAuthSuccess={() => {}} />;

  const maxChartAmount = Math.max(...weeklyChartData.map(d => d.amount), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'transparent' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 998 }} />}

      <aside style={{ position: 'fixed', top: 0, left: 0, width: sidebarOpen ? '260px' : '0px', height: '100vh', background: THEME.colors.bgDark, color: '#fff', padding: sidebarOpen ? '20px 0' : '0', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', zIndex: 999, whiteSpace: 'nowrap' }}>
        <div style={{ padding: sidebarOpen ? `0 ${THEME.space.xl} ${THEME.space.xl}` : '0', borderBottom: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>{t.appName}</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarOpen ? '10px 0' : '0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" style={{ background: isActive ? THEME.colors.primary : 'transparent', color: isActive ? '#fff' : '#94a3b8', border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', fontSize: '15px', fontWeight: isActive ? '600' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: isActive ? '0 24px 24px 0' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '20px' : '0', borderTop: sidebarOpen ? `1px solid ${THEME.colors.borderDark}` : 'none' }}>
          <button onClick={handleLogout} className="btn-micro" style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: THEME.radius.md, fontWeight: '600' }}>{t.nav.logout}</button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? THEME.space.l : THEME.space.xl, paddingTop: isMobile ? '10px' : '20px' }}>
        <header className="glass shadow-premium" style={{ padding: isMobile ? `${THEME.space.m} ${THEME.space.l}` : THEME.space.xl, borderRadius: THEME.radius.lg, marginBottom: isMobile ? THEME.space.l : THEME.space.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: isMobile ? '10px' : '0', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.m : THEME.space.xl }}>
            {(!sidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="btn-micro" style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', color: colors.text }}>☰</button>}
            <h2 style={{ margin: 0, color: colors.text, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '600' }}>
              {view === 'dashboard' && t.dashboard.title}
              {view === 'products' && t.products.title}
              {view === 'sales' && t.sales.title}
              {view === 'reports' && t.reports.title}
              {view === 'settings' && (t.settings?.title || 'Settings')}
              {view === 'help' && t.help.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? THEME.space.s : THEME.space.m }}>
            {lowStockProducts.length > 0 && (
              <button onClick={() => handleNavClick('products')} style={{ position: 'relative', background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{lowStockProducts.length}</span>
              </button>
            )}
            <button onClick={() => setMode(m => m === 'cashier' ? 'admin' : 'cashier')} className="btn-micro" style={{ padding: `${THEME.space.xs} ${THEME.space.m}`, background: mode === 'admin' ? '#f59e0b' : '#22c55e', color: '#fff', border: 'none', borderRadius: THEME.radius.xl, fontSize: '12px', fontWeight: '600' }}>
              {mode === 'cashier' ? '🛒 Cashier' : '👑 Admin'}
            </button>
            <div style={{ width: isMobile ? '32px' : '35px', height: isMobile ? '32px' : '35px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey} className="page-enter">
          {view === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? THEME.space.l : THEME.space.xl }}>
              <div className="glass shadow-premium" style={{ padding: isMobile ? THEME.space.xl : '25px', borderRadius: THEME.radius.lg }}>
                <h2 style={{ margin: `0 0 ${THEME.space.s}`, color: colors.text }}>{t.general.welcome}, {session?.user?.email?.split('@')[0] || 'Mtu'}! 👋</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: THEME.space.l, marginTop: THEME.space.l }}>
                  <button onClick={() => handleNavClick('sales')} className="btn-micro gradient-primary shadow-premium" style={{ color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold' }}>{t.nav.sales.split(' ')[1] || t.nav.sales}</button>
                  <button onClick={() => handleNavClick('products')} className="btn-micro gradient-success shadow-premium" style={{ color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold' }}>📦 {t.nav.products.split(' ')[1] || t.nav.products}</button>
                  {mode === 'admin' && <button onClick={() => handleNavClick('reports')} className="btn-micro gradient-warning shadow-premium" style={{ color: '#fff', border: 'none', padding: THEME.space.l, borderRadius: THEME.radius.lg, fontWeight: 'bold' }}>📈 {t.nav.reports.split(' ')[1] || t.nav.reports}</button>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: THEME.space.l }}>
                <div className="glass shadow-premium" style={{ padding: THEME.space.l, borderRadius: THEME.radius.lg, borderLeft: `4px solid ${THEME.colors.primary}` }}>
                  <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#60a5fa', fontSize: '13px' }}>{t.dashboard.salesToday}</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: colors.text }}>{stats.totalSales.toLocaleString()} TSh</p>
                </div>
                <div className="glass shadow-premium" style={{ padding: THEME.space.l, borderRadius: THEME.radius.lg, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ margin: `0 0 ${THEME.space.xs}`, color: '#a855f7', fontSize: '13px' }}>🏆 {lang === 'sw' ? 'Bidhaa Bora' : 'Top Seller'}</h4>
                  {topProduct ? <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: colors.text }}>{topProduct.name} ({topProduct.qty})</p> : <p style={{ margin: 0, fontSize: '13px', color: colors.textSec }}>No data</p>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: THEME.space.l }}>
                <div className="glass shadow-premium" style={{ padding: THEME.space.l, borderRadius: THEME.radius.lg }}>
                  <h4 style={{ margin: `0 0 ${THEME.space.m}`, color: colors.text, fontSize: '14px' }}>📊 {lang === 'sw' ? 'Mauzo ya Wiki Hii' : 'Weekly Sales'}</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '8px' }}>
                    {weeklyChartData.map((day, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '30px', background: day.amount > 0 ? 'linear-gradient(to top, #3b82f6, #8b5cf6)' : '#e2e8f0', borderRadius: '6px 6px 0 0', height: `${Math.max((day.amount / maxChartAmount) * 100, 4)}%` }}></div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass shadow-premium" style={{ padding: THEME.space.l, borderRadius: THEME.radius.lg }}>
                  <h4 style={{ margin: `0 0 ${THEME.space.m}`, color: '#f59e0b', fontSize: '14px' }}>⚠️ Stock Ndogo</h4>
                  {lowStockProducts.length === 0 ? <p style={{ margin: 0, fontSize: '12px', color: colors.textSec }}>✅ Stock Nzuri</p> : lowStockProducts.map((p, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}><span>{p.name}</span><span style={{ color: '#ef4444', fontWeight: 'bold' }}>{p.stock_quantity || 0}</span></div>)}
                </div>
              </div>
              <div className="glass shadow-premium" style={{ padding: '20px', borderRadius: THEME.radius.lg }}>
                <h3 style={{ margin: 0, color: colors.text, fontSize: '16px', marginBottom: THEME.space.l }}>🕒 {lang === 'sw' ? 'Mauzo ya Hivi Punde' : 'Recent Sales'}</h3>
                {recentSales.length === 0 ? <EmptyState icon="📄" title={lang === 'sw' ? 'Hakuna Mauzo' : 'No Sales Yet'} description={lang === 'sw' ? 'Anza kuuza bidhaa.' : 'Start selling.'} isDark={theme === 'dark'} /> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec }}>{lang === 'sw' ? 'Tarehe' : 'Date'}</th><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec }}>{lang === 'sw' ? 'Bidhaa' : 'Items'}</th><th style={{ textAlign: 'right', padding: '10px', color: colors.textSec }}>{lang === 'sw' ? 'Jumla' : 'Total'}</th></tr></thead>
                      <tbody>{recentSales.map((s, idx) => <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}><td style={{ padding: '10px', color: colors.text }}>{new Date(s.created_at).toLocaleDateString()}</td><td style={{ padding: '10px', color: colors.text }}>{s.items?.map(i => i.name).join(', ').substring(0, 20)}...</td><td style={{ padding: '10px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>{s.total_amount?.toLocaleString()} TSh</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'products' && <Products supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} showToast={showToast} mode={mode} session={session} searchTrigger={searchTrigger} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} mode={mode} session={session} searchTrigger={searchTrigger} />}
          {view === 'reports' && mode === 'admin' && <Reports supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} showToast={showToast} mode={mode} session={session} />}
          {view === 'settings' && <Settings lang={lang} setLang={(l) => { setLang(l); localStorage.setItem('app_lang', l); }} theme={theme} setTheme={(th) => { setTheme(th); localStorage.setItem('theme', th); }} showToast={showToast} />}
          {view === 'help' && <Help lang={lang} theme={theme} />}
        </div>
      </div>

      {/* ✅ FOOTER COMPONENT */}
      <Footer lang={lang} />
    </div>
  );
};

export default Dashboard;