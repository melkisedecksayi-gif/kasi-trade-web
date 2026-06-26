import React, { useState, useEffect } from 'react';
import { getThemeColors } from '../theme';
import Toast from './Toast';

// ✅ Fallback defaults kama translations hazipo
const defaultSettings = {
  title: 'Mipangilio',
  subtitle: 'Badilisha lugha, muonekano, na vipendeleo vyako',
  language: 'Lugha',
  languageDesc: 'Chagua lugha unayopendelea',
  theme: 'Mandhari',
  themeDesc: 'Badilisha kati ya Light na Dark mode',
  light: '☀️ Light Mode',
  dark: '🌙 Dark Mode',
  notifications: 'Arifa',
  notificationsDesc: 'Pokea arifa za stock ndogo na mauzo',
  currency: 'Sarafu',
  currencyDesc: 'Sarafu inayotumika kwenye risiti',
  reset: 'Weka Upya Mipangilio',
  resetConfirm: 'Je, una uhakika unataka kuweka upya mipangilio yote?',
  saved: '✅ Mipangilio imehifadhiwa!',
};

const Settings = ({ lang, setLang, theme, setTheme, showToast: parentShowToast }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  
  // ✅ Tumia fallback kama translations.settings haipo
  const t = (() => {
    try {
      const { translations } = require('../translations');
      return translations[lang]?.settings || translations.sw?.settings || defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  })();
  
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('TSh');

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (parentShowToast) parentShowToast(message, type);
  };

  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.notifications ?? true);
        setCurrency(parsed.currency ?? 'TSh');
      } catch (e) {
        console.warn('Failed to parse settings', e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify({ notifications, currency }));
    showToast(t.saved, 'success');
  };

  const resetSettings = () => {
    if (window.confirm(t.resetConfirm)) {
      localStorage.removeItem('app_settings');
      localStorage.removeItem('app_lang');
      localStorage.removeItem('theme');
      setLang('sw');
      setTheme('light');
      setNotifications(true);
      setCurrency('TSh');
      showToast('✅ Mipangilio imewekwa upya!', 'success');
    }
  };

  const cardStyle = { background: colors.surface, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '16px' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: colors.text, fontSize: '15px' };
  const descStyle = { margin: '0 0 12px', color: colors.textSec, fontSize: '13px' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <h2 style={{ margin: '0 0 8px', color: colors.text, fontSize: '22px' }}>{t.title}</h2>
      <p style={{ margin: '0 0 24px', color: colors.textSec }}>{t.subtitle}</p>

      <div style={cardStyle}>
        <label style={labelStyle}>{t.language}</label>
        <p style={descStyle}>{t.languageDesc}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['sw', 'en'].map(l => (
            <button key={l} onClick={() => { setLang(l); localStorage.setItem('app_lang', l); }} 
              style={{ flex: 1, padding: '12px', background: lang === l ? '#3b82f6' : colors.surface, color: lang === l ? '#fff' : colors.text, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
              {l === 'sw' ? '🇹🇿 Kiswahili' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>{t.theme}</label>
        <p style={descStyle}>{t.themeDesc}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['light', 'dark'].map(th => (
            <button key={th} onClick={() => { setTheme(th); localStorage.setItem('theme', th); }} 
              style={{ flex: 1, padding: '12px', background: theme === th ? '#3b82f6' : colors.surface, color: theme === th ? '#fff' : colors.text, border: `1px solid ${colors.border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
              {th === 'light' ? t.light : t.dark}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label style={labelStyle}>{t.notifications}</label>
            <p style={descStyle}>{t.notificationsDesc}</p>
          </div>
          <button onClick={() => setNotifications(!notifications)} style={{ width: '50px', height: '28px', background: notifications ? '#3b82f6' : '#cbd5e1', borderRadius: '14px', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: notifications ? '25px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>{t.currency}</label>
        <p style={descStyle}>{t.currencyDesc}</p>
        <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '12px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '10px', fontSize: '15px' }}>
          <option value="TSh">TSh (Tanzanian Shilling)</option>
          <option value="KES">KES (Kenyan Shilling)</option>
          <option value="USD">USD (US Dollar)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button onClick={saveSettings} className="btn-micro gradient-primary shadow-premium" style={{ flex: 1, padding: '14px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px' }}>
          💾 Hifadhi Mipangilio
        </button>
        <button onClick={resetSettings} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
          🔄 {t.reset}
        </button>
      </div>
    </div>
  );
};

export default Settings;