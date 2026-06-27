import React, { useState, useEffect } from 'react';
import Sidebar from './layout/Sidebar';
import POS from './POS';
import Products from './Products';
import Customers from './Customers';
import Reports from './Reports';
import Settings from './Settings';
import { Icons } from './Icons';

const Dashboard = ({ supabase }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [userProfile, setUserProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopForm, setNewShopForm] = useState({ shop_name: '', shop_type: 'duka', region: '' });
  
  const [stats, setStats] = useState({ totalSales: 0, todaySales: 0, todayProfit: 0, totalProducts: 0, totalCustomers: 0, lowStock: 0 });

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

  // ✅ LOGIC YA ACTIVE STATUS
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
    if (userProfile) supabase.from('profiles').update({ current_shop_id: shopId }).eq('id', userProfile.id);
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.shop_name || !userProfile) return;
    const { data } = await supabase.from('shops').insert([{ user_id: userProfile.id, ...newShopForm }]).select().single();
    if (data) {
      setShops([...shops, data]);
      setCurrentShop(data);
      setShowAddShopModal(false);
      setNewShopForm({ shop_name: '', shop_type: 'duka', region: '' });
    }
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar supabase={supabase} onLogout={handleLogout} activePage={activePage} setActivePage={setActivePage} lang={lang} isSidebarOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div style={{ marginLeft: isSidebarOpen ? '260px' : '72px', flex: 1, padding: '32px', transition: 'margin-left 0.3s ease' }}>
        {/* TOPBAR */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 28px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
              {activePage === 'dashboard' && 'Dashibodi'}
              {activePage === 'pos' && 'Mauzo'}
              {activePage === 'products' && 'Bidhaa'}
              {activePage === 'customers' && 'Wateja'}
              {activePage === 'reports' && 'Ripoti'}
              {activePage === 'settings' && 'Mipangilio'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{currentShop?.shop_name || '---'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select value={currentShop?.id || ''} onChange={(e) => handleShopChange(e.target.value)} style={{ padding: '10px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', outline: 'none' }}>
              {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.shop_name}</option>)}
            </select>
            
            {/* ✅ ACTIVE STATUS BADGE */}
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

            <button onClick={() => setShowAddShopModal(true)} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Plus size={16} /> {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}
            </button>
          </div>
        </div>

        {activePage === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</h3>
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
        
        {activePage === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'settings' && <Settings lang={lang} supabase={supabase} currentShop={currentShop} />}
      </div>

      {showAddShopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>+ {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}</h2>
              <button onClick={() => setShowAddShopModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={16} /></button>
            </div>
            <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder={lang === 'sw' ? 'Jina la Duka' : 'Shop Name'} required value={newShopForm.shop_name} onChange={(e) => setNewShopForm({...newShopForm, shop_name: e.target.value})} style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
              <select value={newShopForm.shop_type} onChange={(e) => setNewShopForm({...newShopForm, shop_type: e.target.value})} style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff' }}>
                <option value="duka">🛒 Duka</option>
                <option value="microfinance">💰 Microfinance</option>
              </select>
              <input type="text" placeholder={lang === 'sw' ? 'Mkoa' : 'Region'} value={newShopForm.region} onChange={(e) => setNewShopForm({...newShopForm, region: e.target.value})} style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddShopModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{lang === 'sw' ? 'Hifadhi' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;