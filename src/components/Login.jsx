import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const Login = ({ supabase, onLoginSuccess }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'sw');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const t = translations[lang] || translations.sw;
  const colors = getThemeColors(theme === 'dark');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast(t.login.success, 'success');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { role: 'cashier' } // Default role for new signups
          }
        });
        if (error) throw error;
        showToast(t.register.success, 'success');
        // Optionally switch to login view or show confirmation
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bg,
      padding: '20px',
      position: 'relative'
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ✅ LANGUAGE TOGGLE BUTTON (Top Right) */}
      <button 
        onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px', 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: '50%', 
          cursor: 'pointer', 
          fontSize: '28px', 
          padding: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: THEME.shadow.sm,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={lang === 'sw' ? 'Switch to English' : 'Badilisha kuwa Kiswahili'}
      >
        {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
      </button>

      {/* THEME TOGGLE (Optional, top left) */}
      <button 
        onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: '50%', 
          cursor: 'pointer', 
          fontSize: '20px', 
          padding: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: THEME.shadow.sm
        }}
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{ 
        background: colors.surface, 
        padding: '40px', 
        borderRadius: THEME.radius.lg, 
        boxShadow: THEME.shadow.lg, 
        width: '100%', 
        maxWidth: '400px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', color: colors.text, fontSize: '28px', fontWeight: '700' }}>{t.appName}</h1>
          <p style={{ margin: 0, color: colors.textSec, fontSize: '14px' }}>
            {isLogin ? t.login.subtitle : t.register.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
              {isLogin ? t.login.email : t.register.email}
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: colors.bg, 
                color: colors.text, 
                border: `1px solid ${colors.border}`, 
                borderRadius: THEME.radius.md, 
                fontSize: '15px',
                boxSizing: 'border-box'
              }} 
              placeholder="user@duka.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
              {isLogin ? t.login.password : t.register.password}
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: colors.bg, 
                color: colors.text, 
                border: `1px solid ${colors.border}`, 
                borderRadius: THEME.radius.md, 
                fontSize: '15px',
                boxSizing: 'border-box'
              }} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: loading ? '#64748b' : THEME.colors.primary, 
              color: '#fff', 
              border: 'none', 
              borderRadius: THEME.radius.md, 
              fontSize: '16px', 
              fontWeight: '700', 
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? (isLogin ? t.login.loading : t.register.loading) : (isLogin ? t.login.submit : t.register.submit)}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: colors.textSec }}>
          {isLogin ? t.login.noAccount : t.register.hasAccount}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: THEME.colors.primary, 
              fontWeight: '600', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLogin ? t.login.registerLink : t.register.loginLink}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;