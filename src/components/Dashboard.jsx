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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  
  const userMenuRef = useRef(null);
  const shopDropdownRef = useRef(null);

  const [stats, setStats] = useState({ totalSales: 0, todaySales: 0, todayProfit: 0, totalProducts: 0, totalCustomers: 0, lowStock: 0 });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target)) {
        setShowShopDropdown(false);
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
  }, [isDarkMode]);

  const isShopActive = (shop) => {
    if (!shop) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = (shop.working_hours_start || '08:00').split(':').map(Number);
    const [endHour, endMin] = (shop.working_hours_end || '20:00').split(':').map(Number);
    return currentTime >= (startHour * 60 + startMin) && currentTime <= (endHour * 60 + endMin);
  };

  const handleShopChange = (shopId) => {
    const selectedShop = shops.find(s => s.id === shopId);
    setCurrentShop(selectedShop);
    setShowShopDropdown(false);
    if (userProfile) supabase.from('profiles').update({ current_shop_id: shopId }).eq('id', userProfile.id);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  const statsCards = [
    { label: lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales', value: formatCurrency(stats.todaySales), icon: Icons.Sales, color: '#10b981' },
    { label: lang === 'sw' ? 'Faida ya Leo' : 'Today Profit', value: formatCurrency(stats.todayProfit), icon: Icons.Profit, color: '#6366f1' },
    { label: lang === 'sw' ? 'Bidhaa' : 'Products', value: stats.totalProducts, icon: Icons.Box, color: '#f59e0b' },
    { label: lang === 'sw' ? 'Wateja' : 'Customers', value: stats.totalCustomers, icon: Icons.Users, color: '#ec4899' },
    { label: lang === 'sw' ? 'Stock Ndogo' : 'Low Stock', value: stats.lowStock, icon: Icons.Alert, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f8fafc', transition: 'background 0.3s' }}>
      <Sidebar supabase={supabase} onLogout={handleLogout} activePage={activePage} setActivePage={setActivePage} lang={lang} isSidebarOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDarkMode={isDarkMode} />

      <div style={{ marginLeft: isSidebarOpen ? '260px' : '72px', flex: 1, padding: '32px', transition: 'margin-left 0.3s ease', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOPBAR MPYA */}
        <div style={{ 
          background: isDarkMode ? '#1e293b' : '#fff', 
          borderRadius: '16px', 
          padding: '16px 24px', 
          marginBottom: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
        }}>
          {/* Left: User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              {/* User Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (userProfile?.full_name || userProfile?.business_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>
                  {lang === 'sw' ? 'Karibu,' : 'Welcome,'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {userProfile?.full_name || userProfile?.business_name || 'User'}
                  <Icons.ChevronDown size={14} />
                </div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '80px',
                left: '24px',
                background: isDarkMode ? '#1e293b' : '#fff',
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: '220px',
                zIndex: 1000
              }}>
                <button 
                  onClick={() => { setActivePage('profile'); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Icons.User size={18} /> {lang === 'sw' ? 'Wasifu Wangu' : 'My Profile'}
                </button>
                <button 
                  onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Icons.Building size={18} /> {lang === 'sw' ? 'Wasifu wa Kampuni' : 'Company Profile'}
                </button>
                <button 
                  onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Icons.Receipt size={18} /> {lang === 'sw' ? 'Bili na Malipo' : 'Bills & Payments'}
                </button>
                <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#e2e8f0', margin: '8px 0' }}></div>
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#450a0a' : '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Icons.LogOut size={18} /> {lang === 'sw' ? 'Toka' : 'Logout'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Shop Selector + Active Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} ref={shopDropdownRef}>
            {/* Shop Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowShopDropdown(!showShopDropdown)}
                style={{
                  padding: '10px 16px',
                  background: isDarkMode ? '#334155' : '#f8fafc',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <Icons.Building size={16} />
                {currentShop?.shop_name || '---'}
                <Icons.ChevronDown size={14} />
              </button>
              
              {showShopDropdown && shops.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: isDarkMode ? '#1e293b' : '#fff',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  padding: '8px',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  {shops.map(shop => (
                    <button 
                      key={shop.id}
                      onClick={() => handleShopChange(shop.id)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: shop.id === currentShop?.id ? (isDarkMode ? '#334155' : '#f1f5f9') : 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                        fontSize: '14px',
                        fontWeight: shop.id === currentShop?.id ? '600' : '500',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => { if (shop.id !== currentShop?.id) e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'; }}
                      onMouseLeave={(e) => { if (shop.id !== currentShop?.id) e.currentTarget.style.background = 'none'; }}
                    >
                      <span>{shop.shop_name}</span>
                      {shop.id === currentShop?.id && <Icons.Check size={16} color="#10b981" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status */}
            {currentShop && (
              <span style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', 
                background: isShopActive(currentShop) ? '#d1fae5' : '#fee2e2', 
                color: isShopActive(currentShop) ? '#059669' : '#dc2626' 
              }}>
                {isShopActive(currentShop) ? <Icons.Activity size={14} /> : <Icons.XCircle size={14} />}
                {isShopActive(currentShop) ? (lang === 'sw' ? 'Inafanya Kazi' : 'Active') : (lang === 'sw' ? 'Imefungwa' : 'Closed')}
              </span>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1 }}>
          {activePage === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} style={{ 
                      background: isDarkMode ? '#1e293b' : '#fff', padding: '20px', borderRadius: '12px', 
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' 
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                          <Icon size={20} />
                        </div>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>{stat.label}</p>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{stat.value}</h3>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', padding: '32px', color: '#fff', boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>{lang === 'sw' ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!'}</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: 0.95, maxWidth: '500px' }}>
                    {lang === 'sw' ? 'Mfumo wako wa kisasa wa POS uko tayari. Anza sasa kwa kuchagua sehemu kwenye sidebar.' : 'Your modern POS system is ready. Get started by selecting a section from the sidebar.'}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setActivePage('pos')} style={{ padding: '10px 20px', background: '#fff', color: '#6366f1', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.ShoppingCart size={16} /> {lang === 'sw' ? 'Anza Kuuza' : 'Start Selling'}
                    </button>
                    <button onClick={() => setActivePage('products')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.Box size={16} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Products'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activePage === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {activePage === 'settings' && <Settings lang={lang} setLang={setLang} supabase={supabase} currentShop={currentShop} shops={shops} setShops={setShops} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onNavigate={setActivePage} />}
          {activePage === 'profile' && <Profile lang={lang} supabase={supabase} isDarkMode={isDarkMode} onBack={() => setActivePage('dashboard')} />}
        </div>
        
        <Footer lang={lang} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default Dashboard;