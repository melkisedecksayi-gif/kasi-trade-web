import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icons } from './Icons';
import Sidebar from './layout/Sidebar';
import POS from './POS';
import Products from './Products';
import Customers from './Customers';
import Reports from './Reports';
import Settings from './Settings';
import Profile from './Profile';
import About from './About';
import Help from './Help';
import Terms from './Terms';
import Privacy from './Privacy';
import Footer from './Footer';
import Toast from './Toast';

const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentShop, setCurrentShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'sw');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    todayProfit: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStock: 0
  });

  // Auth Listener
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Shops & Stats
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        // Fetch shops
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (shopsError) throw shopsError;

        setShops(shopsData || []);
        if (shopsData && shopsData.length > 0) {
          setCurrentShop(shopsData[0]);
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    fetchData();
  }, [session]);

  // Fetch Stats when shop changes
  useEffect(() => {
    if (!currentShop?.id) return;

    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Total products
        const { count: prodCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id);

        // Total customers
        const { count: custCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id);

        // Low stock
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id)
          .lt('stock', 10);

        // Today's transactions
        const { data: todayTrans } = await supabase
          .from('transactions')
          .select('total_amount, profit')
          .eq('shop_id', currentShop.id)
          .gte('created_at', today);

        const todaySales = todayTrans?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const todayProfit = todayTrans?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0;

        setStats({
          totalProducts: prodCount || 0,
          totalCustomers: custCount || 0,
          lowStock: lowStockCount || 0,
          todaySales,
          todayProfit,
          totalSales: todaySales
        });
      } catch (err) {
        console.error('Stats error:', err);
      }
    };

    fetchStats();
  }, [currentShop]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Loading Screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode ? '#0f172a' : '#f8fafc',
        color: isDarkMode ? '#f1f5f9' : '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div>
        </div>
      </div>
    );
  }

  // Theme
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

  // Stats Cards
  const statsCards = [
    { label: lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales', value: formatCurrency(stats.todaySales), icon: Icons.Sales, color: '#10b981' },
    { label: lang === 'sw' ? 'Faida ya Leo' : 'Today Profit', value: formatCurrency(stats.todayProfit), icon: Icons.Profit, color: '#6366f1' },
    { label: lang === 'sw' ? 'Bidhaa' : 'Products', value: stats.totalProducts, icon: Icons.Box, color: '#f59e0b' },
    { label: lang === 'sw' ? 'Wateja' : 'Customers', value: stats.totalCustomers, icon: Icons.Users, color: '#ec4899' },
    { label: lang === 'sw' ? 'Stock Ndogo' : 'Low Stock', value: stats.lowStock, icon: Icons.Alert, color: '#ef4444' },
  ];

  // View Titles
  const viewTitles = {
    dashboard: 'Dashboard',
    pos: lang === 'sw' ? 'Mauzo' : 'Sales',
    products: lang === 'sw' ? 'Bidhaa' : 'Products',
    reports: lang === 'sw' ? 'Ripoti' : 'Reports',
    customers: lang === 'sw' ? 'Wateja' : 'Customers',
    settings: lang === 'sw' ? 'Mipangilio' : 'Settings',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, position: 'relative', overflow: 'hidden' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        lang={lang}
        isDarkMode={isDarkMode}
        session={session}
        onLogout={handleLogout}
        shops={shops}
        currentShop={currentShop}
        setCurrentShop={setCurrentShop}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 99
        }} />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, overflow: 'hidden' }}>
        
        {/* Top Bar */}
        <div style={{
          background: theme.cardBg,
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: '40px', height: '40px', borderRadius: '10px',
            border: 'none', background: theme.bg, color: theme.text,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icons.Menu size={22} />
          </button>

          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.text, flex: 1 }}>
            {viewTitles[currentView] || 'Dashboard'}
          </h1>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')} style={{
              padding: '8px 12px', background: theme.bg,
              border: `1px solid ${theme.border}`, borderRadius: '8px',
              color: theme.text, cursor: 'pointer', fontWeight: '600', fontSize: '12px'
            }}>
              {lang === 'sw' ? 'EN' : 'SW'}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: theme.bg, border: `1px solid ${theme.border}`,
              color: theme.text, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isDarkMode ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', width: '100%', maxWidth: '100%', padding: '16px' }}>
          
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} style={{
                      background: theme.cardBg,
                      padding: '20px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        width: '40px', height: '40px',
                        background: `${stat.color}15`,
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: stat.color,
                        marginBottom: '12px'
                      }}>
                        <Icon size={20} />
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>
                        {stat.label}
                      </p>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: theme.text }}>
                        {stat.value}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* Welcome Card */}
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>
                  {lang === 'sw' ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!'}
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: 0.95 }}>
                  {lang === 'sw' ? 'Mfumo wako wa kisasa wa POS uko tayari.' : 'Your modern POS system is ready.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => setCurrentView('pos')} style={{
                    padding: '10px 20px',
                    background: '#fff',
                    color: '#6366f1',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Icons.ShoppingCart size={16} /> {lang === 'sw' ? 'Anza Kuuza' : 'Start Selling'}
                  </button>
                  <button onClick={() => setCurrentView('products')} style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Icons.Box size={16} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Products'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Views */}
          {currentView === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} setToast={setToast} />}
          {currentView === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} setToast={setToast} />}
          {currentView === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} setToast={setToast} />}
          {currentView === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {currentView === 'settings' && <Settings lang={lang} setLang={setLang} supabase={supabase} currentShop={currentShop} shops={shops} setShops={setShops} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} setCurrentShop={setCurrentShop} setToast={setToast} />}
          {currentView === 'profile' && <Profile lang={lang} supabase={supabase} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} setToast={setToast} />}
          {currentView === 'about' && <About lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'help' && <Help lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'terms' && <Terms lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'privacy' && <Privacy lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
        </div>

        {/* Footer */}
        <Footer lang={lang} isDarkMode={isDarkMode} onNavigate={setCurrentView} />
      </div>
    </div>
  );
};

export default Dashboard;