import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const UpdatePassword = ({ supabase, onPasswordUpdated }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'sw');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const t = translations[lang] || translations.sw;
  const colors = getThemeColors(theme === 'dark');
  const updateText = t.updatePassword || {};

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ✅ Check kama user ameingia kupitia reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(lang === 'sw' 
          ? 'Link hii si sahihi au imeisha muda. Tafadhali omba link mpya.'
          : 'This link is invalid or expired. Please request a new one.');
      }
    };
    checkSession();
  }, [supabase, lang]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      showToast(
        lang === 'sw' ? 'Password iwe na angalau herufi 6' : 'Password must be at least 6 characters',
        'warning'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        lang === 'sw' ? 'Passwords hazifanani!' : 'Passwords do not match!',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      showToast(
        lang === 'sw' 
          ? '✅ Password imebadilishwa! Sasa unaweza kuingia.'
          : '✅ Password updated! You can now sign in.',
        'success'
      );
      
      // Subiri kidogo kisha rudi login
      setTimeout(() => {
        if (onPasswordUpdated) onPasswordUpdated();
      }, 2000);
      
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100dvh', 
      minWidth: '100vw',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: colors.bg,
      padding: '20px',
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* LANGUAGE TOGGLE */}
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

      {/* THEME TOGGLE */}
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
          <h2 style={{ margin: '0 0 8px', color: colors.text, fontSize: '22px', fontWeight: '700' }}>
            {updateText.title || (lang === 'sw' ? 'Weka Password Mpya' : 'Set New Password')}
          </h2>
          <p style={{ margin: 0, color: colors.textSec, fontSize: '14px' }}>
            {updateText.description || (lang === 'sw' 
              ? 'Weka password yako mpya hapa chini.'
              : 'Enter your new password below.')}
          </p>
        </div>

        {error ? (
          <div style={{ 
            padding: '16px', 
            background: theme === 'dark' ? '#451a1a' : '#fef2f2', 
            color: THEME.colors.error, 
            borderRadius: THEME.radius.md, 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
                {updateText.newPassword || (lang === 'sw' ? 'Password Mpya' : 'New Password')}
              </label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
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

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
                {updateText.confirmPassword || (lang === 'sw' ? 'Thibitisha Password' : 'Confirm Password')}
              </label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
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
                background: loading ? '#64748b' : THEME.colors.success, 
                color: '#fff', border: 'none', borderRadius: THEME.radius.md, 
                fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {loading 
                ? (lang === 'sw' ? '⏳ Inabadilisha...' : '⏳ Updating...') 
                : (updateText.submit || (lang === 'sw' ? '✅ Badilisha Password' : '✅ Update Password'))}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword;