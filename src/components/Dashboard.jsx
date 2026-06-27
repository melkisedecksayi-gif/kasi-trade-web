import React, { useState, useEffect, useRef } from 'react';
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
  
  const userMenuRef = useRef(null);

  const [stats, setStats] = useState({ totalSales: 0, todaySales: 0, todayProfit: 0, totalProducts: 0, totalCustomers: 0, lowStock: 0 });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) setIsSidebarOpen(true);
      if (mobile && isSidebarOpen) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);
    }
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      const { data: shopsData } = await supabase.from('shops').select('*').eq('user_id', user.id);
      if (shopsData && shopsData.length > 0) {
        setShops(shopsData);
        const currentShopId = profile?.current_shop_id || shopsData[0].id;
        setCurrentShop(shopsData.find(s => s.id === currentShopId) || shopsData[0]);
      } else {
        const { data: newShop } = await supabase.from('shops').insert([{ user_id: user.id, shop_name: lang === 'sw' ? 'Duka Langu' : 'My Shop', shop_type: 'duka' }]).select().single();
        if (newShop) {
          setShops([newShop]);
          setCurrentShop(newShop);
          await supabase.from('profiles').update({ current_shop_id: newShop.id }).eq('id', user.id);
        }
      }
    };
    loadData();
  }, [supabase, lang]);

  useEffect(() => {
    if (activePage === 'profile') {
      const interval = setInterval(loadUserProfile, 1000);
      return () => clearInterval(interval);
    }
  }, [activePage]);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchStats = async () => {
      const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id);
      const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id);
      const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id).lt('stock', 10);
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTrans } = await supabase.from('transactions').select('total_amount, profit').eq('shop_id', currentShop.id).gte('created_at', today);
      const todaySales = todayTrans?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const todayProfit = todayTrans?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0;
      setStats({ totalProducts: prodCount || 0, totalCustomers: custCount || 0, lowStock: lowStockCount || 0, todaySales, todayProfit, totalSales: todaySales });
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
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f8fafc', transition: 'background 0.3s', overflowX: 'hidden' }}>
      <Sidebar 
        supabase={supabase} 
        onLogout={handleLogout} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        lang={lang} 
        isSidebarOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isDarkMode={isDarkMode} 
      />

      <div style={{ 
        marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '72px'), 
        flex: 1, 
        padding: isMobile ? '16px' : '32px', 
        transition: 'margin-left 0.3s ease', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* TOPBAR - Responsive */}
        <div style={{ 
          background: isDarkMode ? '#1e293b' : '#fff', 
          borderRadius: '16px', 
          padding: isMobile ? '12px 16px' : '16px 24px', 
          marginBottom: isMobile ? '16px' : '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          flexWrap: 'wrap',
          gap: isMobile ? '8px' : '16px'
        }}>
          {/* Left: Hamburger + User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} ref={userMenuRef}>
            {/* Hamburger Button - Inaonekana tu kwenye simu */}
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: isDarkMode ? '#334155' : '#f1f5f9',
                  border: 'none',
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  flexShrink: 0
                }}
              >
                <Icons.Menu size={20} />
              </button>
            )}

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
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: '700',
                fontSize: isMobile ? '16px' : '18px',
                flexShrink: 0
              }}>
                {getUserAvatar() ? (
                  <img src={getUserAvatar()} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : getUserInitial()}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>
                    {lang === 'sw' ? 'Karibu,' : 'Welcome,'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {userProfile?.full_name || userProfile?.business_name || 'User'}
                    <Icons.ChevronDown size={14} />
                  </div>
                </div>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '60px' : '70px',
                left: isMobile ? '16px' : '24px',
                right: isMobile ? '16px' : 'auto',
                background: isDarkMode ? '#1e293b' : '#fff',
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: isMobile ? 'auto' : '240px',
                zIndex: 1000
              }}>
                {[
                  { icon: Icons.User, label: lang === 'sw' ? 'Wasifu Wangu' : 'My Profile', action: 'profile' },
                  { icon: Icons.Building, label: lang === 'sw' ? 'Wasifu wa Kampuni' : 'Company Profile', action: 'settings' },
                  { icon: Icons.Receipt, label: lang === 'sw' ? 'Bili na Malipo' : 'Bills & Payments', action: 'settings' },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => { setActivePage(item.action); setShowUserMenu(false); }}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                      color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: '14px', fontWeight: '500', textAlign: 'left'
                    }}
                  >
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
                <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#e2e8f0', margin: '8px 0' }}></div>
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    color: '#ef4444', fontSize: '14px', fontWeight: '500', textAlign: 'left'
                  }}
                >
                  <Icons.LogOut size={18} /> {lang === 'sw' ? 'Toka' : 'Logout'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Language Flags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => handleLanguageChange('sw')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: isMobile ? '6px 10px' : '8px 16px',
                background: lang === 'sw' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                border: `2px solid ${lang === 'sw' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`,
                borderRadius: '10px', cursor: 'pointer',
                opacity: lang === 'sw' ? 1 : 0.7
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>🇹🇿</span>
              {!isMobile && <span style={{ fontSize: '13px', fontWeight: lang === 'sw' ? '700' : '500', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>SW</span>}
            </button>
            <button 
              onClick={() => handleLanguageChange('en')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: isMobile ? '6px 10px' : '8px 16px',
                background: lang === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                border: `2px solid ${lang === 'en' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`,
                borderRadius: '10px', cursor: 'pointer',
                opacity: lang === 'en' ? 1 : 0.7
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>🇺🇸</span>
              {!isMobile && <span style={{ fontSize: '13px', fontWeight: lang === 'en' ? '700' : '500', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>EN</span>}
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activePage === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '32px' }}>
              {/* Stats Grid - Responsive */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: isMobile ? '12px' : '16px' 
              }}>
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} style={{ 
                      background: isDarkMode ? '#1e293b' : '#fff', 
                      padding: isMobile ? '16px' : '20px', 
                      borderRadius: '12px', 
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '12px' }}>
                        <Icon size={isMobile ? 18 : 20} />
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: isMobile ? '12px' : '13px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>{stat.label}</p>
                      <h3 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', wordBreak: 'break-word' }}>{stat.value}</h3>
                    </div>
                  );
                })}
              </div>

              {/* Welcome Card */}
              <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', padding: isMobile ? '24px' : '32px', color: '#fff', boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? '20px' : '24px', fontWeight: '700' }}>{lang === 'sw' ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!'}</h2>
                  <p style={{ margin: '0 0 20px', fontSize: isMobile ? '13px' : '14px', opacity: 0.95 }}>
                    {lang === 'sw' ? 'Mfumo wako wa kisasa wa POS uko tayari.' : 'Your modern POS system is ready.'}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setActivePage('pos')} style={{ padding: isMobile ? '10px 16px' : '10px 20px', background: '#fff', color: '#6366f1', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.ShoppingCart size={16} /> {lang === 'sw' ? 'Anza Kuuza' : 'Start Selling'}
                    </button>
                    <button onClick={() => setActivePage('products')} style={{ padding: isMobile ? '10px 16px' : '10px 20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.Box size={16} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Products'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activePage === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} isMobile={isMobile} />}
          {activePage === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} isMobile={isMobile} />}
          {activePage === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} isMobile={isMobile} />}
          {activePage === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} isMobile={isMobile} />}
          {activePage === 'settings' && <Settings lang={lang} setLang={setLang} supabase={supabase} currentShop={currentShop} shops={shops} setShops={setShops} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onNavigate={setActivePage} isMobile={isMobile} />}
          {activePage === 'profile' && <Profile lang={lang} supabase={supabase} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} onProfileUpdate={loadUserProfile} isMobile={isMobile} />}
        </div>
        
        {!isMobile && <Footer lang={lang} isDarkMode={isDarkMode} />}
      </div>
    </div>
  );
};

export default Dashboard;