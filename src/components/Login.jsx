import React, { useState, useEffect } from 'react';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

const Login = ({ supabase, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [lang, setLang] = useState('sw');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Translations
  const t = {
    sw: {
      title: '🔐 Ingia Kwenye Mfumo',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Thibitisha Password',
      login: 'Ingia',
      register: 'Jisajili',
      forgot: 'Sahau Password?',
      noAccount: 'Huna akaunti?',
      hasAccount: 'Tayari una akaunti?',
      signingIn: 'Inaingia...',
      signingUp: 'Inasajili...',
      success: '✅ Umesajiliwa! Sasa ingia.',
    },
    en: {
      title: '🔐 Login to System',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      login: 'Login',
      register: 'Register',
      forgot: 'Forgot Password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signingIn: 'Signing in...',
      signingUp: 'Signing up...',
      success: '✅ Registration successful! Now login.',
    }
  };

  const currentT = t[lang];

  // ✅ AUTO-DETECT: Kama user alibonyeza link ya email, fungua reset page
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setView('reset');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLoginSuccess?.();
    } catch (err) {
      setError('❌ ' + (err.message || 'Imeshindwa kuingia. Angalia email/password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(lang === 'sw' ? '❌ Password hazilingani.' : '❌ Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'sw' ? '❌ Password iwe na angalau herufi 6.' : '❌ Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage(currentT.success);
      setView('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('❌ ' + (err.message || 'Imeshindwa kusajili.'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ ROUTING: Onyesha view sahihi
  if (view === 'forgot') {
    return <ForgotPassword supabase={supabase} onBackToLogin={() => setView('login')} />;
  }
  if (view === 'reset') {
    return <ResetPassword supabase={supabase} onLogin={() => setView('login')} />;
  }

  // ✅ LOGIN FORM
  if (view === 'login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#0f172a' }}>{currentT.title}</h2>
            <button
              onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')}
              style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              {lang === 'sw' ? '🇹 SW' : '🇸 EN'}
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder={currentT.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={currentT.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', paddingRight: '45px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '5px' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'background 0.2s' }}
            >
              {loading ? currentT.signingIn : currentT.login}
            </button>
          </form>

          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginTop: '10px', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>{error}</p>}
          {message && <p style={{ color: '#16a34a', textAlign: 'center', marginTop: '10px', fontSize: '14px', background: '#f0fdf4', padding: '10px', borderRadius: '6px' }}>{message}</p>}

          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            <button
              onClick={() => setView('forgot')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px' }}
            >
              {currentT.forgot}
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
            {currentT.noAccount}{' '}
            <button
              onClick={() => { setView('register'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
            >
              {currentT.register}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ✅ REGISTER FORM
  if (view === 'register') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#0f172a' }}>{currentT.register}</h2>
            <button
              onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')}
              style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              {lang === 'sw' ? '🇹 SW' : '🇸 EN'}
            </button>
          </div>

          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder={currentT.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={currentT.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '12px', paddingRight: '45px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '5px' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={currentT.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '12px', paddingRight: '45px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '5px' }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#94a3b8' : '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'background 0.2s' }}
            >
              {loading ? currentT.signingUp : currentT.register}
            </button>
          </form>

          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginTop: '10px', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>{error}</p>}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
            {currentT.hasAccount}{' '}
            <button
              onClick={() => { setView('login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
            >
              {currentT.login}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;