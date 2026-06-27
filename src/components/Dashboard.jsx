import React, { useState, useEffect } from 'react';
import Sidebar from './layout/Sidebar';
import POS from './POS';
import Products from './Products';
import Customers from './Customers';
import Reports from './Reports';
import Settings from './Settings';
import { translations } from '../translations';

const Dashboard = ({ supabase }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [userProfile, setUserProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // ✅ Collapsible state
  const [showHelpModal, setShowHelpModal] = useState(false); // ✅ Help Modal
  const [showAddShopModal, setShowAddShopModal] = useState(false); // ✅ Add Shop Modal
  const [newShopForm, setNewShopForm] = useState({ shop_name: '', shop_type: 'duka', region: '' });
  
  const [stats, setStats] = useState({ todaySales: 0, todayProfit: 0, totalProducts: 0, lowStock: 0, totalCustomers: 0, pendingOrders: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesChart, setSalesChart] = useState([]);

  const t = translations[lang] || translations.sw;

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);

        // Fetch real shops
        const { data: shopsData } = await supabase.from('shops').select('*').eq('user_id', user.id);
        if (shopsData && shopsData.length > 0) {
          setShops(shopsData);
          const currentShopId = profile?.current_shop_id || shopsData[0].id;
          setCurrentShop(shopsData.find(s => s.id === currentShopId) || shopsData[0]);
        } else {
          // Fallback: Create a default shop if none exists
          const { data: newShop } = await supabase.from('shops').insert([{ user_id: user.id, shop_name: 'Duka Langu', shop_type: 'duka' }]).select().single();
          if (newShop) {
            setShops([newShop]);
            setCurrentShop(newShop);
            await supabase.from('profiles').update({ current_shop_id: newShop.id }).eq('id', user.id);
          }
        }

        setStats({ todaySales: 1250000, todayProfit: 320000, totalProducts: 156, lowStock: 12, totalCustomers: 89, pendingOrders: 5 });
        setRecentTransactions([
          { id: 1, customer: 'John Doe', amount: 45000, items: 3, time: '10:30 AM', status: 'completed' },
          { id: 2, customer: 'Jane Smith', amount: 78000, items: 5, time: '11:15 AM', status: 'completed' },
        ]);
        setTopProducts([
          { id: 1, name: 'Rice 5kg', sold: 45, revenue: 225000 },
          { id: 2, name: 'Cooking Oil 1L', sold: 38, revenue: 152000 },
        ]);
        setSalesChart([
          { day: 'Mon', sales: 850000 }, { day: 'Tue', sales: 920000 }, { day: 'Wed', sales: 780000 },
          { day: 'Thu', sales: 1100000 }, { day: 'Fri', sales: 1350000 }, { day: 'Sat', sales: 1500000 }, { day: 'Sun', sales: 1250000 },
        ]);
      }
    };
    loadData();
  }, [supabase]);

  const isShopActive = (shop) => {
    if (!shop) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = (shop.working_hours_start || '08:00:00').split(':').map(Number);
    const [endHour, endMin] = (shop.working_hours_end || '20:00:00').split(':').map(Number);
    return currentTime >= (startHour * 60 + startMin) && currentTime <= (endHour * 60 + endMin);
  };

  const handleShopChange = (shopId) => {
    const selectedShop = shops.find(s => s.id === shopId);
    setCurrentShop(selectedShop);
    supabase.from('profiles').update({ current_shop_id: shopId }).eq('id', userProfile.id);
  };

  // ✅ ADD NEW SHOP LOGIC
  const handleAddShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.shop_name) return;
    const { data, error } = await supabase.from('shops').insert([{ user_id: userProfile.id, ...newShopForm }]).select().single();
    if (!error && data) {
      setShops([...shops, data]);
      setCurrentShop(data);
      setShowAddShopModal(false);
      setNewShopForm({ shop_name: '', shop_type: 'duka', region: '' });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  const bubbles = [
    { size: 300, top: '10%', left: '80%', delay: '0s', duration: '25s' },
    { size: 200, top: '60%', left: '10%', delay: '2s', duration: '20s' },
    { size: 150, top: '80%', left: '70%', delay: '4s', duration: '22s' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        {bubbles.map((bubble, index) => (
          <div key={index} style={{ position: 'absolute', width: `${bubble.size}px`, height: `${bubble.size}px`, top: bubble.top, left: bubble.left, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', opacity: 0.04, filter: 'blur(40px)', animation: `floatBubble ${bubble.duration} ease-in-out ${bubble.delay} infinite` }} />
        ))}
      </div>

      <div style={{ zIndex: 10, position: 'relative' }}>
        <Sidebar 
          supabase={supabase} onLogout={handleLogout} activePage={activePage} setActivePage={setActivePage} lang={lang}
          isSidebarOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} onHelpClick={() => setShowHelpModal(true)}
        />
      </div>

      <div style={{ marginLeft: isSidebarOpen ? '260px' : '80px', flex: 1, padding: '30px', position: 'relative', zIndex: 10, transition: 'margin-left 0.3s ease' }}>
        
        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>☰</button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '700' }}>
                {activePage === 'dashboard' && (lang === 'sw' ? 'Dashibodi Kuu' : 'Main Dashboard')}
                {activePage === 'pos' && (lang === 'sw' ? 'Mauzo (POS)' : 'Sales POS')}
                {activePage === 'products' && (lang === 'sw' ? 'Bidhaa' : 'Products')}
                {activePage === 'customers' && (lang === 'sw' ? 'Wateja' : 'Customers')}
                {activePage === 'reports' && (lang === 'sw' ? 'Ripoti' : 'Reports')}
                {activePage === 'settings' && (lang === 'sw' ? 'Mipangilio' : 'Settings')}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <select value={currentShop?.id || ''} onChange={(e) => handleShopChange(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
                  {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.shop_name}</option>)}
                </select>
                {/* ✅ ADD SHOP BUTTON */}
                <button onClick={() => setShowAddShopModal(true)} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                   {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}
                </button>
                {currentShop && (
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: isShopActive(currentShop) ? '#dcfce7' : '#fee2e2', color: isShopActive(currentShop) ? '#16a34a' : '#dc2626' }}>
                    {isShopActive(currentShop) ? 'Active' : 'Closed'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => { const newLang = lang === 'sw' ? 'en' : 'sw'; setLang(newLang); localStorage.setItem('app_lang', newLang); }} style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
              {lang === 'sw' ? '🇬🇧 EN' : '🇹🇿 SW'}
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {currentShop?.shop_name ? currentShop.shop_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px' }}>
            <h2 style={{ color: '#1e293b' }}>{lang === 'sw' ? 'Takwimu za Dashibodi' : 'Dashboard Stats'}</h2>
            <p style={{ color: '#64748b' }}>Mfumo uko tayari!</p>
          </div>
        )}
        {activePage === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} />}
        {activePage === 'settings' && <Settings lang={lang} supabase={supabase} currentShop={currentShop} />}
      </div>

      {/* =================== ADD SHOP MODAL =================== */}
      {showAddShopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700' }}>➕ {lang === 'sw' ? 'Ongeza Duka/Tawi Jipya' : 'Add New Shop/Branch'}</h2>
            <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder={lang === 'sw' ? 'Jina la Duka' : 'Shop Name'} required value={newShopForm.shop_name} onChange={(e) => setNewShopForm({...newShopForm, shop_name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', boxSizing: 'border-box' }} />
              <select value={newShopForm.shop_type} onChange={(e) => setNewShopForm({...newShopForm, shop_type: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', boxSizing: 'border-box' }}>
                <option value="duka">🛒 Duka (Retail Shop)</option>
                <option value="microfinance">💰 Microfinance</option>
                <option value="restaurant">🍽️ Restaurant/Hotel</option>
              </select>
              <input type="text" placeholder={lang === 'sw' ? 'Mkoa (Mfano: Dar es Salaam)' : 'Region (e.g. Dar es Salaam)'} value={newShopForm.region} onChange={(e) => setNewShopForm({...newShopForm, region: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddShopModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>💾 {lang === 'sw' ? 'Hifadhi Duka' : 'Save Shop'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== HELP MODAL =================== */}
      {showHelpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>❓ {lang === 'sw' ? 'Msaada na Miongozo' : 'Help & Guide'}</h2>
              <button onClick={() => setShowHelpModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '12px', borderLeft: '4px solid #0284c7' }}>
                <h4 style={{ margin: '0 0 8px', color: '#0c4a6e' }}>{lang === 'sw' ? 'Jinsi ya Kuanza' : 'Getting Started'}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>{lang === 'sw' ? '1. Nenda Mipangilio > Bidhaa na uongeze bidhaa zako.\n2. Nenda Mauzo (POS) kuanza kuuza.\n3. Ongeza wateja wako kwenye Wateja.' : '1. Go to Settings > Products and add your items.\n2. Go to Sales (POS) to start selling.\n3. Add your customers in the Customers tab.'}</p>
              </div>
              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', borderLeft: '4px solid #16a34a' }}>
                <h4 style={{ margin: '0 0 8px', color: '#14532d' }}>{lang === 'sw' ? 'Mawasiliano' : 'Contact Support'}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>📧 support@kasitrade.co.tz<br/>📞 +255 123 456 789</p>
              </div>
              <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '12px', borderLeft: '4px solid #9333ea' }}>
                <h4 style={{ margin: '0 0 8px', color: '#581c87' }}>{lang === 'sw' ? 'Toleo la Mfumo' : 'System Version'}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#7e22ce' }}>KasiTRADE POS v1.0.0 (Enterprise)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatBubble { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;