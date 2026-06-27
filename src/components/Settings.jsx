import React, { useState } from 'react';
import { Icons } from './Icons';

const Settings = ({ lang, setLang, supabase, currentShop, shops, setShops, isDarkMode, setIsDarkMode }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopForm, setNewShopForm] = useState({ shop_name: '', shop_type: 'duka', region: '' });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    triggerToast(newLang === 'sw' ? 'Lugha imebadilishwa' : 'Language changed');
  };

  const handleDarkModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('dark_mode', newMode.toString());
    triggerToast(newMode ? (lang === 'sw' ? 'Dark mode imewashwa' : 'Dark mode enabled') : (lang === 'sw' ? 'Dark mode imezimwa' : 'Dark mode disabled'));
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.shop_name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('shops').insert([{ user_id: user.id, ...newShopForm }]).select().single();
    if (data && !error) {
      setShops([...shops, data]);
      setShowAddShopModal(false);
      setNewShopForm({ shop_name: '', shop_type: 'duka', region: '' });
      triggerToast(lang === 'sw' ? 'Duka jipya limeongezwa!' : 'New shop added!');
    } else {
      triggerToast(lang === 'sw' ? 'Hitilafu: ' + (error?.message || 'Unknown') : 'Error: ' + (error?.message || 'Unknown'));
    }
  };

  const tabs = [
    { id: 'general', label: lang === 'sw' ? 'Jumla' : 'General', icon: Icons.Settings },
    { id: 'hours', label: lang === 'sw' ? 'Masaa' : 'Hours', icon: Icons.Clock },
    { id: 'tax', label: lang === 'sw' ? 'Kodi' : 'Tax', icon: Icons.Cash },
    { id: 'receipt', label: lang === 'sw' ? 'Risiti' : 'Receipt', icon: Icons.Printer },
    { id: 'staff', label: lang === 'sw' ? 'Wafanyakazi' : 'Staff', icon: Icons.Users },
  ];

  const inputStyle = { 
    width: '100%', padding: '12px', 
    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: isDarkMode ? '#334155' : '#fff', color: isDarkMode ? '#f1f5f9' : '#0f172a'
  };

  const cardStyle = { 
    background: isDarkMode ? '#1e293b' : '#fff', padding: '24px', borderRadius: '16px', 
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px'
  };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Settings size={24} /> {lang === 'sw' ? 'Mipangilio ya Mfumo' : 'System Settings'}
        </h2>
        <p style={{ margin: '4px 0 0', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
          {lang === 'sw' ? 'Duka: ' : 'Shop: '}{currentShop?.shop_name}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : (isDarkMode ? '#334155' : '#f1f5f9'),
              color: activeTab === tab.id ? '#fff' : (isDarkMode ? '#cbd5e1' : '#64748b'),
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Globe size={20} /> {lang === 'sw' ? 'Lugha' : 'Language'}
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleLanguageChange('sw')} style={{
                flex: 1, padding: '16px', border: `2px solid ${lang === 'sw' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: '12px',
                background: lang === 'sw' ? '#f0f7ff' : (isDarkMode ? '#334155' : '#fff'), cursor: 'pointer', fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}>🇹🇿 Kiswahili</button>
              <button onClick={() => handleLanguageChange('en')} style={{
                flex: 1, padding: '16px', border: `2px solid ${lang === 'en' ? '#6366f1' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: '12px',
                background: lang === 'en' ? '#f0f7ff' : (isDarkMode ? '#334155' : '#fff'), cursor: 'pointer', fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}>🇬 English</button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isDarkMode ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
                  {lang === 'sw' ? 'Dark Mode' : 'Dark Mode'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  {lang === 'sw' ? 'Badilisha muonekano wa mfumo' : 'Change system appearance'}
                </p>
              </div>
              <button onClick={handleDarkModeToggle} style={{
                width: '56px', height: '28px', borderRadius: '14px', border: 'none',
                background: isDarkMode ? '#6366f1' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
              }}>
                <div style={{
                  position: 'absolute', top: '3px', left: isDarkMode ? '31px' : '3px', width: '22px', height: '22px',
                  borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.ShoppingBag size={20} /> {lang === 'sw' ? 'Maduka Yangu' : 'My Shops'}
              </h3>
              <button onClick={() => setShowAddShopModal(true)} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '10px',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <Icons.Plus size={16} /> {lang === 'sw' ? 'Ongeza Duka' : 'Add Shop'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shops.map(shop => (
                <div key={shop.id} style={{
                  padding: '16px', background: isDarkMode ? '#334155' : '#f8fafc', borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: '15px' }}>{shop.shop_name}</div>
                    <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>{shop.shop_type} • {shop.region || '---'}</div>
                  </div>
                  <div style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: shop.id === currentShop?.id ? '#d1fae5' : (isDarkMode ? '#475569' : '#e2e8f0'),
                    color: shop.id === currentShop?.id ? '#059669' : (isDarkMode ? '#cbd5e1' : '#64748b')
                  }}>
                    {shop.id === currentShop?.id ? (lang === 'sw' ? 'Inatumika' : 'Active') : (lang === 'sw' ? 'Tumia' : 'Switch')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'general' && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⚙️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            {lang === 'sw' ? 'Inaendelea Kujengwa...' : 'Under Construction...'}
          </h3>
        </div>
      )}

      {showAddShopModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>+ {lang === 'sw' ? 'Duka Jipya' : 'New Shop'}</h2>
              <button onClick={() => setShowAddShopModal(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}><Icons.X size={16} /></button>
            </div>
            <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder={lang === 'sw' ? 'Jina la Duka' : 'Shop Name'} required value={newShopForm.shop_name} onChange={(e) => setNewShopForm({...newShopForm, shop_name: e.target.value})} style={inputStyle} />
              <select value={newShopForm.shop_type} onChange={(e) => setNewShopForm({...newShopForm, shop_type: e.target.value})} style={inputStyle}>
                <option value="duka">🛒 {lang === 'sw' ? 'Duka' : 'Retail Shop'}</option>
                <option value="microfinance">💰 Microfinance</option>
                <option value="restaurant">🍽️ {lang === 'sw' ? 'Hotel/Restaurant' : 'Hotel/Restaurant'}</option>
              </select>
              <input type="text" placeholder={lang === 'sw' ? 'Mkoa' : 'Region'} value={newShopForm.region} onChange={(e) => setNewShopForm({...newShopForm, region: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddShopModal(false)} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', color: isDarkMode ? '#f1f5f9' : '#475569' }}>{lang === 'sw' ? 'Ghairi' : 'Cancel'}</button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>{lang === 'sw' ? 'Hifadhi' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', background: '#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 2000, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.CheckCircle size={20} /> {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Settings;