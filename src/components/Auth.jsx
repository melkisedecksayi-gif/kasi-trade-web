import React, { useState } from 'react';
import { translations } from '../translations';
import Toast from './Toast';

const Auth = ({ supabase, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');

  const t = translations[lang] || translations.sw;
  const showToast = (msg, type) => setToast({ message: msg, type, id: Date.now() });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuthSuccess();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showToast('✅ Usajili umekamilika! Angalia email yako.', 'success');
      setTimeout(() => setIsLogin(true), 2000);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px'}}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{background: 'white', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>🏪</div>
          <h2 style={{margin: '0 0 8px', fontSize: '28px', color: '#1e293b'}}>{t.appName}</h2>
          <p style={{margin: 0, color: '#64748b'}}>{isLogin ? (lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in') : (lang === 'sw' ? 'Fungua akaunti mpya' : 'Sign up')}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <input type="email" placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px'}} />
          <input type="password" placeholder={lang === 'sw' ? 'Nenosiri' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px'}} />
          
          <button type="submit" disabled={loading} style={{padding: '18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>
            {loading ? '⏳ Inasubiri...' : (isLogin ? '🔓 Ingia' : '✨ Jisajili')}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '24px'}}>
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{background: 'none', border: 'none', color: '#667eea', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontSize: '16px'}}>
            {isLogin ? (lang === 'sw' ? 'Huna akaunti? Jisajili Sasa' : "Don't have account? Sign Up") : (lang === 'sw' ? 'Tayari una akaunti? Ingia' : 'Already have account? Sign In')}
          </button>
          
          <div style={{marginTop: '15px'}}>
            <button type="button" onClick={() => { const newLang = lang === 'sw' ? 'en' : 'sw'; setLang(newLang); localStorage.setItem('app_lang', newLang); }} style={{background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
              {lang === 'sw' ? '🇬🇧 English' : '🇹🇿 Kiswahili'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;