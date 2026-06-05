import React, { useState, useEffect, useRef, useCallback } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const Dashboard = ({ session, supabase }) => {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('sw'); // ✅ Sasa inatumika kwenye button ya lugha
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // ✅ Sasa inatumika kwenye button ya theme
  const [animKey, setAnimKey] = useState(0);
  const [toast, setToast] = useState(null);
  
  const [userRole, setUserRole] = useState('cashier');
  const [shopId, setShopId] = useState(null);

  const t = translations[lang] || translations.sw;
  const mainRef = useRef(null);
  const colors = getThemeColors(theme === 'dark');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  // ✅ SOMA ROLE NA SHOP_ID KUTOKA DATABASE
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
          setUserRole(data.role || 'cashier');
          setShopId(data.shop_id || session.user.id);
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

  // ✅ HIFADHI THEME KWA LOCAL STORAGE
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light'); // ✅ Sasa inatumika

  const handleLogout = async () => { 
    try { await supabase.auth.signOut(); showToast('✅ Umetoka kikamilifu', 'success'); } 
    catch(e) { showToast('❌ Hitilafu ya kutoka', 'error'); }
  };
  
  const allNavItems = [
    { id: 'dashboard', label: t.nav.dashboard, roles: ['admin', 'cashier'] },
    { id: 'products', label: t.nav.products, roles: ['admin', 'cashier'] },
    { id: 'sales', label: t.nav.sales, roles: ['admin', 'cashier'] },
    { id: 'reports', label: t.nav.reports, roles: ['admin'] },
    { id: 'help', label: t.nav.help, roles: ['admin', 'cashier'] },
    { id: 'account', label: t.nav.account, roles: ['admin', 'cashier'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = useCallback((id) => { 
    setView(id); setAnimKey(p => p + 1); 
    if (isMobile) { setSidebarOpen(false); }
    if (mainRef.current) mainRef.current.focus();
  }, [isMobile]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: colors.bg, paddingBottom: isMobile ? '70px' : '0' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', top: 0, left: 0, width: sidebarOpen ? '260px' : '0px', height: '100vh', background: THEME.colors.bgDark, color: '#fff', padding: sidebarOpen ? '20px 0' : '0', overflow: 'hidden', transition: 'all 0.3s', zIndex: 999 }}>
        <div style={{ padding: sidebarOpen ? `0 20px 20px` : '0', borderBottom: sidebarOpen ? `1px solid #334155` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{t.appName}</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <nav style={{ padding: '10px 0' }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} style={{ 
                background: isActive ? THEME.colors.primary : 'transparent', color: isActive ? '#fff' : '#94a3b8', 
                border: 'none', padding: sidebarOpen ? '14px 20px' : '14px 0', textAlign: 'left', fontSize: '15px', 
                fontWeight: isActive ? '600' : '400', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' 
              }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '20px', borderTop: `1px solid #334155` }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: THEME.colors.error, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>{t.nav.logout}</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: sidebarOpen && !isMobile ? '260px' : '0', flex: 1, padding: isMobile ? '16px' : '32px', transition: 'margin-left 0.3s', minHeight: '100vh' }}>
        <header style={{ background: colors.surface, padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${colors.border}`, flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: colors.text, cursor: 'pointer' }}>☰</button>}
            <h2 style={{ margin: 0, color: colors.text, fontSize: '1.2rem' }}>{view === 'dashboard' ? t.nav.dashboard : view === 'products' ? t.nav.products : view === 'sales' ? t.nav.sales : view === 'reports' ? t.nav.reports : t.nav.account}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* ✅ BADGE YA ROLE */}
            <span style={{ padding: '6px 12px', background: userRole === 'admin' ? THEME.colors.primary : THEME.colors.success, color: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              {userRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}
            </span>
            {/* ✅ BUTTON YA THEME (Inatumia setTheme) */}
            <button onClick={toggleTheme} style={{ padding: '6px 12px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            {/* ✅ BUTTON YA LUGHA (Inatumia setLang) */}
            <button onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} style={{ padding: '6px 12px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              {lang === 'sw' ? '🇹🇿 SW' : '🇺🇸 EN'}
            </button>
            <div style={{ width: '36px', height: '36px', background: THEME.colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div id="main-content" ref={mainRef} tabIndex="-1" style={{ outline: 'none' }} key={animKey}>
          {view === 'products' && <Products supabase={supabase} lang={lang} shopId={shopId} theme={theme} showToast={showToast} userRole={userRole} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} shopId={shopId} theme={theme} />}
          {view === 'reports' && userRole === 'admin' && <Reports supabase={supabase} lang={lang} shopId={shopId} theme={theme} showToast={showToast} />}
          
          {view === 'reports' && userRole !== 'admin' && (
            <div style={{ textAlign: 'center', padding: '60px', background: colors.surface, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ color: THEME.colors.warning }}>🚫 Huna ruhusa ya kutazama ripoti.</h3>
              <button onClick={() => handleNavClick('dashboard')} style={{ marginTop: '15px', padding: '10px 20px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Rudi Dashboard</button>
            </div>
          )}

          {view === 'dashboard' && (
            <div style={{ background: colors.surface, padding: '32px', borderRadius: '12px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <h2 style={{ color: colors.text }}>Karibu, {session?.user?.email?.split('@')[0]}! 👋</h2>
              <p style={{ color: colors.textSec }}>Chagua sehemu unayotaka kutoka kwenye menyu upande wa kushoto.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => handleNavClick('sales')} style={{ padding: '16px 24px', background: THEME.colors.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Nenda Mauzo</button>
                <button onClick={() => handleNavClick('products')} style={{ padding: '16px 24px', background: THEME.colors.success, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Nenda Bidhaa</button>
                {userRole === 'admin' && (
                  <button onClick={() => handleNavClick('reports')} style={{ padding: '16px 24px', background: THEME.colors.warning, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Nenda Ripoti</button>
                )}
              </div>
            </div>
          )}

          {view === 'help' && (
            <div style={{ background: colors.surface, padding: '32px', borderRadius: '12px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <h2 style={{ color: colors.text }}>Msaada & Mawasiliano</h2>
              <p style={{ color: colors.textSec }}>📞 +255 622 995 734 | +255 613 808 727</p>
              <p style={{ color: colors.textSec }}>💬 WhatsApp: +255 613 334 713</p>
            </div>
          )}

          {view === 'account' && (
            <div style={{ background: colors.surface, padding: '32px', borderRadius: '12px', border: `1px solid ${colors.border}`, maxWidth: '500px', margin: '0 auto' }}>
              <h2 style={{ color: colors.text, marginBottom: '24px', textAlign: 'center' }}>Akaunti Yangu</h2>
              <div style={{ marginBottom: '16px', padding: '16px', background: colors.bg, borderRadius: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: colors.textSec }}>Email</p>
                <p style={{ margin: 0, fontWeight: '600', color: colors.text }}>{session?.user?.email}</p>
              </div>
              <div style={{ marginBottom: '16px', padding: '16px', background: colors.bg, borderRadius: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: colors.textSec }}>Wadhifa (Role)</p>
                <p style={{ margin: 0, fontWeight: '600', color: userRole === 'admin' ? THEME.colors.primary : THEME.colors.success }}>
                  {userRole === 'admin' ? '👑 Admin' : '🛒 Cashier'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;