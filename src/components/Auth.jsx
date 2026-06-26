import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import Toast from './Toast';

const Auth = ({ supabase, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  
  // Business Info
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Tanzania');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  
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
    let score = 0;
    if (password.length > 6) score++;
    if (password.length > 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  }, [password]);

  const handleNextStep = () => {
    console.log('Current state:', { businessType, businessName, region, district, ward });
    
    if (!businessType) {
      showToast(lang === 'sw' ? 'Tafadhali chagua aina ya biashara' : 'Please select business type', 'error');
      return;
    }
    if (!businessName.trim()) {
      showToast(lang === 'sw' ? 'Tafadhali ingiza jina la duka' : 'Please enter business name', 'error');
      return;
    }
    if (!region) {
      showToast(lang === 'sw' ? 'Tafadhali chagua mkoa' : 'Please select region', 'error');
      return;
    }
    if (!district) {
      showToast(lang === 'sw' ? 'Tafadhali chagua wilaya' : 'Please select district', 'error');
      return;
    }
    if (!ward) {
      showToast(lang === 'sw' ? 'Tafadhali chagua kata' : 'Please select ward', 'error');
      return;
    }
    
    console.log('Moving to step 2');
    setRegistrationStep(2);
  };

  const handlePrevStep = () => {
    console.log('Going back to step 1');
    setRegistrationStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onAuthSuccess) onAuthSuccess();
      } else {
        if (!phone || !gender || !password || password.length < 6) {
          throw new Error(lang === 'sw' ? 'Tafadhali jaza taarifa zote na password iwe na herufi 6+.' : 'Please fill all fields and password must be 6+ chars.');
        }
        
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { 
              phone, 
              gender,
              business_type: businessType,
              business_name: businessName,
              country,
              region,
              district,
              ward
            } 
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data?.user) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                phone,
                gender,
                business_type: businessType,
                business_name: businessName,
                country,
                region,
                district,
                ward,
                registration_step: 2
              })
              .eq('id', data.user.id);
              
            if (updateError) {
              console.warn('Profile update warning:', updateError.message);
            }
          } catch (dbErr) {
            console.warn('Profile DB error (non-fatal):', dbErr);
          }

          setShowVerificationMsg(true);
          showToast(lang === 'sw' ? '✅ Usajili umekamilika! Angalia email yako.' : '✅ Registration complete! Check your email.', 'success');
        }
      }
    } catch (err) {
      console.error('Auth Error:', err);
      showToast(`❌ ${err.message || 'Hitilafu ya database'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tanzania locations data
  const regions = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kilimanjaro'];
  const districts = {
    'Dar es Salaam': ['Kinondoni', 'Ilala', 'Temeke', 'Kigamboni', 'Ubungo'],
    'Arusha': ['Arusha City', 'Arusha Rural', 'Meru', 'Monduli'],
    'Mwanza': ['Ilemela', 'Nyamagana'],
    'Dodoma': ['Dodoma Urban', 'Dodoma Rural', 'Chamwino'],
  };
  const wards = {
    'Kinondoni': ['Sinza', 'Kawe', 'Mikocheni', 'Masaki', 'Mwananyamala'],
    'Ilala': ['Kariakoo', 'Ilala', 'Buguruni', 'Gerezani'],
    'Temeke': ['Temeke', 'Runguta', 'Chamwino', 'Mbagala'],
  };

  const currentDistricts = districts[region] || [];
  const currentWards = district ? (wards[district] || []) : [];

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

  if (showVerificationMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📧</div>
          <h2 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '26px', fontWeight: '700' }}>{lang === 'sw' ? 'Thibitisha Email Yako' : 'Confirm Your Email'}</h2>
          <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: '1.6', fontSize: '15px' }}>
            {lang === 'sw' ? `Tumetuma link ya kuthibitisha kwenye ${email}. Tafadhali fungua email yako na ubofye link hiyo.` : `We sent a confirmation link to ${email}. Please open your email and click the link.`}
          </p>
          <button onClick={() => { setShowVerificationMsg(false); setIsLogin(true); setRegistrationStep(1); }} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            {lang === 'sw' ? 'Rudi kwenye Login' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', top: '-200px', right: '-200px', animation: 'float 20s infinite' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', bottom: '-100px', left: '-100px', animation: 'float 15s infinite reverse' }} />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', 
        padding: '40px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 1, animation: 'slideUp 0.5s ease'
      }}>
        {!isLogin && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: registrationStep === 1 ? '#fff' : 'transparent', color: registrationStep === 1 ? '#667eea' : '#64748b', fontWeight: '600', fontSize: '13px', transition: 'all 0.3s' }}>
                {lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: registrationStep === 2 ? '#fff' : 'transparent', color: registrationStep === 2 ? '#667eea' : '#64748b', fontWeight: '600', fontSize: '13px', transition: 'all 0.3s' }}>
                {lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏪</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: '#1e293b', fontWeight: '700' }}>{t.appName}</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            {isLogin 
              ? (lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in to your account') 
              : registrationStep === 1 
                ? (lang === 'sw' ? 'Taarifa za Biashara' : 'Business Information')
                : (lang === 'sw' ? 'Taarifa za Mtu' : 'Personal Information')
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* LOGIN FORM */}
          {isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <input type="email" id="email" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', outline: 'none' }} />
                <label htmlFor="email" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Barua pepe' : 'Email'}
                </label>
              </div>

              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} id="loginPassword" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', outline: 'none', paddingRight: '50px' }} />
                <label htmlFor="loginPassword" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Nenosiri' : 'Password'}
                </label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ padding: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
                {loading ? (lang === 'sw' ? '⏳ Inasubiri...' : '⏳ Loading...') : (lang === 'sw' ? '🔓 Ingia' : '🔓 Sign In')}
              </button>
            </>
          )}

          {/* REGISTRATION STEP 1: Business Info */}
          {!isLogin && registrationStep === 1 && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', color: '#1e293b', fontWeight: '600', fontSize: '15px' }}>
                  {lang === 'sw' ? 'Aina ya Biashara' : 'Business Type'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button type="button" onClick={() => setBusinessType('duka')} style={{ padding: '16px', border: `2px solid ${businessType === 'duka' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'duka' ? '#f0f7ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', color: businessType === 'duka' ? '#0047AB' : '#64748b', transition: 'all 0.3s' }}>
                    <span style={{ fontSize: '20px' }}>🛒</span> {lang === 'sw' ? 'Duka' : 'Shop'}
                  </button>
                  <button type="button" onClick={() => setBusinessType('microfinance')} style={{ padding: '16px', border: `2px solid ${businessType === 'microfinance' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'microfinance' ? '#f0f7ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', color: businessType === 'microfinance' ? '#0047AB' : '#64748b', transition: 'all 0.3s' }}>
                    <span style={{ fontSize: '20px' }}>💰</span> Microfinance
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <input type="text" id="businessName" placeholder=" " value={businessName} onChange={e => setBusinessName(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                <label htmlFor="businessName" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Jina la duka' : 'Business Name'}
                </label>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>{lang === 'sw' ? 'Mahali Linapatikana' : 'Location'}</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Nchi' : 'Country'}</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', background: '#fff', outline: 'none' }}>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Mkoa' : 'Region'}</label>
                    <select value={region} onChange={(e) => { setRegion(e.target.value); setDistrict(''); setWard(''); }} required style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', background: '#fff', outline: 'none' }}>
                      <option value="">Select...</option>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Wilaya' : 'District'}</label>
                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setWard(''); }} required disabled={!region} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', background: '#fff', outline: 'none', opacity: !region ? 0.5 : 1 }}>
                      <option value="">Select...</option>
                      {currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>{lang === 'sw' ? 'Kata' : 'Ward'}</label>
                  <select value={ward} onChange={(e) => setWard(e.target.value)} required disabled={!district} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', background: '#fff', outline: 'none', opacity: !district ? 0.5 : 1 }}>
                    <option value="">Select...</option>
                    {currentWards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: '#f0f7ff', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #0047AB' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  {lang === 'sw' ? 'Unamiliki duka zaidi ya moja?. Utaweza kutengeneza maduka mengine baada ya kujisajili.' : 'Own multiple shops? You can add more shops after registration.'}
                </p>
              </div>

              <button type="button" onClick={handleNextStep} style={{ padding: '18px', background: 'linear-gradient(135deg, #0047AB 0%, #002F87 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 71, 171, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {lang === 'sw' ? 'Endelea' : 'Continue'} <span>→</span>
              </button>
            </>
          )}

          {/* REGISTRATION STEP 2: Personal Info */}
          {!isLogin && registrationStep === 2 && (
            <>
              <div style={{ position: 'relative' }}>
                <input type="tel" id="phone" placeholder=" " value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', outline: 'none' }} />
                <label htmlFor="phone" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                </label>
              </div>

              <select value={gender} onChange={e => setGender(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', background: '#fff', cursor: 'pointer' }}>
                <option value="">{lang === 'sw' ? 'Jinsia' : 'Gender'}</option>
                <option value="male">{lang === 'sw' ? 'Mwanaume' : 'Male'}</option>
                <option value="female">{lang === 'sw' ? 'Mwanamke' : 'Female'}</option>
                <option value="other">{lang === 'sw' ? 'Nyingine' : 'Other'}</option>
              </select>

              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} id="password" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', width: '100%', outline: 'none', paddingRight: '50px' }} />
                <label htmlFor="password" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', padding: '0 4px', color: '#64748b', fontSize: '15px', pointerEvents: 'none' }}>
                  {lang === 'sw' ? 'Nenosiri' : 'Password'}
                </label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {password.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} style={{ flex: 1, height: '4px', background: level <= passwordStrength ? getPasswordStrengthColor() : '#e2e8f0', borderRadius: '2px', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: getPasswordStrengthColor(), fontWeight: '600' }}>{getPasswordStrengthText()}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={handlePrevStep} style={{ flex: 1, padding: '18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                  {lang === 'sw' ? '← Rudi' : '← Back'}
                </button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
                  {loading ? (lang === 'sw' ? '⏳ Inasubiri...' : '⏳ Loading...') : (lang === 'sw' ? '✨ Kamilisha' : '✨ Complete')}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Switch between Login and Register */}
        {isLogin && (
          <>
            <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
              {lang === 'sw' ? 'Huna akaunti? ' : "Don't have an account? "}
              <button onClick={() => { setIsLogin(false); setPassword(''); setRegistrationStep(1); }} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                {lang === 'sw' ? 'Jisajili Sasa' : 'Sign Up'}
              </button>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} style={{ background: '#f1f5f9', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {lang === 'sw' ? '🇬🇧 English' : '🇹🇿 Kiswahili'}
              </button>
            </div>
          </>
        )}

        {!isLogin && registrationStep === 1 && (
          <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
            {lang === 'sw' ? 'Tayari una akaunti? ' : 'Already have an account? '}
            <button onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              {lang === 'sw' ? 'Ingia' : 'Sign In'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Auth;