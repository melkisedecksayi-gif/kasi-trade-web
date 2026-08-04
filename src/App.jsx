import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import { getThemeColors } from './theme';
import useKeyboard from './hooks/useKeyboard';
import { useSubscription } from './hooks/useSubscription';
import { sendSMS, generateReportSMS, sendBulkSMS } from './services/smsService';
import { sendReportEmail, sendLowStockEmail, sendBirthdayEmail } from './services/emailService';
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
  const autoSentRef = useRef({});

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
      try {
        const { data: settings } = await supabase.from('sms_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (!settings) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const closeTime = settings.auto_close_time || '22:00';
        if (currentTime < closeTime) return;

        const today = now.toISOString().split('T')[0];
        const sentKey = `close_${currentShop.id}_${today}`;
        if (autoSentRef.current[sentKey]) return;

        const { data: existingLog } = await supabase.from('sms_logs')
          .select('id').eq('shop_id', currentShop.id).eq('type', 'auto_close')
          .gte('created_at', today).maybeSingle();
        if (existingLog) { autoSentRef.current[sentKey] = true; return; }

        let phone = settings.phone || currentShop?.phone || '';
        if (!phone) {
          const { data: profile } = await supabase.from('profiles').select('phone').eq('id', currentShop.owner_id).maybeSingle();
          phone = profile?.phone || '';
        }
        if (!phone) return;

        const { data: todayTx } = await supabase.from('transactions')
          .select('total_amount, profit, items_count, payment_method, discount, customer_id').eq('shop_id', currentShop.id).gte('created_at', today);
        const totalRevenue = (todayTx || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
        const totalProfit = (todayTx || []).reduce((s, tx) => s + (tx.profit || 0), 0);
        const totalTx = (todayTx || []).length;
        const productsSold = (todayTx || []).reduce((s, tx) => s + (tx.items_count || 0), 0);

        const paymentBreakdown = {};
        const uniqueCustomers = new Set();
        let highestSale = 0;
        let lowestSale = Infinity;
        let totalDiscount = 0;
        (todayTx || []).forEach(tx => {
          const pm = tx.payment_method || 'cash';
          paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + (tx.total_amount || 0);
          if (tx.customer_id) uniqueCustomers.add(tx.customer_id);
          if (tx.total_amount > highestSale) highestSale = tx.total_amount;
          if (tx.total_amount < lowestSale && tx.total_amount > 0) lowestSale = tx.total_amount;
          totalDiscount += tx.discount || 0;
        });
        if (lowestSale === Infinity) lowestSale = 0;

        let topProducts = [];
        try {
          const { data: txIds } = await supabase.from('transactions').select('id').eq('shop_id', currentShop.id).gte('created_at', today);
          if (txIds && txIds.length > 0) {
            const ids = txIds.map(t => t.id);
            const { data: items } = await supabase.from('transaction_items').select('product_name, quantity, total_price, buy_price').in('transaction_id', ids);
            const productMap = {};
            (items || []).forEach(item => {
              const name = item.product_name || 'Unknown';
              if (!productMap[name]) productMap[name] = { name, total: 0, quantity: 0 };
              productMap[name].total += item.total_price || 0;
              productMap[name].quantity += item.quantity || 0;
            });
            topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 5);
          }
        } catch (e) {}

        let totalExpenses = 0;
        try {
          const { data: expData } = await supabase.from('expenses').select('amount').eq('shop_id', currentShop.id).gte('expense_date', today);
          totalExpenses = (expData || []).reduce((s, e) => s + (e.amount || 0), 0);
        } catch (e) {}

        const reportData = {
          shopName: currentShop?.shop_name || '',
          date: today,
          totalRevenue,
          totalProfit,
          totalExpenses,
          netProfit: totalProfit - totalExpenses,
          totalTransactions: totalTx,
          avgOrderValue: totalTx > 0 ? totalRevenue / totalTx : 0,
          productsSold,
          customerCount: uniqueCustomers.size,
          paymentBreakdown,
          topProducts,
          salesSummary: { highest: highestSale, lowest: lowestSale, totalDiscount },
        };
        const message = generateReportSMS(reportData, lang);
        const result = await sendSMS({ to: phone, message });

        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id, recipient: phone, message, type: 'auto_close',
          status: result.success ? 'sent' : 'failed',
          provider_response: result.success ? JSON.stringify(result.data).slice(0, 500) : (result.error?.slice(0, 500) || '')
        });
        autoSentRef.current[sentKey] = true;

        const { data: emailCfg } = await supabase.from('email_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (emailCfg && emailCfg.report_email && emailCfg.report_template_id) {
          sendReportEmail({
            email: emailCfg.report_email,
            reportData,
            shopName: currentShop?.shop_name || '',
            lang,
            publicKey: emailCfg.public_key,
            serviceId: emailCfg.service_id,
            templateId: emailCfg.report_template_id,
          }).then(r => {
            supabase.from('email_logs').insert({
              shop_id: currentShop.id, recipient: emailCfg.report_email, subject: 'Daily Report',
              type: 'auto_close', status: r.success ? 'sent' : 'failed',
              provider_response: r.success ? JSON.stringify(r.data).slice(0, 500) : (r.error?.slice(0, 500) || '')
            });
          }).catch(() => {});
        }
      } catch (e) { logger.warn('App', 'Auto close SMS error:', e); }
    };

    const checkLowStock = async () => {
      try {
        const { data: settings } = await supabase.from('sms_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (!settings) return;

        const threshold = settings.low_stock_threshold || 10;
        const today = new Date().toISOString().split('T')[0];
        const alertKey = `stock_${currentShop.id}_${today}`;
        if (autoSentRef.current[alertKey]) return;

        const { data: lowProducts } = await supabase.from('products')
          .select('name, stock').eq('shop_id', currentShop.id).lt('stock', threshold).limit(10);

        if (!lowProducts || lowProducts.length === 0) return;

        let phone = settings.phone || currentShop?.phone || '';
        if (!phone) {
          const { data: profile } = await supabase.from('profiles').select('phone').eq('id', currentShop.owner_id).maybeSingle();
          phone = profile?.phone || '';
        }
        if (!phone) return;

        const productList = lowProducts.map(p => `${p.name} (${p.stock})`).join(', ');
        const msg = lang === 'sw'
          ? `TAHADHARI STOCK\n\nBidhaa zifuatazo ziko chini ya ${threshold}:\n${productList}\n\n${currentShop?.shop_name || 'KasiTRADE'}`
          : `LOW STOCK ALERT\n\nProducts below ${threshold}:\n${productList}\n\n${currentShop?.shop_name || 'KasiTRADE'}`;

        const result = await sendSMS({ to: phone, message: msg });

        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id, recipient: phone, message: msg, type: 'low_stock',
          status: result.success ? 'sent' : 'failed',
          provider_response: result.success ? JSON.stringify(result.data).slice(0, 500) : (result.error?.slice(0, 500) || '')
        });
        autoSentRef.current[alertKey] = true;

        const { data: emailCfg } = await supabase.from('email_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (emailCfg && emailCfg.report_email && emailCfg.low_stock_template_id) {
          sendLowStockEmail({
            email: emailCfg.report_email,
            products: lowProducts,
            threshold: emailCfg.low_stock_threshold || threshold,
            shopName: currentShop?.shop_name || '',
            lang,
            publicKey: emailCfg.public_key,
            serviceId: emailCfg.service_id,
            templateId: emailCfg.low_stock_template_id,
          }).then(r => {
            supabase.from('email_logs').insert({
              shop_id: currentShop.id, recipient: emailCfg.report_email, subject: 'Low Stock Alert',
              type: 'low_stock', status: r.success ? 'sent' : 'failed',
              provider_response: r.success ? JSON.stringify(r.data).slice(0, 500) : (r.error?.slice(0, 500) || '')
            });
          }).catch(() => {});
        }
      } catch (e) { logger.warn('App', 'Low stock SMS error:', e); }
    };

    const checkBirthdays = async () => {
      try {
        const { data: settings } = await supabase.from('sms_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (!settings) return;
        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        const todayStr = today.toISOString().split('T')[0];
        const alertKey = `birthday_${currentShop.id}_${todayStr}`;
        if (autoSentRef.current[alertKey]) return;

        const { data: bdayCustomers } = await supabase.from('customers')
          .select('id, name, phone')
          .eq('shop_id', currentShop.id)
          .filter('birthday', 'not.is', null)
          .limit(50);

        if (!bdayCustomers || bdayCustomers.length === 0) return;

        const todayBirthdays = bdayCustomers.filter(c => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          return (bday.getMonth() + 1) === todayMonth && bday.getDate() === todayDay;
        });

        if (todayBirthdays.length === 0) return;

        const msg = lang === 'sw'
          ? `${currentShop?.shop_name || 'KasiTRADE'}\n\nHeri ya kuzaliwa! Tunakutakia siku njema yenye baraka. Tembelea duka letu kwa ofa maalum ya siku yako ya kuzaliwa. Karibu!`
          : `${currentShop?.shop_name || 'KasiTRADE'}\n\nHappy Birthday! Wishing you a blessed day. Visit our shop for a special birthday offer. Welcome!`;

        const recipients = todayBirthdays.map(c => c.phone).filter(Boolean);
        if (recipients.length === 0) return;

        const results = await sendBulkSMS({ recipients, message: msg });

        const logs = results.map(r => ({
          shop_id: currentShop.id,
          recipient: r.recipient,
          message: msg,
          type: 'birthday',
          status: r.success ? 'sent' : 'failed',
          provider_response: r.success ? null : (r.error?.slice(0, 500) || ''),
        }));
        if (logs.length > 0) {
          await supabase.from('sms_logs').insert(logs);
        }
        autoSentRef.current[alertKey] = true;

        const { data: emailCfg } = await supabase.from('email_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (emailCfg && emailCfg.report_template_id) {
          const emailRecipients = todayBirthdays.filter(c => c.email).map(c => ({ name: c.name, email: c.email }));
          for (const r of emailRecipients) {
            sendBirthdayEmail({
              email: r.email,
              customerName: r.name,
              shopName: currentShop?.shop_name || '',
              lang,
              publicKey: emailCfg.public_key,
              serviceId: emailCfg.service_id,
              templateId: emailCfg.report_template_id,
            }).then(result => {
              supabase.from('email_logs').insert({
                shop_id: currentShop.id, recipient: r.email, subject: 'Birthday',
                type: 'birthday', status: result.success ? 'sent' : 'failed',
                provider_response: result.success ? null : (result.error?.slice(0, 500) || '')
              });
            }).catch(() => {});
          }
        }
      } catch (e) { logger.warn('App', 'Birthday SMS error:', e); }
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
      case 'products': return <Products {...props} />;
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
