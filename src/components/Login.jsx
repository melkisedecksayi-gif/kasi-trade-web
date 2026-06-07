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

  // Safe fallback kama key haipo
  const currentText = isLogin ? (t.login || {}) : (t.register || {});

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
        showToast(currentText.success || 'Success', 'success');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { role: 'cashier' } }
        });
        if (error) throw error;
        showToast(currentText.success || 'Success', 'success');
        setIsLogin(true);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100dvh', /* ✅ Salama kwa mobile browsers */
      minWidth: '100vw',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bg,
      padding: '20px',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'auto' /* ✅ Inaruhusu scroll kama screen ni ndogo */
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ✅ LANGUAGE TOGGLE */}
      <button 
        onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} 
        style={{ 
          position: 'absolute', top: '20px', right: '20px', 
          background: colors.surface, border: `1px solid ${colors.border}`, 
          borderRadius: '50%', cursor: 'pointer', fontSize: '24px', 
          width: '48px', height: '48px', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          boxShadow: THEME.shadow.sm, zIndex: 10
        }}
      >
        {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
      </button>

      {/* ✅ THEME TOGGLE */}
      <button 
        onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
        style={{ 
          position: 'absolute', top: '20px', left: '20px', 
          background: colors.surface, border: `1px solid ${colors.border}`, 
          borderRadius: '50%', cursor: 'pointer', fontSize: '20px', 
          width: '48px', height: '48px', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          boxShadow: THEME.shadow.sm, zIndex: 10
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{ 
        background: colors.surface, 
        padding: '32px 24px', 
        borderRadius: THEME.radius.lg, 
        boxShadow: THEME.shadow.lg, 
        width: '100%', 
        maxWidth: '400px',
        border: `1px solid ${colors.border}`,
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', color: colors.text, fontSize: '26px', fontWeight: '700' }}>{t.appName}</h1>
          <p style={{ margin: 0, color: colors.textSec, fontSize: '14px' }}>
            {currentText.subtitle || 'Welcome'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
              {currentText.email || 'Email'}
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ 
                width: '100%', padding: '14px', background: colors.bg, 
                color: colors.text, border: `1px solid ${colors.border}`, 
                borderRadius: THEME.radius.md, fontSize: '15px', boxSizing: 'border-box'
              }} 
              placeholder="user@duka.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
              {currentText.password || 'Password'}
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              minLength={6}
              style={{ 
                width: '100%', padding: '14px', background: colors.bg, 
                color: colors.text, border: `1px solid ${colors.border}`, 
                borderRadius: THEME.radius.md, fontSize: '15px', boxSizing: 'border-box'
              }} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', 
              background: loading ? '#64748b' : THEME.colors.primary, 
              color: '#fff', border: 'none', borderRadius: THEME.radius.md, 
              fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {loading ? (currentText.loading || 'Loading...') : (currentText.submit || 'Submit')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: colors.textSec }}>
          {isLogin ? (currentText.noAccount || 'No account?') : (currentText.hasAccount || 'Have account?')}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: THEME.colors.primary, fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
          >
            {isLogin ? (currentText.registerLink || 'Register') : (currentText.loginLink || 'Login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;