import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import Toast from './Toast';

const Auth = ({ supabase, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [showVerificationMsg, setShowVerificationMsg] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const t = translations[lang] || translations.sw;

  const showToast = (message, type = 'info') => setToast({ message, type, id: Date.now() });

  // Password strength checker
  useEffect(() => {
    const strength = () => {
      let score = 0;
      if (password.length > 6) score++;
      if (password.length > 10) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      setPasswordStrength(score);
    };
    strength();
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        if (!phone || !region || !district || !businessType || !gender) {
          throw new Error(lang === 'sw' ? 'Tafadhali jaza taarifa zote.' : 'Please fill all fields.');
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { phone, region, district, business_type: businessType, gender } }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').update({ phone, region, district, business_type: businessType, gender }).eq('id', data.user.id);
          setShowVerificationMsg(true);
          showToast(lang === 'sw' ? '✅ Usajili umefanikiwa! Angalia email yako.' : '✅ Signed up! Check your email.', 'success');
        }
      }
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>📧</div>
          <h2 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '26px', fontWeight: '700' }}>{lang === 'sw' ? 'Thibitisha Email Yako' : 'Confirm Your Email'}</h2>
          <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: '1.6', fontSize: '15px' }}>
            {lang === 'sw' ? `Tumetuma link ya kuthibitisha kwenye ${email}. Tafadhali fungua email yako na ubofye link hiyo.` : `We sent a confirmation link to ${email}. Please open your email and click the link.`}
          </p>
          <button onClick={() => { setShowVerificationMsg(false); setIsLogin(true); }} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            {lang === 'sw' ? 'Rudi kwenye Login' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength <= 3) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return lang === 'sw' ? 'Dhaifu' : 'Weak';
    if (passwordStrength <= 3) return lang === 'sw' ? 'Kati' : 'Medium';
    return lang === 'sw' ? 'Imara' : 'Strong';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background circles */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', top: '-200px', right: '-200px', animation: 'float 20s infinite' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', bottom: '-100px', left: '-100px', animation: 'float 15s infinite reverse' }} />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '24px', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '450px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        animation: 'slideUp 0.5s ease'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏪</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: '#1e293b', fontWeight: '700' }}>{t.appName}</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>{isLogin ? (lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in to your account') : (lang === 'sw' ? 'Fungua akaunti mpya' : 'Create new account')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="email" 
              id="email"
              placeholder=" "
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading} 
              style={{ 
                padding: '16px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '12px', 
                fontSize: '15px',
                width: '100%',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <label 
              htmlFor="email"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                padding: '0 4px',
                color: '#64748b',
                fontSize: '15px',
                transition: 'all 0.3s',
                pointerEvents: 'none'
              }}
            >
              {lang === 'sw' ? 'Barua pepe' : 'Email'}
            </label>
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              id="password"
              placeholder=" "
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              disabled={loading} 
              style={{ 
                padding: '16px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '12px', 
                fontSize: '15px',
                width: '100%',
                transition: 'all 0.3s',
                outline: 'none',
                paddingRight: '50px'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#667eea'; if (!isLogin) e.target.nextSibling.nextSibling.style.display = 'block'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; if (!isLogin) e.target.nextSibling.nextSibling.style.display = 'none'; }}
            />
            <label 
              htmlFor="password"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                padding: '0 4px',
                color: '#64748b',
                fontSize: '15px',
                transition: 'all 0.3s',
                pointerEvents: 'none'
              }}
            >
              {lang === 'sw' ? 'Nenosiri' : 'Password'}
            </label>
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#64748b'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            
            {!isLogin && password.length > 0 && (
              <div style={{ marginTop: '8px', display: 'none' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level}
                      style={{
                        flex: 1,
                        height: '4px',
                        background: level <= passwordStrength ? getPasswordStrengthColor() : '#e2e8f0',
                        borderRadius: '2px',
                        transition: 'background 0.3s'
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: getPasswordStrengthColor(), fontWeight: '600' }}>
                  {getPasswordStrengthText()}
                </p>
              </div>
            )}
          </div>
          
          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" 
                  id="phone"
                  placeholder=" "
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  disabled={loading} 
                  style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%' }}
                />
                <label htmlFor="phone" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                  {t.settings?.phone || 'Phone'}
                </label>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    id="region"
                    placeholder=" "
                    value={region} 
                    onChange={e => setRegion(e.target.value)} 
                    required 
                    disabled={loading} 
                    style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%' }}
                  />
                  <label htmlFor="region" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                    {t.settings?.region || 'Mkoa'}
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    id="district"
                    placeholder=" "
                    value={district} 
                    onChange={e => setDistrict(e.target.value)} 
                    required 
                    disabled={loading} 
                    style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%' }}
                  />
                  <label htmlFor="district" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                    {lang === 'sw' ? 'Wilaya' : 'District'}
                  </label>
                </div>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  id="businessType"
                  placeholder=" "
                  value={businessType} 
                  onChange={e => setBusinessType(e.target.value)} 
                  required 
                  disabled={loading} 
                  style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%' }}
                />
                <label htmlFor="businessType" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Aina ya Biashara' : 'Business Type'}
                </label>
              </div>
              
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value)} 
                required 
                disabled={loading} 
                style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', background: '#fff', cursor: 'pointer' }}
              >
                <option value="">{lang === 'sw' ? 'Jinsia' : 'Gender'}</option>
                <option value="male">{lang === 'sw' ? 'Mwanaume' : 'Male'}</option>
                <option value="female">{lang === 'sw' ? 'Mwanamke' : 'Female'}</option>
                <option value="other">{lang === 'sw' ? 'Nyingine' : 'Other'}</option>
              </select>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '18px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'; } }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'; }}
          >
            {loading ? (lang === 'sw' ? '⏳ Inasubiri...' : '⏳ Loading...') : (isLogin ? (lang === 'sw' ? '🔓 Ingia' : '🔓 Sign In') : (lang === 'sw' ? '✨ Jisajili' : '✨ Sign Up'))}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          {isLogin ? (lang === 'sw' ? 'Huna akaunti? ' : "Don't have an account? ") : (lang === 'sw' ? 'Tayari una akaunti? ' : 'Already have an account? ')}
          <button 
            onClick={() => { setIsLogin(!isLogin); setPassword(''); }} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              fontWeight: '700', 
              cursor: 'pointer', 
              padding: 0,
              textDecoration: 'underline'
            }}
          >
            {isLogin ? (lang === 'sw' ? 'Jisajili Sasa' : 'Sign Up') : (lang === 'sw' ? 'Ingia' : 'Sign In')}
          </button>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button 
            onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} 
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.target.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.target.style.background = '#f1f5f9'; }}
          >
            {lang === 'sw' ? '🇬🇧 English' : '🇹 Kiswahili'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Auth;