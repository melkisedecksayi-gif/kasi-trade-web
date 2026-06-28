import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './layout/Sidebar';
import POS from './POS';
import Products from './Products';
import Customers from './Customers';
import Reports from './Reports';
import Settings from './Settings';
import Profile from './Profile';
import Footer from './Footer';
import { Icons } from './Icons';

const Dashboard = ({ supabase }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [userProfile, setUserProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState({ totalSales: 0, todaySales: 0, todayProfit: 0, totalProducts: 0, totalCustomers: 0, lowStock: 0 });
  
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setUserProfile(profile);
      }
    } catch (err) {
      console.error('Profile load error:', err);
    }
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setUserProfile(profile);
        const { data: shopsData } = await supabase.from('shops').select('*').eq('user_id', user.id);
        if (shopsData && shopsData.length > 0) {
          setShops(shopsData);
          const currentShopId = profile?.current_shop_id || shopsData[0].id;
          setCurrentShop(shopsData.find(s => s.id === currentShopId) || shopsData[0]);
        } else {
          const { data: newShop } = await supabase.from('shops').insert([{ user_id: user.id, shop_name: 'Duka Langu', shop_type: 'duka' }]).select().single();
          if (newShop) {
            setShops([newShop]);
            setCurrentShop(newShop);
          }
        }
      } catch (err) {
        console.error('Load data error:', err);
      }
    };
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (activePage === 'profile') {
      const interval = setInterval(loadUserProfile, 1000);
      return () => clearInterval(interval);
    }
  }, [activePage, loadUserProfile]);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchStats = async () => {
      try {
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id);
        const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id);
        const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id).lt('stock', 10);
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTrans } = await supabase.from('transactions').select('total_amount, profit').eq('shop_id', currentShop.id).gte('created_at', today);
        const todaySales = todayTrans?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const todayProfit = todayTrans?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0;
        setStats({ totalProducts: prodCount || 0, totalCustomers: custCount || 0, lowStock: lowStockCount || 0, todaySales, todayProfit, totalSales: todaySales });
      } catch (err) {
        console.error('Stats error:', err);
      }
    };
    fetchStats();
  }, [currentShop, supabase]);

  useEffect(() => {
    document.body.style.background = isDarkMode ? '#0f172a' : '#f8fafc';
    document.body.style.color = isDarkMode ? '#f1f5f9' : '#0f172a';
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
  }, [isDarkMode]);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const statsCards = [
    { label: lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales', value: formatCurrency(stats.todaySales), icon: Icons.Sales, color: '#10b981' },
    { label: lang === 'sw' ? 'Faida ya Leo' : 'Today Profit', value: formatCurrency(stats.todayProfit), icon: Icons.Profit, color: '#6366f1' },
    { label: lang === 'sw' ? 'Bidhaa' : 'Products', value: stats.totalProducts, icon: Icons.Box, color: '#f59e0b' },
    { label: lang === 'sw' ? 'Wateja' : 'Customers', value: stats.totalCustomers, icon: Icons.Users, color: '#ec4899' },
    { label: lang === 'sw' ? 'Stock Ndogo' : 'Low Stock', value: stats.lowStock, icon: Icons.Alert, color: '#ef4444' },
  ];

  const getUserAvatar = () => userProfile?.avatar_url || null;
  const getUserInitial = () => {
    if (userProfile?.full_name) return userProfile.full_name.charAt(0).toUpperCase();
    if (userProfile?.business_name) return userProfile.business_name.charAt(0).toUpperCase();
    return 'U';
  };

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f8fafc', overflowX: 'hidden' }}>
      <Sidebar 
        supabase={supabase} 
        onLogout={handleLogout} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        lang={lang} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode} 
      />

      <div style={{ 
        marginLeft: isMobile ? '0' : '0', 
        flex: 1, 
        padding: isMobile ? '16px' : '32px', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0
      }}>
        
        <div style={{ 
          background: bgColor, 
          borderRadius: '16px', 
          padding: isMobile ? '12px 16px' : '16px 24px', 
          marginBottom: isMobile ? '16px' : '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          border: `1px solid ${borderColor}`, 
          position: 'relative',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} ref={userMenuRef}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: isDarkMode ? '#334155' : '#f1f5f9',
                border: 'none',
                width: '44px', height: '44px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: textColor,
                flexShrink: 0
              }}
            >
              <Icons.Menu size={22} />
            </button>

            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                flex: 1
              }}
            >
              <div style={{
                width: isMobile ? '36px' : '44px',
                height: isMobile ? '36px' : '44px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${borderColor}`,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: '700',
                fontSize: isMobile ? '14px' : '16px',
                flexShrink: 0
              }}>
                {getUserAvatar() ? (
                  <img src={getUserAvatar()} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : getUserInitial()}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: subTextColor, marginBottom: '2px' }}>
                    {lang === 'sw' ? 'Karibu,' : 'Welcome,'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: textColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {userProfile?.full_name || userProfile?.business_name || 'User'}
                    <Icons.ChevronDown size={14} />
                  </div>
                </div>
              )}
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '70px',
                left: '16px',
                right: isMobile ? '16px' : 'auto',
                background: bgColor,
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: isMobile ? 'auto' : '240px',
                zIndex: 1000
              }}>
                <button onClick={() => { setActivePage('profile'); setShowUserMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: textColor, fontSize: '14px', textAlign: 'left' }}>
                  <Icons.User size={18} /> {lang === 'sw' ? 'Wasifu' : 'Profile'}
                </button>
                <button onClick={() => { setActivePage('settings'); setShowUserMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: textColor, fontSize: '14px', textAlign: 'left' }}>
                  <Icons.Settings size={18} /> {lang === 'sw' ? 'Mipangilio' : 'Settings'}
                </button>
                <div style={{ height: '1px', background: borderColor, margin: '8px 0' }}></div>
                <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', fontSize: '14px', textAlign: 'left' }}>
                  <Icons.LogOut size={18} /> {lang === 'sw' ? 'Toka' : 'Logout'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => handleLanguageChange('sw')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '6px 10px' : '8px 16px', background: lang === 'sw' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: `2px solid ${lang === 'sw' ? '#6366f1' : borderColor}`, borderRadius: '10px', cursor: 'pointer', opacity: lang === 'sw' ? 1 : 0.7 }}>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>🇹🇿</span>
              {!isMobile && <span style={{ fontSize: '13px', fontWeight: lang === 'sw' ? '700' : '500', color: textColor }}>SW</span>}
            </button>
            <button onClick={() => handleLanguageChange('en')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '6px 10px' : '8px 16px', background: lang === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: `2px solid ${lang === 'en' ? '#6366f1' : borderColor}`, borderRadius: '10px', cursor: 'pointer', opacity: lang === 'en' ? 1 : 0.7 }}>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>🇺🇸</span>
              {!isMobile && <span style={{ fontSize: '13px', fontWeight: lang === 'en' ? '700' : '500', color: textColor }}>EN</span>}
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activePage === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '12px' : '16px' }}>
                {Array.isArray(statsCards) && statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} style={{ background: bgColor, padding: isMobile ? '16px' : '20px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                      <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '12px' }}>
                        <Icon size={isMobile ? 18 : 20} />
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: isMobile ? '11px' : '13px', color: subTextColor, fontWeight: '500' }}>{stat.label}</p>
                      <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '22px', fontWeight: '700', color: textColor, wordBreak: 'break-word' }}>{stat.value}</h3>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', padding: isMobile ? '20px' : '32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? '18px' : '24px', fontWeight: '700' }}>{lang === 'sw' ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!'}</h2>
                <p style={{ margin: '0 0 20px', fontSize: isMobile ? '12px' : '14px', opacity: 0.95 }}>
                  {lang === 'sw' ? 'Mfumo wako wa kisasa wa POS uko tayari.' : 'Your modern POS system is ready.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => setActivePage('pos')} style={{ padding: isMobile ? '10px 14px' : '10px 20px', background: '#fff', color: '#6366f1', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.ShoppingCart size={16} /> {lang === 'sw' ? 'Anza Kuuza' : 'Start Selling'}
                  </button>
                  <button onClick={() => setActivePage('products')} style={{ padding: isMobile ? '10px 14px' : '10px 20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Box size={16} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Products'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activePage === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'settings' && <Settings lang={lang} setLang={setLang} supabase={supabase} currentShop={currentShop} shops={shops} setShops={setShops} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onNavigate={setActivePage} />}
          {activePage === 'profile' && <Profile lang={lang} supabase={supabase} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} onProfileUpdate={loadUserProfile} />}
        </div>
        
        {!isMobile && <Footer lang={lang} isDarkMode={isDarkMode} />}
      </div>
    </div>
  );
};

export default Dashboard;