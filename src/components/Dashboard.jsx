import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';

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

  const t = translations[lang] || translations.sw;
  const mainRef = useRef(null);

  // ✅ Mobile & Theme Detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // ✅ Fetch Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
      const userId = session?.user?.id;
      if (!userId || view !== 'dashboard') return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase.from('sales').select('total_amount').eq('user_id', userId).gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`);
        const totalSales = salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
        const { data: productsData } = await supabase.from('products').select('id').eq('user_id', userId);
        setStats({ totalSales, totalProducts: productsData?.length || 0 });

        const { data: recent } = await supabase.from('sales').select('created_at, total_amount, receipt_number, items').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
        setRecentSales(recent || []);

        const { data: low } = await supabase.from('products').select('name, stock_quantity').eq('user_id', userId).lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5);
        setLowStockProducts(low || []);
      } catch (err) { console.warn('Dashboard fetch error:', err); }
    };
    fetchData();
  }, [view, supabase, session?.user?.id]);

  const handleLogout = async () => { try { await supabase.auth.signOut(); } catch(e) { console.error(e); } };
  
  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, shortcut: 'Alt+D' },
    { id: 'products', label: t.nav.products, shortcut: 'Alt+P' },
    { id: 'sales', label: t.nav.sales, shortcut: 'Alt+S' },
    { id: 'reports', label: t.nav.reports, shortcut: 'Alt+R' },
    { id: 'help', label: t.nav.help, shortcut: 'Alt+H' },
    { id: 'account', label: t.nav.account, shortcut: 'Alt+A' },
  ];

  // ✅ Memoized handleNavClick
  const handleNavClick = useCallback((id) => { 
    setView(id); 
    setAnimKey(prev => prev + 1);
    setA11yAnnouncement(`${lang === 'sw' ? 'Umeenda' : 'Navigated to'} ${id}`);
    if (isMobile) { setSidebarOpen(false); setShowMobileMenu(false); }
    if (mainRef.current) mainRef.current.focus();
  }, [lang, isMobile]);

  // ✅ Keyboard Shortcuts (disabled on mobile to avoid conflicts)
  useEffect(() => {
    if (isMobile) return; // ❌ Disable keyboard shortcuts on mobile
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const keyMap = { d: 'dashboard', p: 'products', s: 'sales', r: 'reports', h: 'help', a: 'account' };
        if (keyMap[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleNavClick(keyMap[e.key.toLowerCase()]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavClick, isMobile]);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const hoverBg = isDark ? '#334155' : '#f1f5f9';

  // ✅ Inject Global Accessibility & Animation Styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      .skip-link { position: fixed; top: -40px; left: 0; background: #3b82f6; color: #fff; padding: 8px 16px; z-index: 10000; font-weight: bold; border-radius: 0 0 8px 0; transition: top 0.3s; }
      .skip-link:focus { top: 0; }
      *:focus-visible { outline: 3px solid #3b82f6 !important; outline-offset: 2px !important; box-shadow: 0 0 0 6px rgba(59,130,246,0.3); }
      button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible { outline: 3px solid #3b82f6 !important; outline-offset: 2px !important; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      .anim-page { animation: fadeInUp 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      .anim-toast { animation: slideDown 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      .anim-modal { animation: scaleIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      .btn-micro { transition: transform 0.1s ease, box-shadow 0.1s ease; }
      .btn-micro:active { transform: scale(0.96); }
      .card-micro { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .card-micro:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,${isDark ? '0.3' : '0.08'}); }
      :root { transition: background-color 0.3s, color 0.3s; }
      [data-theme="dark"] { background-color: #0f172a; color: #f1f5f9; }
      [data-theme="light"] { background-color: #f8fafc; color: #0f172a; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      [data-theme="light"] ::-webkit-scrollbar-thumb { background: #cbd5e1; }
      * { transition: background-color 0.2s, border-color 0.2s, color 0.2s; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [isDark]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: bg, paddingBottom: isMobile ? '70px' : '0' }}>
      
      <a href="#main-content" className="skip-link">{lang === 'sw' ? 'Ruka hadi Yaliyomo' : 'Skip to Content'}</a>
      
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {a11yAnnouncement}
      </div>

      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 998, backdropFilter: 'blur(3px)' }} />}

      <aside style={{ position: 'fixed', top: 0, left: 0, width: sidebarOpen ? '260px' : '0px', height: '100vh', background: '#0f172a', color: '#fff', padding: sidebarOpen ? '20px 0' : '0', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', zIndex: 999, boxShadow: sidebarOpen ? '2px 0 15px rgba(0,0,0,0.2)' : 'none', whiteSpace: 'nowrap' }} role="navigation" aria-label={lang === 'sw' ? 'Menyu Kuu' : 'Main Navigation'}>
        <div style={{ padding: sidebarOpen ? '0 20px 20px' : '0', borderBottom: sidebarOpen ? '1px solid #1e293b' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>{t.appName}</h2>
          <button onClick={() => setSidebarOpen(false)} aria-label={lang === 'sw' ? 'Funga Menyu' : 'Close Menu'} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarOpen ? '10px 0' : '0', overflowY: 'auto', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" aria-current={isActive ? 'page' : undefined} aria-label={`${item.label} (${item.shortcut})`} style={{ background: isActive ? '#3b82f6' : 'transparent', color: isActive ? '#fff' : '#cbd5e1', border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', cursor: 'pointer', fontSize: '15px', fontWeight: isActive ? '600' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', borderRadius: isActive ? '0 24px 24px 0' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
                onMouseEnter={e => !isActive && sidebarOpen && (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={e => !isActive && sidebarOpen && (e.currentTarget.style.background = 'transparent')}>
                {item.label}
                {sidebarOpen && <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{item.shortcut}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '20px' : '0', borderTop: sidebarOpen ? '1px solid #1e293b' : 'none', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          {/* ✅ FIXED: Removed duplicate 🚪 emoji - t.nav.logout already has it */}
          <button onClick={handleLogout} className="btn-micro" aria-label={t.nav.logout} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {t.nav.logout}
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? '15px' : '20px', transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)', minHeight: '100vh', paddingTop: isMobile ? '10px' : '20px' }}>
        <header style={{ background: cardBg, padding: isMobile ? '12px 15px' : '15px', borderRadius: isMobile ? '12px' : '10px', marginBottom: isMobile ? '15px' : '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: isMobile ? '10px' : '0', zIndex: 100, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
            {(!sidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="btn-micro" aria-label={lang === 'sw' ? 'Fungua Menyu' : 'Open Menu'} style={{ background: hoverBg, border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: textMain, padding: '8px 12px', borderRadius: '8px', transition: '0.2s' }}>☰</button>}
            <h2 style={{ margin: 0, color: textMain, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '600' }}>
              {view === 'dashboard' && t.dashboard.title}
              {view === 'products' && t.products.title}
              {view === 'sales' && t.sales.title}
              {view === 'reports' && t.reports.title}
              {view === 'help' && t.help.title}
              {view === 'account' && t.account.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
            <button onClick={toggleTheme} className="btn-micro" aria-label={isDark ? (lang === 'sw' ? 'Badilisha kuwa Nyeupe' : 'Switch to Light Mode') : (lang === 'sw' ? 'Badilisha kuwa Nyeusi' : 'Switch to Dark Mode')} style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: hoverBg, border: 'none', borderRadius: '6px', cursor: 'pointer', color: textMain, fontWeight: '600', fontSize: isMobile ? '12px' : '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} className="btn-micro" aria-label={lang === 'sw' ? 'Badilisha Lugha kuwa Kiingereza' : 'Switch Language to Swahili'} style={{ padding: isMobile ? '6px 10px' : '6px 12px', background: hoverBg, border: 'none', borderRadius: '6px', cursor: 'pointer', color: textMain, fontWeight: '600', fontSize: isMobile ? '12px' : '14px' }}>
              {lang === 'sw' ? '🇹 SW' : '🇸 EN'}
            </button>
            <div style={{ width: isMobile ? '32px' : '35px', height: isMobile ? '32px' : '35px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: isMobile ? '14px' : '16px' }} aria-label={lang === 'sw' ? 'Akaunti ya Mtumiaji' : 'User Account'}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey} className="anim-page" role="main" aria-label={lang === 'sw' ? 'Yaliyomo Makuu' : 'Main Content'}>
          {view === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px' }}>
              
              <div style={{ background: cardBg, padding: isMobile ? '20px' : '25px', borderRadius: '12px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }} className="card-micro">
                <h2 style={{ margin: '0 0 10px', color: textMain }}>{t.general.welcome}, {session?.user?.email?.split('@')[0] || 'Mtu'}! 👋</h2>
                <p style={{ color: textSec, margin: '0 0 20px' }}>{t.dashboard.subtitle}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '15px' }}>
                  <button onClick={() => { handleNavClick('sales'); }} className="btn-micro" aria-label={t.nav.sales} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     {t.nav.sales.split(' ')[1] || t.nav.sales}
                  </button>
                  <button onClick={() => { handleNavClick('products'); }} className="btn-micro" aria-label={t.nav.products} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    📦 {t.nav.products.split(' ')[1] || t.nav.products}
                  </button>
                  <button onClick={() => { handleNavClick('reports'); }} className="btn-micro" aria-label={t.nav.reports} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     {t.nav.reports.split(' ')[1] || t.nav.reports}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ padding: '15px', background: isDark ? '#1e3a5f' : '#eff6ff', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }} className="card-micro" aria-live="polite">
                    <h4 style={{ margin: '0 0 5px', color: '#60a5fa', fontSize: '13px' }}>{t.dashboard.salesToday}</h4>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: textMain }}>{stats.totalSales.toLocaleString()} TSh</p>
                  </div>
                  <div style={{ padding: '15px', background: isDark ? '#14532d' : '#f0fdf4', borderRadius: '10px', borderLeft: '4px solid #22c55e' }} className="card-micro" aria-live="polite">
                    <h4 style={{ margin: '0 0 5px', color: '#4ade80', fontSize: '13px' }}>{t.dashboard.totalProducts}</h4>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: textMain }}>{stats.totalProducts}</p>
                  </div>
                </div>

                <div style={{ padding: '15px', background: cardBg, borderRadius: '10px', border: `1px solid ${border}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)' }} className="card-micro" aria-live="assertive">
                  <h4 style={{ margin: '0 0 10px', color: '#f59e0b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Stock Ndogo
                  </h4>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {lowStockProducts.length === 0 ? (
                      <p style={{ color: textSec, fontSize: '12px', margin: 0 }}>✅ {lang === 'sw' ? 'Bidhaa zote zina stock kutosha.' : 'All products have sufficient stock.'}</p>
                    ) : (
                      lowStockProducts.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${border}`, fontSize: '13px' }}>
                          <span style={{ color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.name}</span>
                          <span style={{ color: '#f87171', fontWeight: 'bold' }}>{p.stock_quantity || 0} {lang === 'sw' ? 'po' : 'left'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div style={{ background: cardBg, padding: '20px', borderRadius: '12px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }} className="card-micro">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: textMain, fontSize: '16px' }}>🕒 {lang === 'sw' ? 'Mauzo ya Hivi Punde' : 'Recent Sales'}</h3>
                  <button onClick={() => { handleNavClick('reports'); }} className="btn-micro" aria-label={lang === 'sw' ? 'Tazama Ripoti Zote' : 'View All Reports'} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    {lang === 'sw' ? 'Tazama Zote →' : 'View All →'}
                  </button>
                </div>
                
                {recentSales.length === 0 ? (
                  <p style={{ textAlign: 'center', color: textSec, padding: '20px' }}>📄 {lang === 'sw' ? 'Hakuna mauzo ya hivi punde.' : 'No recent sales found.'}</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${border}` }}>
                          <th scope="col" style={{ textAlign: 'left', padding: '10px', color: textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Tarehe' : 'Date'}</th>
                          <th scope="col" style={{ textAlign: 'left', padding: '10px', color: textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Bidhaa' : 'Items'}</th>
                          <th scope="col" style={{ textAlign: 'right', padding: '10px', color: textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Jumla' : 'Total'}</th>
                          <th scope="col" style={{ textAlign: 'right', padding: '10px', color: textSec, fontSize: '12px' }}>{lang === 'sw' ? 'Risiti' : 'Receipt'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${border}` }}>
                            <td style={{ padding: '10px', color: textMain }}>{new Date(s.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', color: textMain }}>{s.items?.map(i => i.name).join(', ').substring(0, 20)}...</td>
                            <td style={{ padding: '10px', color: '#4ade80', fontWeight: 'bold', textAlign: 'right' }}>{(s.total_amount || 0).toLocaleString()} TSh</td>
                            <td style={{ padding: '10px', color: textSec, textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>#{s.receipt_number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'help' && (
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '30px', borderRadius: isMobile ? '12px' : '12px', boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)', maxWidth: isMobile ? '100%' : '700px', margin: '0 auto', border: `1px solid ${border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: '25px', borderBottom: `2px solid ${border}`, paddingBottom: '15px', color: textMain }}>{t.help.title}</h2>
              <div style={{ display: 'grid', gap: isMobile ? '12px' : '15px' }}>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }} className="card-micro">
                  <h4 style={{ margin: '0 0 8px', color: textMain }}>{t.help.owners}</h4>
                  <p style={{ margin: 0, color: textSec }}>Melickisedeki Zakaria Sayi & Abdallah Mshamu Nassoro</p>
                </div>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #22c55e' }} className="card-micro">
                  <h4 style={{ margin: '0 0 8px', color: textMain }}>{t.help.call}</h4>
                  <p style={{ margin: 0, color: textSec }}>
                    <a href="tel:+255622995734" style={{ color: '#60a5fa', marginRight: '15px' }}>+255 622 995 734</a>
                    <a href="tel:+255613808727" style={{ color: '#60a5fa' }}>+255 613 808 727</a>
                  </p>
                </div>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #16a34a' }} className="card-micro">
                  <h4 style={{ margin: '0 0 8px', color: textMain }}>{t.help.whatsapp}</h4>
                  <p style={{ margin: 0, color: textSec }}>
                    <a href="https://wa.me/255613334713" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', marginRight: '15px', fontWeight: '600' }}>+255 613 334 713</a>
                    <a href="https://wa.me/255656448727" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontWeight: '600' }}>+255 656 448 727</a>
                  </p>
                </div>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }} className="card-micro">
                  <h4 style={{ margin: '0 0 8px', color: textMain }}>{t.help.feedback}</h4>
                  <a href="https://forms.gle/EoNjSm2NCHNh7ixD6" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontWeight: '600' }}>{t.help.feedbackLink}</a>
                </div>
              </div>
              <hr style={{ margin: isMobile ? '20px 0' : '25px 0', border: 'none', borderTop: `1px solid ${border}` }} />
              <h3 style={{ marginBottom: '10px', color: textMain }}>{t.help.aboutTitle}</h3>
              <p style={{ lineHeight: '1.6', color: textSec }}>{t.help.aboutDesc}</p>
              <h3 style={{ marginTop: '15px', marginBottom: '10px', color: textMain }}>{t.help.features}</h3>
              <ul style={{ paddingLeft: '20px', color: textSec }}>
                {t.help.featuresList.map((f, i) => <li key={i} style={{marginBottom:'5px'}}>{f}</li>)}
              </ul>
              <p style={{ textAlign: 'center', color: textSec, marginTop: '25px', fontSize: '0.85rem' }}>© {new Date().getFullYear()} KasiTrade Web. {t.help.copyright}</p>
            </div>
          )}

          {view === 'account' && (
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '30px', borderRadius: isMobile ? '12px' : '12px', boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)', maxWidth: isMobile ? '100%' : '600px', margin: '0 auto', border: `1px solid ${border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: '25px', borderBottom: `2px solid ${border}`, paddingBottom: '15px', color: textMain }}>{t.account.title}</h2>
              <div style={{ marginBottom: isMobile ? '20px' : '25px' }}>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', marginBottom: '12px' }} className="card-micro">
                  <p style={{ margin: '0 0 5px', fontWeight: '600', color: textSec, fontSize: '13px' }}>{t.account.email}</p>
                  <p style={{ margin: 0, fontSize: '15px', color: textMain }}>{session?.user?.email || 'Haipatikani'}</p>
                </div>
                <div style={{ padding: isMobile ? '12px' : '15px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px' }} className="card-micro">
                  <p style={{ margin: '0 0 5px', fontWeight: '600', color: textSec, fontSize: '13px' }}>{t.account.userId}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: textSec, fontFamily: 'monospace', wordBreak: 'break-all' }}>{session?.user?.id || 'N/A'}</p>
                </div>
              </div>
              <hr style={{ margin: isMobile ? '20px 0' : '25px 0', border: 'none', borderTop: `1px solid ${border}` }} />
              <h3 style={{ marginBottom: '15px', color: textMain }}>{t.account.changePassword}</h3>
              <ChangePasswordForm supabase={supabase} lang={lang} isMobile={isMobile} theme={theme} />
            </div>
          )}

          {view === 'products' && <Products supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} />}
          {view === 'reports' && <Reports supabase={supabase} lang={lang} userId={session?.user?.id} theme={theme} />}
        </div>
      </div>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', display: 'flex', justifyContent: 'space-around', padding: '8px 0', borderTop: '1px solid #1e293b', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }} role="navigation" aria-label={lang === 'sw' ? 'Menyu ya Simu' : 'Mobile Navigation'}>
          {navItems.slice(0, 5).map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" aria-current={isActive ? 'page' : undefined} style={{ background: 'none', border: 'none', color: isActive ? '#60a5fa' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 4px', cursor: 'pointer', minWidth: '60px', fontSize: '11px' }}>
                <span style={{ fontSize: '20px' }}>{item.label.split(' ')[0]}</span>
                <span style={{ fontWeight: isActive ? '600' : '400', whiteSpace: 'nowrap', color: isActive ? '#60a5fa' : (isDark ? '#cbd5e1' : '#f1f5f9') }}>
                  {item.label.split(' ').slice(1).join(' ')}
                </span>
              </button>
            );
          })}
          {navItems.length > 5 && (
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="btn-micro" aria-expanded={showMobileMenu} aria-haspopup="true" style={{ background: 'none', border: 'none', color: showMobileMenu ? '#60a5fa' : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 4px', cursor: 'pointer', minWidth: '60px', fontSize: '11px' }}>
              <span style={{ fontSize: '20px' }}>⋮</span>
              <span style={{ color: isDark ? '#cbd5e1' : '#f1f5f9' }}>Zaidi</span>
            </button>
          )}
          {showMobileMenu && (
            <div className="anim-modal" role="menu" style={{ position: 'absolute', bottom: '60px', right: '10px', background: '#1e293b', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1001, minWidth: '160px' }}>
              {navItems.slice(5).map(item => {
                const isActive = view === item.id;
                return (
                  <button key={item.id} onClick={() => handleNavClick(item.id)} role="menuitem" className="btn-micro" style={{ width: '100%', padding: '10px 12px', background: isActive ? '#2563eb' : 'transparent', color: isActive ? '#fff' : (isDark ? '#e2e8f0' : '#f1f5f9'), border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChangePasswordForm = ({ supabase, lang, isMobile, theme }) => {
  const isDark = theme === 'dark';
  const t = translations[lang].account;
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const bg = isDark ? '#1e293b' : '#f8fafc';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const border = isDark ? '#334155' : '#cbd5e1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (newPass !== confirm) return setErr(t.errorMatch);
    if (newPass.length < 6) return setErr(t.errorLength);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setMsg(t.success); setNewPass(''); setConfirm('');
    } catch (e) { setErr(t.errorUpdate + ' ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: isMobile ? '10px' : '12px' }}>
      <label htmlFor="new-pass" className="sr-only">{t.newPassword}</label>
      <input id="new-pass" type="password" placeholder={t.newPassword} value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={6} disabled={loading} aria-required="true" style={{ padding: isMobile ? '10px' : '12px', background: bg, color: text, border: `1px solid ${border}`, borderRadius: isMobile ? '6px' : '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      
      <label htmlFor="confirm-pass" className="sr-only">{t.confirmNewPassword}</label>
      <input id="confirm-pass" type="password" placeholder={t.confirmNewPassword} value={confirm} onChange={e=>setConfirm(e.target.value)} required disabled={loading} aria-required="true" aria-describedby={err ? 'pass-error' : undefined} style={{ padding: isMobile ? '10px' : '12px', background: bg, color: text, border: `1px solid ${border}`, borderRadius: isMobile ? '6px' : '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      
      <button type="submit" disabled={loading} className="btn-micro" aria-label={t.update} style={{ padding: isMobile ? '10px' : '12px', background: loading ? '#475569' : '#3b82f6', color: '#fff', border: 'none', borderRadius: isMobile ? '6px' : '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>{loading ? t.updating : t.update}</button>
      
      {msg && <p role="status" style={{ color: '#4ade80', margin: 0, fontSize: '13px', background: isDark ? '#14532d' : '#f0fdf4', padding: isMobile ? '8px' : '10px', borderRadius: '6px' }}>{msg}</p>}
      {err && <p id="pass-error" role="alert" style={{ color: '#f87171', margin: 0, fontSize: '13px', background: isDark ? '#451a1a' : '#fef2f2', padding: isMobile ? '8px' : '10px', borderRadius: '6px' }}>{err}</p>}
    </form>
  );
};

export default Dashboard;