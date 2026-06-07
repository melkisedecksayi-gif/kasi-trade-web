import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const Skeleton = ({ width = '100%', height = '20px', count = 1, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.space?.m || '12px', ...style }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ width, height, background: 'linear-gradient(90deg, rgba(226,232,240,0.2) 25%, rgba(203,213,225,0.4) 50%, rgba(226,232,240,0.2) 75%)', backgroundSize: '200% 100%', animation: 'skeletonPulse 1.2s ease-in-out infinite', borderRadius: THEME.radius?.sm || '4px' }} />
    ))}
  </div>
);

const EmptyState = ({ icon = '📦', title, description, action, isDark }) => (
  <div style={{ textAlign: 'center', padding: '40px', background: isDark ? THEME.colors?.surfaceDark : THEME.colors?.surfaceLight, borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${isDark ? THEME.colors?.borderDark : THEME.colors?.borderLight}` }}>
    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>{icon}</div>
    <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: isDark ? THEME.colors?.textDark : THEME.colors?.textLight }}>{title}</h3>
    <p style={{ margin: '0 0 16px', color: isDark ? THEME.colors?.textSecDark : THEME.colors?.textSecLight }}>{description}</p>
    {action}
  </div>
);

const Dashboard = ({ session, supabase }) => {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'sw');
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ Default closed kwenye simu
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

  const t = (translations[lang] && translations[lang].dashboard) 
    ? translations[lang] 
    : (translations.sw || { 
        appName: 'KasiTrade POS',
        dashboard: { title: 'Dashboard', subtitle: 'Welcome', salesToday: 'Sales Today', totalProducts: 'Total Products' },
        products: { title: 'Products' },
        sales: { title: 'Sales' },
        reports: { title: 'Reports' },
        help: { title: 'Help' },
        nav: { dashboard: '🏠 Dashboard', products: '📦 Products', sales: '🛒 Sales', reports: '📈 Reports', help: '❓ Help', logout: '🚪 Logout' },
        general: { welcome: 'Welcome', loading: 'Loading...' }
      });
  
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
        const { data, error: profileError } = await supabase.from('profiles').select('role, shop_id').eq('id', session.user.id).single();
        if (profileError) { setUserRole('cashier'); setShopId(session.user.id); return; }
        if (data) {
          const fetchedRole = data.role ? String(data.role).toLowerCase().trim() : 'cashier';
          setUserRole(fetchedRole);
          setShopId(data.shop_id || session.user.id);
          if (fetchedRole === 'cashier') setViewMode('cashier');
        } else { setUserRole('cashier'); setShopId(session.user.id); }
      } catch (err) { setUserRole('cashier'); setShopId(session?.user?.id); }
    };
    fetchProfile();
  }, [session, supabase]);

  useEffect(() => {
    const checkMobile = () => { 
      const m = window.innerWidth < 768; 
      setIsMobile(m); 
      setSidebarOpen(!m); // ✅ Kwenye simu, sidebar inafungwa default
    };
    checkMobile(); 
    window.addEventListener('resize', checkMobile); 
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    localStorage.setItem('lang', lang);
    localStorage.setItem('viewMode', viewMode);
  }, [theme, lang, viewMode]);

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
      } catch (e) { showToast('⚠️ Hitilafu ya kupakia data', 'warning'); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [view, supabase, shopId, showToast]);

  const handleLogout = async () => { 
    try { await supabase.auth.signOut(); showToast('✅ Umetoka kikamilifu', 'success'); } 
    catch(e) { showToast('❌ Hitilafu ya kutoka', 'error'); }
  };

  const handleResetSystem = async () => {
    if (userRole !== 'admin') {
      showToast('❌ Ni Admin tu anaweza kufanya hivi!', 'error');
      return;
    }
    
    const isConfirmed = window.confirm(
      "⚠️ TAHADHARI KUBWA:\n\n" +
      "Hii itafuta BIDHAA na MAUZO YOTE ya duka hili.\n" +
      "Akaunti za watumiaji hazitafutwa.\n" +
      "Hatua hii HAIWEZI kurudishwa nyuma!\n\n" +
      "Je, una uhakika unataka kuendelea?"
    );

    if (isConfirmed) {
      setLoading(true);
      try {
        await supabase.from('sales').delete().eq('shop_id', shopId);
        await supabase.from('products').delete().eq('shop_id', shopId);
        
        showToast('✅ Mfumo umefutwa na kuwekwa upya kikamilifu!', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        showToast('❌ Imeshindwa kufuta data: ' + err.message, 'error');
        setLoading(false);
      }
    }
  };
  
  const allNavItems = [
    { id: 'dashboard', label: t.nav?.dashboard || '🏠 Dashboard', shortcut: 'Alt+D', roles: ['admin', 'cashier'] },
    { id: 'products', label: t.nav?.products || '📦 Products', shortcut: 'Alt+P', roles: ['admin', 'cashier'] },
    { id: 'sales', label: t.nav?.sales || '🛒 Sales', shortcut: 'Alt+S', roles: ['admin', 'cashier'] },
    { id: 'reports', label: t.nav?.reports || '📈 Reports', shortcut: 'Alt+R', roles: ['admin'] },
    { id: 'settings', label: lang === 'sw' ? '⚙️ Mipangilio' : '⚙️ Settings', shortcut: 'Alt+T', roles: ['admin', 'cashier'] },
    { id: 'help', label: t.nav?.help || '❓ Help', shortcut: 'Alt+H', roles: ['admin', 'cashier'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(effectiveRole));

  const handleNavClick = useCallback((id) => { 
    setView(id); setAnimKey(p => p + 1); 
    if (isMobile) setSidebarOpen(false); // ✅ Funga sidebar baada ya kubonyeza kwenye simu
    if (mainRef.current) mainRef.current.focus();
  }, [isMobile]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .anim-page { animation: fadeInUp 0.35s ease forwards; }
      .btn-micro { transition: all 0.15s ease; cursor: pointer; }
      .btn-micro:hover { transform: translateY(-2px); box-shadow: ${THEME.shadow?.md || '0 4px 6px rgba(0,0,0,0.1)'}; }
      .card-micro { transition: all 0.2s ease; }
      .card-micro:hover { transform: translateY(-3px); box-shadow: ${THEME.shadow?.lg || '0 10px 15px rgba(0,0,0,0.1)'}; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      * { transition: background-color 0.2s, border-color 0.2s, color 0.2s; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: colors.bg }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ✅ OVERLAY KWA SIMU (Bonyeza nje ya sidebar kufunga) */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.5)', zIndex: 998, backdropFilter: 'blur(2px)' 
          }} 
        />
      )}

      {/* SIDEBAR */}
      <aside style={{ 
        position: 'fixed', top: 0, left: 0, 
        width: sidebarOpen ? '260px' : '0px', 
        height: '100vh', 
        background: THEME.colors?.bgDark || '#0f172a', 
        color: '#fff', 
        padding: sidebarOpen ? '20px 0' : '0', 
        overflow: 'hidden', 
        transition: 'all 0.35s', 
        zIndex: 999, 
        boxShadow: sidebarOpen ? THEME.shadow?.lg || '0 10px 15px rgba(0,0,0,0.1)' : 'none' 
      }}>
        <div style={{ padding: sidebarOpen ? `0 24px 24px` : '0', borderBottom: sidebarOpen ? `1px solid ${THEME.colors?.borderDark || '#334155'}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>{t.appName || 'KasiTrade POS'}</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <nav style={{ padding: sidebarOpen ? '10px 0' : '0' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className="btn-micro" style={{ 
                background: isActive ? THEME.colors?.primary || '#3b82f6' : 'transparent', color: isActive ? '#fff' : '#94a3b8', 
                border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', fontSize: '15px', 
                fontWeight: isActive ? '600' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                borderRadius: isActive ? '0 24px 24px 0' : '0'
              }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: sidebarOpen ? '20px' : '0', borderTop: sidebarOpen ? `1px solid ${THEME.colors?.borderDark || '#334155'}` : 'none' }}>
          <button onClick={handleLogout} className="btn-micro" style={{ width: '100%', padding: '12px', background: THEME.colors?.error || '#ef4444', color: '#fff', border: 'none', borderRadius: THEME.radius?.md || '8px', fontWeight: '600' }}>{t.nav?.logout || '🚪 Logout'}</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? '16px' : '32px', transition: 'margin-left 0.35s', minHeight: '100vh' }}>
        <header style={{ background: colors.surface, padding: isMobile ? '16px' : '32px', borderRadius: THEME.radius?.lg || '12px', marginBottom: isMobile ? '16px' : '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: THEME.shadow?.sm || '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: isMobile ? '10px' : '0', zIndex: 100, border: `1px solid ${colors.border}`, flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
            {/* ✅ HAMBURGER BUTTON (Inaonekana kwenye simu na desktop wakati sidebar imefungwa) */}
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="btn-micro" style={{ background: colors.surface, border: 'none', fontSize: '1.5rem', color: colors.text, padding: '8px 12px', borderRadius: THEME.radius?.md || '8px' }}>☰</button>
            )}
            <h2 style={{ margin: 0, color: colors.text, fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: '600' }}>
              {view === 'dashboard' && (t.dashboard?.title || 'Dashboard')}
              {view === 'products' && (t.products?.title || 'Products')}
              {view === 'sales' && (t.sales?.title || 'Sales')}
              {view === 'reports' && (t.reports?.title || 'Reports')}
              {view === 'settings' && (lang === 'sw' ? 'Mipangilio' : 'Settings')}
              {view === 'help' && (t.help?.title || 'Help')}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 16px', background: effectiveRole === 'admin' ? THEME.colors?.primary || '#3b82f6' : THEME.colors?.success || '#22c55e', color: '#fff', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {effectiveRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}
            </span>
            <button 
              onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} 
              className="btn-micro" 
              title={lang === 'sw' ? 'Switch to English' : 'Badilisha kuwa Kiswahili'}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: isMobile ? '22px' : '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
            </button>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey} className="anim-page">
          {view === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '32px' }}>
              <div style={{ background: colors.surface, padding: isMobile ? '20px' : '25px', borderRadius: THEME.radius?.lg || '12px', boxShadow: THEME.shadow?.sm || '0 1px 3px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }} className="card-micro">
                <h2 style={{ margin: '0 0 8px', color: colors.text, fontSize: isMobile ? '1.1rem' : '1.3rem' }}>{t.general?.welcome || 'Welcome'}, {session?.user?.email?.split('@')[0] || 'User'}! 👋</h2>
                <p style={{ color: colors.textSec, margin: '0 0 24px' }}>{t.dashboard?.subtitle || 'Welcome to your sales system'}</p>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                    <Skeleton height="60px" /> <Skeleton height="60px" /> <Skeleton height="60px" />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                    <button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ background: THEME.colors?.primary || '#3b82f6', color: '#fff', border: 'none', padding: '20px', borderRadius: THEME.radius?.lg || '12px', fontWeight: 'bold', fontSize: '15px' }}>🛒 {t.nav?.sales || 'Sales'}</button>
                    <button onClick={() => handleNavClick('products')} className="btn-micro" style={{ background: THEME.colors?.success || '#22c55e', color: '#fff', border: 'none', padding: '20px', borderRadius: THEME.radius?.lg || '12px', fontWeight: 'bold', fontSize: '15px' }}>📦 {t.nav?.products || 'Products'}</button>
                    {effectiveRole === 'admin' && (
                      <button onClick={() => handleNavClick('reports')} className="btn-micro" style={{ background: THEME.colors?.warning || '#f59e0b', color: '#fff', border: 'none', padding: '20px', borderRadius: THEME.radius?.lg || '12px', fontWeight: 'bold', fontSize: '15px' }}>📈 {t.nav?.reports || 'Reports'}</button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '20px', background: theme === 'dark' ? '#1e3a5f' : '#eff6ff', borderRadius: THEME.radius?.lg || '12px', borderLeft: `4px solid ${THEME.colors?.primary || '#3b82f6'}` }} className="card-micro">
                    <h4 style={{ margin: '0 0 4px', color: '#60a5fa', fontSize: '13px' }}>{t.dashboard?.salesToday || 'Sales Today'}</h4>
                    {loading ? <Skeleton width="70%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: colors.text }}>{stats.totalSales.toLocaleString()} TSh</p>}
                  </div>
                  <div style={{ padding: '20px', background: theme === 'dark' ? '#14532d' : '#f0fdf4', borderRadius: THEME.radius?.lg || '12px', borderLeft: `4px solid ${THEME.colors?.success || '#22c55e'}` }} className="card-micro">
                    <h4 style={{ margin: '0 0 4px', color: '#4ade80', fontSize: '13px' }}>{t.dashboard?.totalProducts || 'Total Products'}</h4>
                    {loading ? <Skeleton width="50%" height="24px" /> : <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: colors.text }}>{stats.totalProducts}</p>}
                  </div>
                </div>
                <div style={{ padding: '20px', background: colors.surface, borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}`, boxShadow: THEME.shadow?.sm || '0 1px 3px rgba(0,0,0,0.1)' }} className="card-micro">
                  <h4 style={{ margin: '0 0 16px', color: THEME.colors?.warning || '#f59e0b', fontSize: '14px' }}>⚠️ Stock Ndogo</h4>
                  {loading ? <Skeleton count={3} height="20px" /> : (
                    lowStockProducts.length === 0 ? (
                      <EmptyState icon="✅" title="Stock Nzuri" description="Bidhaa zote zina kiasi cha kutosha." isDark={theme === 'dark'} />
                    ) : (
                      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {lowStockProducts.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>
                            <span style={{ color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.name}</span>
                            <span style={{ color: THEME.colors?.error || '#ef4444', fontWeight: 'bold' }}>{p.stock_quantity || 0} {lang === 'sw' ? 'po' : 'left'}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div style={{ background: colors.surface, padding: isMobile ? '16px' : '20px', borderRadius: THEME.radius?.lg || '12px', boxShadow: THEME.shadow?.sm || '0 1px 3px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }} className="card-micro">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: colors.text, fontSize: '16px' }}>🕒 {lang === 'sw' ? 'Mauzo ya Hivi Punde' : 'Recent Sales'}</h3>
                  {effectiveRole === 'admin' && (
                    <button onClick={() => handleNavClick('reports')} className="btn-micro" style={{ background: 'none', border: 'none', color: THEME.colors?.primary || '#3b82f6', fontSize: '13px', fontWeight: '600' }}>{lang === 'sw' ? 'Tazama Zote →' : 'View All →'}</button>
                  )}
                </div>
                {loading ? <Skeleton count={4} height="30px" /> : recentSales.length === 0 ? (
                  <EmptyState icon="📄" title="Hakuna Mauzo" description="Anza kuuza bidhaa ili uone hapa." action={<button onClick={() => handleNavClick('sales')} className="btn-micro" style={{ padding: '10px 16px', background: THEME.colors?.primary || '#3b82f6', color: '#fff', border: 'none', borderRadius: THEME.radius?.md || '8px', fontWeight: '600', marginTop: '16px' }}>Nenda Mauzo</button>} isDark={theme === 'dark'} />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '500px' }}>
                      <thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Tarehe</th><th style={{ textAlign: 'left', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Bidhaa</th><th style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Jumla</th><th style={{ textAlign: 'right', padding: '10px', color: colors.textSec, fontSize: '12px' }}>Risiti</th></tr></thead>
                      <tbody>{recentSales.map((s, idx) => (<tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}><td style={{ padding: '10px', color: colors.text }}>{new Date(s.created_at).toLocaleDateString()}</td><td style={{ padding: '10px', color: colors.text }}>{s.items?.map(i => i.name).join(', ').substring(0, 20)}...</td><td style={{ padding: '10px', color: THEME.colors?.success || '#22c55e', fontWeight: 'bold', textAlign: 'right' }}>{(s.total_amount || 0).toLocaleString()} TSh</td><td style={{ padding: '10px', color: colors.textSec, textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>#{s.receipt_number}</td></tr>))}</tbody>
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
            <div style={{ textAlign: 'center', padding: '60px', background: colors.surface, borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ color: THEME.colors?.warning || '#f59e0b' }}>🚫 Huna ruhusa ya kutazama ripoti.</h3>
              <button onClick={() => handleNavClick('dashboard')} style={{ marginTop: '15px', padding: '10px 20px', background: THEME.colors?.primary || '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Rudi Dashboard</button>
            </div>
          )}

          {view === 'settings' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: colors.surface, padding: '24px', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}` }} className="card-micro">
                <h3 style={{ margin: '0 0 24px', color: colors.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>🎨 {lang === 'sw' ? 'Mandhari' : 'Appearance'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <button onClick={() => setTheme('light')} className="btn-micro" style={{ padding: '20px', background: theme === 'light' ? THEME.colors?.primary || '#3b82f6' : colors.bg, color: theme === 'light' ? '#fff' : colors.text, border: `2px solid ${theme === 'light' ? THEME.colors?.primary || '#3b82f6' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>☀️ {lang === 'sw' ? 'Mwangaza' : 'Light'}</button>
                  <button onClick={() => setTheme('dark')} className="btn-micro" style={{ padding: '20px', background: theme === 'dark' ? THEME.colors?.primary || '#3b82f6' : colors.bg, color: theme === 'dark' ? '#fff' : colors.text, border: `2px solid ${theme === 'dark' ? THEME.colors?.primary || '#3b82f6' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>🌙 {lang === 'sw' ? 'Giza' : 'Dark'}</button>
                </div>
              </div>
              <div style={{ background: colors.surface, padding: '24px', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}` }} className="card-micro">
                <h3 style={{ margin: '0 0 24px', color: colors.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>🌍 {lang === 'sw' ? 'Lugha' : 'Language'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <button onClick={() => setLang('sw')} className="btn-micro" style={{ padding: '20px', background: lang === 'sw' ? THEME.colors?.primary || '#3b82f6' : colors.bg, color: lang === 'sw' ? '#fff' : colors.text, border: `2px solid ${lang === 'sw' ? THEME.colors?.primary || '#3b82f6' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>🇹🇿 Kiswahili</button>
                  <button onClick={() => setLang('en')} className="btn-micro" style={{ padding: '20px', background: lang === 'en' ? THEME.colors?.primary || '#3b82f6' : colors.bg, color: lang === 'en' ? '#fff' : colors.text, border: `2px solid ${lang === 'en' ? THEME.colors?.primary || '#3b82f6' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>🇺🇸 English</button>
                </div>
              </div>
              {userRole === 'admin' && (
                <div style={{ background: colors.surface, padding: '24px', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}` }} className="card-micro">
                  <h3 style={{ margin: '0 0 24px', color: colors.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>👁️ {lang === 'sw' ? 'Mtazamo' : 'View Mode'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <button onClick={() => setViewMode('admin')} className="btn-micro" style={{ padding: '20px', background: viewMode === 'admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : colors.bg, color: viewMode === 'admin' ? '#fff' : colors.text, border: `2px solid ${viewMode === 'admin' ? '#667eea' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>👑 {lang === 'sw' ? 'Mtazamo wa Admin' : 'Admin View'}</button>
                    <button onClick={() => setViewMode('cashier')} className="btn-micro" style={{ padding: '20px', background: viewMode === 'cashier' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : colors.bg, color: viewMode === 'cashier' ? '#fff' : colors.text, border: `2px solid ${viewMode === 'cashier' ? '#f5576c' : colors.border}`, borderRadius: THEME.radius?.md || '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px' }}>🛒 {lang === 'sw' ? 'Mtazamo wa Cashier' : 'Cashier View'}</button>
                  </div>
                </div>
              )}
              <div style={{ background: colors.surface, padding: '24px', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}` }} className="card-micro">
                <h3 style={{ margin: '0 0 24px', color: colors.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>👤 {lang === 'sw' ? 'Akaunti' : 'Account'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', background: colors.bg, borderRadius: THEME.radius?.md || '8px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: colors.textSec, fontWeight: '600' }}>Email</p>
                    <p style={{ margin: 0, fontSize: '15px', color: colors.text, fontWeight: '500' }}>{session?.user?.email}</p>
                  </div>
                  <div style={{ padding: '16px', background: colors.bg, borderRadius: THEME.radius?.md || '8px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: colors.textSec, fontWeight: '600' }}>{lang === 'sw' ? 'Wadhifa Halisi' : 'Actual Role'}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: userRole === 'admin' ? THEME.colors?.primary || '#3b82f6' : THEME.colors?.success || '#22c55e', fontWeight: 'bold' }}>{userRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}</p>
                  </div>
                </div>
              </div>

              {userRole === 'admin' && (
                <div style={{ background: theme === 'dark' ? '#451a1a' : '#fef2f2', padding: '24px', borderRadius: THEME.radius?.lg || '12px', border: `2px solid ${THEME.colors?.error || '#ef4444'}` }}>
                  <h3 style={{ margin: '0 0 16px', color: THEME.colors?.error || '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🗑️ {lang === 'sw' ? 'Reset Mfumo' : 'Reset System'}
                  </h3>
                  <p style={{ margin: '0 0 24px', color: theme === 'dark' ? '#fca5a5' : '#991b1b', fontSize: '14px', lineHeight: '1.5' }}>
                    {lang === 'sw' 
                      ? 'Hii itafuta BIDHAA na MAUZO YOTE ya duka hili. Akaunti za watumiaji hazitafutwa. Hatua hii haiwezi kurudishwa nyuma!'
                      : 'This will delete ALL PRODUCTS and SALES for this shop. User accounts will not be deleted. This action cannot be undone!'}
                  </p>
                  <button 
                    onClick={handleResetSystem}
                    disabled={loading}
                    className="btn-micro"
                    style={{ 
                      padding: '12px 24px', 
                      background: loading ? '#94a3b8' : THEME.colors?.error || '#ef4444', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: THEME.radius?.md || '8px', 
                      cursor: loading ? 'not-allowed' : 'pointer', 
                      fontWeight: '700', 
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? '⏳ Inafuta...' : '🗑️ Futa Data Zote (Reset)'}
                  </button>
                </div>
              )}

            </div>
          )}

          {view === 'help' && (
            <div style={{ background: colors.surface, padding: isMobile ? '24px' : '32px', borderRadius: THEME.radius?.lg || '12px', boxShadow: THEME.shadow?.lg || '0 10px 15px rgba(0,0,0,0.1)', maxWidth: '700px', margin: '0 auto', border: `1px solid ${colors.border}` }} className="card-micro">
              <h2 style={{ textAlign: 'center', marginBottom: '24px', color: colors.text }}>{t.help?.title || 'Help'}</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {[{icon:'👥',title:'Wamiliki',text:'Melickisedeki Zakaria Sayi & Abdallah Mshamu Nassoro'},{icon:'📞',title:'Simu',text:'+255 622 995 734 | +255 613 808 727'},{icon:'💬',title:'WhatsApp',text:'+255 613 334 713 | +255 656 448 727'}].map((c,i) => (
                  <div key={i} style={{ padding: '20px', background: theme === 'dark' ? THEME.colors?.surfaceDark || '#1e293b' : '#f8fafc', borderRadius: THEME.radius?.md || '8px', borderLeft: `4px solid ${i % 2 === 0 ? THEME.colors?.primary || '#3b82f6' : THEME.colors?.success || '#22c55e'}` }}>
                    <h4 style={{ margin: '0 0 8px', color: colors.text }}>{c.icon} {c.title}</h4>
                    <p style={{ margin: 0, color: colors.textSec }}>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;