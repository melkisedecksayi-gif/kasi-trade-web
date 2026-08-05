import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import { getThemeColors } from './theme';
import useKeyboard from './hooks/useKeyboard';
import { useSubscription } from './hooks/useSubscription';
import logger from './utils/logger';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import Sidebar, { SIDEBAR_WIDTH } from './components/layout/Sidebar';
import Footer from './components/Footer';
import './design.css';

const Landing = lazy(() => import('./components/Landing'));
const Auth = lazy(() => import('./components/Auth'));
const UpdatePassword = lazy(() => import('./components/UpdatePassword'));
const SubscriptionPage = lazy(() => import('./components/Subscription'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const POS = lazy(() => import('./components/POS'));
const Products = lazy(() => import('./components/Products'));
const Customers = lazy(() => import('./components/Customers'));
const Reports = lazy(() => import('./components/Reports'));
const Expenses = lazy(() => import('./components/Expenses'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Settings = lazy(() => import('./components/Settings'));
const Profile = lazy(() => import('./components/Profile'));
const Help = lazy(() => import('./components/Help'));
const InfoPage = lazy(() => import('./components/InfoPage'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem('app_activePage') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth >= 1024;
  });
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('app_darkMode');
    return saved ? saved === 'true' : true;
  });
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [currentShop, setCurrentShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const { subscription, loading: subLoading, daysRemaining, statusBadge, activateSubscription, refresh: refreshSub, MONTHLY_PRICE } = useSubscription(session);

  useEffect(() => {
    logger.registerUI((type, message) => {
      setToast({ type, message });
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const theme = getThemeColors(isDarkMode);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setCurrentView('update-password');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setCurrentView('app');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) { fetchShops(); fetchAvatar(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchAvatar = async () => {
    try {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    } catch (e) {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('app_activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    if (!currentShop?.id) return;

    let autoCloseInterval;
    let lowStockInterval;
    let birthdayInterval;

    const checkAutoClose = async () => {
      // sms_settings table not available - skipping auto-close SMS
    };

    const checkLowStock = async () => {
      // sms_settings table not available - skipping low stock SMS
    };

    const checkBirthdays = async () => {
      // sms_settings table not available - skipping birthday SMS
    };

    autoCloseInterval = setInterval(checkAutoClose, 60000);
    lowStockInterval = setInterval(checkLowStock, 300000);
    birthdayInterval = setInterval(checkBirthdays, 3600000);
    checkAutoClose();
    checkLowStock();
    checkBirthdays();

    return () => {
      clearInterval(autoCloseInterval);
      clearInterval(lowStockInterval);
      clearInterval(birthdayInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShop?.id, lang]);

  const fetchShops = async () => {
    try {
      const uid = session.user.id;
      const { data: shopData, error: shopErr } = await supabase.from('shops').select('*');
      if (shopErr) {
        logger.error('App', 'Shops fetch error:', shopErr);
      }
      if (shopData && shopData.length > 0) {
        setShops(shopData);
        const savedShopId = localStorage.getItem('current_shop_id');
        const target = savedShopId ? shopData.find(s => s.id === savedShopId) : shopData[0];
        setCurrentShop(target || shopData[0]);
        return;
      }
      let profile = null;
      try {
        const { data: pf } = await supabase.from('profiles').select('*').single();
        profile = pf;
      } catch (e) {}
      const shopName = profile?.business_name || session.user.email?.split('@')[0] || 'Duka Langu';
      const { data: newShop, error: insErr } = await supabase
        .from('shops')
        .insert({
          owner_id: uid, shop_name: shopName, business_type: profile?.business_type || 'duka',
          phone: profile?.phone || '', region: profile?.region || '',
          district: profile?.district || '', ward: profile?.ward || ''
        })
        .select().single();
      if (insErr) {
        logger.error('App', 'Shop insert error:', insErr);
        return;
      }
      if (newShop) {
        setShops([newShop]); setCurrentShop(newShop);
        localStorage.setItem('current_shop_id', newShop.id);
      }
    } catch (err) {
      logger.error('App', 'Shop fetch error:', err);
    }
  };

  const handleLoginSuccess = () => setCurrentView('app');
  const handlePasswordUpdated = async () => {
    await supabase.auth.signOut();
    window.location.href = window.location.origin;
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setCurrentView('login');
  };
  const handleSwitchShop = (shop) => {
    setCurrentShop(shop);
    localStorage.setItem('current_shop_id', shop.id);
  };

  useKeyboard({
    '1': () => setActivePage('dashboard'),
    '2': () => setActivePage('pos'),
    '3': () => setActivePage('products'),
    '4': () => setActivePage('customers'),
    '5': () => setActivePage('reports'),
    '6': () => setActivePage('expenses'),
    '7': () => setActivePage('suppliers'),
    'Escape': () => { setIsSidebarOpen(false); setActivePage('dashboard'); },
  });

  if (loading || (session && subLoading)) {
    return (
      <div className="initial-loader">
        <div className="initial-spinner" />
        <span>Inapakia KasiTRADE...</span>
      </div>
    );
  }

  const spinnerFallback = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>;

  if (currentView === 'update-password') {
    return <Suspense fallback={spinnerFallback}><ErrorBoundary isDarkMode={isDarkMode} lang={lang}><UpdatePassword supabase={supabase} onPasswordUpdated={handlePasswordUpdated} /></ErrorBoundary></Suspense>;
  }
  if (currentView === 'landing') {
    return <Suspense fallback={spinnerFallback}><ErrorBoundary isDarkMode={isDarkMode} lang={lang}><Landing lang={lang} setLang={setLang} onGetStarted={() => setCurrentView('login')} /></ErrorBoundary></Suspense>;
  }
  if (currentView === 'login' || !session) {
    return <Suspense fallback={spinnerFallback}><ErrorBoundary isDarkMode={isDarkMode} lang={lang}><Auth supabase={supabase} onAuthSuccess={handleLoginSuccess} /></ErrorBoundary></Suspense>;
  }

  const headerStyle = {
    position: 'sticky', top: 0, zIndex: 100,
    background: isDarkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${theme.border}`,
    padding: '8px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '8px',
    overflow: 'hidden', minHeight: '48px'
  };

  const pageTitleMap = {
    dashboard: lang === 'sw' ? 'Dashibodi' : 'Dashboard',
    pos: lang === 'sw' ? 'Mauzo' : 'POS',
    products: lang === 'sw' ? 'Bidhaa' : 'Products',
    customers: lang === 'sw' ? 'Wateja' : 'Customers',
    reports: lang === 'sw' ? 'Ripoti' : 'Reports',
    expenses: lang === 'sw' ? 'Matumizi' : 'Expenses',
    suppliers: lang === 'sw' ? 'Wauzaji' : 'Suppliers',
    settings: lang === 'sw' ? 'Mipangilio' : 'Settings',
    profile: lang === 'sw' ? 'Wasifu' : 'Profile',
    help: lang === 'sw' ? 'Msaada' : 'Help',
    subscription: lang === 'sw' ? 'Usajili' : 'Subscription',
  };
  const pageTitle = pageTitleMap[activePage] || activePage.charAt(0).toUpperCase() + activePage.slice(1);

  const renderPage = () => {
    const props = { lang, supabase, currentShop, isDarkMode, setActivePage, theme };
    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'pos': return <POS {...props} />;
      case 'products': return <Products {...props} globalSearchQuery={globalSearchQuery} onSearchConsumed={() => setGlobalSearchQuery('')} />;
      case 'customers': return <Customers {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'expenses': return <Expenses {...props} />;
      case 'suppliers': return <Suppliers {...props} />;
      case 'settings': return <Settings {...props} session={session} onLogout={handleLogout} setIsDarkMode={setIsDarkMode} setLang={setLang} shops={shops} setShops={setShops} onShopChange={handleSwitchShop} />;
      case 'profile': return <Profile {...props} session={session} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />;
      case 'help': return <Help lang={lang} theme={isDarkMode ? 'dark' : 'light'} />;
      case 'about': return <InfoPage page="about" lang={lang} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} />;
      case 'privacy': return <InfoPage page="privacy" lang={lang} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} />;
      case 'terms': return <InfoPage page="terms" lang={lang} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} />;
      case 'subscription': return (
        <SubscriptionPage
          lang={lang} isDarkMode={isDarkMode} theme={theme}
          subscription={subscription} daysRemaining={daysRemaining}
          statusBadge={statusBadge} activateSubscription={activateSubscription}
          refresh={refreshSub} MONTHLY_PRICE={MONTHLY_PRICE}
        />
      );
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar
        onLogout={handleLogout} activePage={activePage} setActivePage={setActivePage}
        lang={lang} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode} shopName={currentShop?.shop_name || 'KasiTRADE'} theme={theme}
      />

      <div style={{ flex: 1, marginLeft: isDesktop && isSidebarOpen ? `${SIDEBAR_WIDTH}px` : '0', padding: '0', minHeight: '100vh', width: isDesktop && isSidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%', transition: 'margin-left 0.3s ease, width 0.3s ease' }}>
        <style>{`
          @media (max-width: 480px) {
            .header-shop-name, .header-shop-switcher { display: none !important; }
            .header-title { font-size: 14px !important; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .header-left { gap: 8px !important; }
            .header-right { gap: 4px !important; }
            .header-lang-btn { width: 30px; height: 30px; font-size: 14px !important; }
          }
        `}</style>
        {/* Top Header Bar */}
        <div style={headerStyle}>
          <div className="header-left flex items-center" style={{ gap: '14px', flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="btn-icon"
              style={{
                border: `1px solid ${theme.border}`, background: theme.surface,
                color: theme.text, fontSize: '18px'
              }}
              aria-label={lang === 'sw' ? 'Fungua menyu' : 'Open menu'}
            >
              ☰
            </button>
            <div>
              <h2 className="header-title" style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: theme.text, letterSpacing: '-0.3px', textTransform: 'capitalize' }}>
                {pageTitle}
              </h2>
              {currentShop && (
                <p className="header-shop-name" style={{ margin: '1px 0 0', fontSize: '11px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {currentShop.shop_name}
                  {shops.length > 1 && (
                    <span style={{ fontSize: '10px', color: theme.primary, fontWeight: '600' }}>+{shops.length - 1}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="header-right flex items-center" style={{ gap: '10px' }}>
            {/* Global Search */}
            <div className="input-group" style={{ maxWidth: isDesktop ? '220px' : '140px' }}>
              <span className="input-icon" style={{ left: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearch.trim()) {
                    setGlobalSearchQuery(globalSearch.trim());
                    setActivePage('products');
                  }
                }}
                style={{
                  padding: '6px 10px 6px 32px', borderRadius: '8px', border: `1px solid ${theme.border}`,
                  background: theme.surface, color: theme.text, fontSize: '12px', outline: 'none',
                  width: '100%', boxSizing: 'border-box'
                }}
              />
            </div>
            {/* Language Toggle */}
            <button
              onClick={() => { const nl = lang === 'sw' ? 'en' : 'sw'; setLang(nl); localStorage.setItem('app_lang', nl); }}
              className="header-lang-btn btn-icon-sm"
              style={{ background: theme.surfaceHover, border: 'none', fontSize: '18px', cursor: 'pointer' }}
              title={lang === 'sw' ? 'Switch to English' : 'Badilisha Kiswahili'}
            >
              {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
            </button>

            {/* Shop Switcher */}
            {shops.length > 1 && (
              <select
                value={currentShop?.id || ''}
                onChange={(e) => { const shop = shops.find(s => s.id === e.target.value); if (shop) handleSwitchShop(shop); }}
                className="header-shop-switcher select"
                style={{ padding: '6px 30px 6px 10px', fontSize: '12px', maxWidth: '160px' }}
              >
                {shops.map(s => (<option key={s.id} value={s.id}>{s.shop_name}</option>))}
              </select>
            )}

            {/* Profile Button */}
            <div
              onClick={() => setActivePage('profile')}
              className="avatar avatar-md"
              style={{
                cursor: 'pointer', border: `2px solid ${theme.surface}`,
                boxShadow: isDarkMode ? '0 0 0 1px rgba(99,102,241,0.3)' : '0 0 0 1px rgba(99,102,241,0.15)'
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: '16px', maxWidth: '1440px', margin: '0 auto' }}>
          <div className="page-enter" key={activePage}>
            <ErrorBoundary isDarkMode={isDarkMode} lang={lang}>
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>}>
                {renderPage()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>

        <Footer lang={lang} isDarkMode={isDarkMode} setActivePage={setActivePage} theme={theme} />
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default App;
