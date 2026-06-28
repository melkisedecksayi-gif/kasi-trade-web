import React, { useState } from 'react';
import { Icons } from './Icons';

const Settings = ({ 
  lang = 'sw', 
  setLang, 
  supabase, 
  currentShop, 
  shops = [], 
  setShops, 
  isDarkMode = false, 
  setIsDarkMode,
  onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const safeShops = Array.isArray(shops) ? shops : [];

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLanguageChange = (newLang) => {
    if (setLang) {
      setLang(newLang);
      localStorage.setItem('app_lang', newLang);
      triggerToast(newLang === 'sw' ? 'Lugha imebadilishwa' : 'Language changed');
    }
  };

  const handleDarkModeToggle = () => {
    if (setIsDarkMode) {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('dark_mode', newMode.toString());
      triggerToast(newMode ? 'Dark mode ON' : 'Dark mode OFF');
    }
  };

  const tabs = [
    { id: 'general', label: lang === 'sw' ? 'Jumla' : 'General', icon: Icons.Settings },
    { id: 'help', label: lang === 'sw' ? 'Msaada' : 'Help', icon: Icons.Help },
  ];

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg = isDarkMode ? '#334155' : '#f8fafc';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ padding: '20px', minHeight: '400px' }}>
      <h2 style={{ color: textColor, marginBottom: '20px', fontSize: '24px', fontWeight: '700' }}>
        {lang === 'sw' ? 'Mipangilio' : 'Settings'}
      </h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#6366f1' : bgColor,
                color: activeTab === tab.id ? '#fff' : textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div style={{ background: bgColor, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          
          <h3 style={{ color: textColor, marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
            🌍 {lang === 'sw' ? 'Lugha' : 'Language'}
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button 
              onClick={() => handleLanguageChange('sw')}
              style={{
                padding: '12px 20px',
                background: lang === 'sw' ? '#6366f1' : bgColor,
                color: lang === 'sw' ? '#fff' : textColor,
                border: `2px solid ${lang === 'sw' ? '#6366f1' : borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🇹🇿 Kiswahili
            </button>
            <button 
              onClick={() => handleLanguageChange('en')}
              style={{
                padding: '12px 20px',
                background: lang === 'en' ? '#6366f1' : bgColor,
                color: lang === 'en' ? '#fff' : textColor,
                border: `2px solid ${lang === 'en' ? '#6366f1' : borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🇬 English
            </button>
          </div>

          <div style={{ paddingTop: '24px', borderTop: `1px solid ${borderColor}`, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: textColor, margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>
                  {isDarkMode ? '🌙' : '☀️'} Dark Mode
                </h4>
                <p style={{ color: subTextColor, margin: 0, fontSize: '14px' }}>
                  {lang === 'sw' ? 'Badilisha muonekano wa mfumo' : 'Change system appearance'}
                </p>
              </div>
              <button 
                onClick={handleDarkModeToggle}
                style={{
                  width: '56px',
                  height: '28px',
                  borderRadius: '14px',
                  background: isDarkMode ? '#6366f1' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: isDarkMode ? '31px' : '3px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          <div style={{ paddingTop: '24px', borderTop: `1px solid ${borderColor}` }}>
            <h4 style={{ color: textColor, margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>
              🏪 {lang === 'sw' ? 'Duka Lako' : 'Your Shop'}
            </h4>
            {currentShop ? (
              <div style={{ 
                padding: '16px', 
                background: cardBg, 
                borderRadius: '8px',
                border: `1px solid ${borderColor}`
              }}>
                <div style={{ fontWeight: '600', color: textColor, fontSize: '15px' }}>
                  {currentShop.shop_name || '---'}
                </div>
                <div style={{ fontSize: '13px', color: subTextColor, marginTop: '4px' }}>
                  {currentShop.shop_type || '---'} • {currentShop.region || '---'}
                </div>
              </div>
            ) : (
              <p style={{ color: subTextColor, fontSize: '14px' }}>
                {lang === 'sw' ? 'Hakuna duka lililochaguliwa' : 'No shop selected'}
              </p>
            )}
          </div>

          {safeShops.length > 1 && (
            <div style={{ paddingTop: '24px', borderTop: `1px solid ${borderColor}`, marginTop: '24px' }}>
              <h4 style={{ color: textColor, margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>
                🏬 {lang === 'sw' ? 'Maduka Yote' : 'All Shops'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {safeShops.map((shop, index) => (
                  <div 
                    key={shop.id || index}
                    style={{ 
                      padding: '12px', 
                      background: cardBg, 
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: textColor, fontSize: '14px' }}>
                        {shop.shop_name || '---'}
                      </div>
                      <div style={{ fontSize: '12px', color: subTextColor, marginTop: '2px' }}>
                        {shop.shop_type || '---'}
                      </div>
                    </div>
                    {currentShop && currentShop.id === shop.id && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#d1fae5',
                        color: '#059669',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {lang === 'sw' ? 'Inatumika' : 'Active'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'help' && (
        <div style={{ background: bgColor, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ color: textColor, marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
            {lang === 'sw' ? 'Msaada' : 'Help'}
          </h3>
          <p style={{ color: subTextColor, lineHeight: '1.6', fontSize: '14px', marginBottom: '16px' }}>
            {lang === 'sw' 
              ? 'Kwa msaada, wasiliana nasi kupitia:'
              : 'For help, contact us via:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ 
              padding: '12px 16px', 
              background: cardBg, 
              borderRadius: '8px',
              color: textColor,
              fontSize: '14px',
              border: `1px solid ${borderColor}`
            }}>
              📧 support@kasitrade.co.tz
            </div>
            <div style={{ 
              padding: '12px 16px', 
              background: cardBg, 
              borderRadius: '8px',
              color: textColor,
              fontSize: '14px',
              border: `1px solid ${borderColor}`
            }}>
              📞 +255 123 456 789
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${borderColor}` }}>
            <h4 style={{ color: textColor, margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>
              ⚡ {lang === 'sw' ? 'Hatua za Haraka' : 'Quick Actions'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <button 
                onClick={() => onNavigate && onNavigate('pos')}
                style={{
                  padding: '16px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                🛒 {lang === 'sw' ? 'Kuuza' : 'Sell'}
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('products')}
                style={{
                  padding: '16px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                 {lang === 'sw' ? 'Bidhaa' : 'Products'}
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('customers')}
                style={{
                  padding: '16px',
                  background: '#ec4899',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                 {lang === 'sw' ? 'Wateja' : 'Customers'}
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('reports')}
                style={{
                  padding: '16px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                📊 {lang === 'sw' ? 'Ripoti' : 'Reports'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: '#10b981',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Settings;