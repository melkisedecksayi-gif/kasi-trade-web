import React, { useState } from 'react';
import CI from './ColoredIcons';

const Login = ({ supabase, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');

  const toggleLang = () => {
    const newLang = lang === 'sw' ? 'en' : 'sw';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError(lang === 'sw' ? 'Tafadhali thibitisha email yako kwanza.' : 'Please confirm your email first.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError(lang === 'sw' ? 'Email au nenosiri si sahihi.' : 'Invalid email or password.');
        } else if (error.message.includes('Too many requests')) {
          setError(lang === 'sw' ? 'Umejaribu mara nyingi sana. Subiri.' : 'Too many attempts. Please wait.');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(lang === 'sw' ? 'Umeingia kwa mafanikio!' : 'Logged in successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
          else window.location.reload();
        }, 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', top: '-200px', right: '-200px', animation: 'pulse 8s infinite' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', bottom: '-150px', left: '-150px', animation: 'pulse 10s infinite 2s' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 12s infinite 4s' }} />

      <div style={{
        width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1
      }}>
        {/* Language Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button onClick={toggleLang} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
            padding: '8px 14px', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: '600',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ fontWeight: '800', fontSize: '13px', letterSpacing: '0.5px', opacity: 0.9 }}>
              {lang === 'sw' ? 'SW' : 'EN'}
            </span>
            <span>{lang === 'sw' ? 'Kiswahili' : 'English'}</span>
          </button>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(24px)', borderRadius: '24px',
          padding: '40px', border: '1px solid rgba(148,163,184,0.12)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
        }}>
          {/* Logo & Brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img
              src="/Logo.png"
              alt="KasiTRADE"
              style={{ width: '180px', height: 'auto', margin: '0 auto 16px', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px' }}>
              KasiTRADE
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
              {lang === 'sw' ? 'Mfumo wa POS wa Kisasa' : 'Modern POS System'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
              fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CI.Warning size={16} /> {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#6ee7b7', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
              fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CI.Shield size={16} /> {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                {lang === 'sw' ? 'Barua Pepe' : 'Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <CI.Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px',
                    background: 'rgba(15,23,42,0.6)', border: '2px solid rgba(148,163,184,0.15)',
                    borderRadius: '12px', fontSize: '15px', color: '#f1f5f9', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                {lang === 'sw' ? 'Nenosiri' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <CI.Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 50px 14px 44px',
                    background: 'rgba(15,23,42,0.6)', border: '2px solid rgba(148,163,184,0.15)',
                    borderRadius: '12px', fontSize: '15px', color: '#f1f5f9', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
                    color: '#64748b', padding: '4px 8px', display: 'flex'
                  }}
                >
                  {showPassword ? <CI.EyeOff size={18} /> : <CI.Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px', marginTop: '8px',
                background: loading ? '#475569' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', border: 'none', borderRadius: '14px',
                fontWeight: '700', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', letterSpacing: '0.3px'
              }}
            >
              {loading ? (lang === 'sw' ? 'Inaingia...' : 'Signing in...') : (lang === 'sw' ? 'Ingia' : 'Sign In')}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
            {lang === 'sw' ? 'Huna akaunti?' : "Don't have an account?"}{' '}
            <span style={{ color: '#818cf8', fontWeight: '600', cursor: 'pointer' }}>
              {lang === 'sw' ? 'Jisajili Hapa' : 'Sign Up'}
            </span>
          </p>
        </div>

        {/* Copyright */}
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#475569' }}>
          © {new Date().getFullYear()} KasiTRADE
        </p>
      </div>
    </div>
  );
};

export default Login;
