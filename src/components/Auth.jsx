import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import Toast from './Toast';

const Auth = ({ supabase, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register-step-1', 'register-step-2'
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Tanzania');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const t = translations[lang] || translations.sw;
  const showToast = (msg, type) => setToast({ message: msg, type, id: Date.now() });

  const handleLangChange = () => {
    const newLang = lang === 'sw' ? 'en' : 'sw';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

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
    if (!email || !phone || !password || password.length < 6) {
      return showToast(lang === 'sw' ? 'Jaza taarifa zote na password iwe na herufi 6+.' : 'Fill all fields. Password must be 6+ chars.', 'error');
    }
    setMode('register-step-2');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast('Ingiza barua pepe yako', 'error');
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast('✅ Tumepokea ombi lako. Angalia email yako kwa maelekezo.', 'success');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!businessType) return showToast('Chagua aina ya biashara', 'error');
    if (!businessName.trim()) return showToast('Ingiza jina la duka', 'error');
    if (!region) return showToast('Chagua mkoa', 'error');
    if (!district) return showToast('Ingiza au chagua wilaya', 'error');
    if (!ward) return showToast('Ingiza kata', 'error');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, password,
        options: { 
          data: { 
            phone, business_type: businessType, business_name: businessName, 
            country, region, district, ward 
          } 
        }
      });
      
      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('already registered')) {
          msg = '❌ Email hii tayari imeshajisajiliwa. Tumia email nyingine.';
        }
        showToast(msg, 'error');
        setLoading(false);
        return;
      }
      
      if (data?.user) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await supabase.from('profiles').update({
            phone, business_type: businessType, business_name: businessName, 
            country, region, district, ward, registration_step: 2
          }).eq('id', data.user.id);
        } catch (dbErr) { console.warn('Profile update:', dbErr); }

        showToast('✅ Usajili umekamilika! Angalia email yako.', 'success');
        setTimeout(() => {
          setMode('login');
          resetForm();
        }, 3000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast(`❌ ${err.message || 'Hitilafu imetokea'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setPhone('');
    setBusinessType(''); setBusinessName(''); setCountry('Tanzania');
    setRegion(''); setDistrict(''); setWard('');
  };

  const regions = [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 
    'Kilimanjaro', 'Kagera', 'Tabora', 'Rukwa', 'Mtwara', 'Mara', 'Pwani', 'Lindi', 
    'Iringa', 'Kigoma', 'Shinyanga', 'Ruvuma', 'Singida', 'Manyara', 'Geita', 
    'Katavi', 'Simiyu', 'Songwe', 'Njombe', 'Zanzibar'
  ];
  
  const districts = {
    'Dar es Salaam': ['Kinondoni', 'Ilala', 'Temeke', 'Kigamboni', 'Ubungo'],
    'Arusha': ['Arusha City', 'Arusha Rural', 'Meru', 'Monduli', 'Karatu', 'Ngorongoro', 'Longido', 'Simanjiro'],
    'Mwanza': ['Ilemela', 'Nyamagana', 'Kwimba', 'Magu', 'Sengerema', 'Ukerewe', 'Misungwi'],
    'Dodoma': ['Dodoma Urban', 'Dodoma Rural', 'Chamwino', 'Bahi', 'Kondoa', 'Mpwapwa', 'Kongwa', 'Chemba'],
    'Mbeya': ['Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Tukuyu', 'Chunya', 'Mbarali', 'Momba', 'Busokelo'],
    'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga', 'Kilombero', 'Gairo', 'Malinyi'],
    'Tanga': ['Tanga City', 'Muheza', 'Korogwe', 'Pangani', 'Handeni', 'Kilindi', 'Lushoto', 'Mkinga', 'Bumbuli'],
    'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Siha', 'Rombo', 'Mwanga', 'Same'],
    'Kagera': ['Bukoba Urban', 'Bukoba Rural', 'Muleba', 'Biharamulo', 'Ngara', 'Karagwe', 'Missenyi', 'Kyerwa'],
    'Tabora': ['Tabora Urban', 'Tabora Rural', 'Sikonge', 'Urambo', 'Uyui', 'Kaliua', 'Nzega', 'Igunga'],
    'Rukwa': ['Sumbawanga Urban', 'Sumbawanga Rural', 'Nkasi', 'Kalambo'],
    'Mtwara': ['Mtwara Urban', 'Mtwara Rural', 'Tandahimba', 'Masasi', 'Newala', 'Nanyumbu'],
    'Mara': ['Musoma Urban', 'Musoma Rural', 'Tarime', 'Serengeti', 'Bunda', 'Rorya', 'Butiama'],
    'Pwani': ['Kibaha', 'Bagamoyo', 'Mkuranga', 'Rufiji', 'Mafia', 'Kisarawe'],
    'Lindi': ['Lindi Urban', 'Lindi Rural', 'Nachingwea', 'Kilifi', 'Liwale', 'Ruangwa'],
    'Iringa': ['Iringa Urban', 'Iringa Rural', 'Mufindi', 'Kilolo', 'Ludewa', 'Makete'],
    'Kigoma': ['Kigoma Urban', 'Kigoma Rural', 'Kasulu', 'Kibondo', 'Uvinza', 'Kakonko', 'Buhigwe'],
    'Shinyanga': ['Shinyanga Urban', 'Shinyanga Rural', 'Kahama', 'Kishapu', 'Maswa', 'Meatu'],
    'Ruvuma': ['Songea Urban', 'Songea Rural', 'Tunduru', 'Namtumbo', 'Nyasa', 'Mbinga'],
    'Singida': ['Singida Urban', 'Singida Rural', 'Manyoni', 'Iramba', 'Ikungi'],
    'Manyara': ['Babati', 'Hanang', 'Mbulu', 'Kiteto', 'Simanjiro'],
    'Geita': ['Geita Town', 'Chato', 'Mbogwe', 'Nyang\'hwale', 'Bukombe'],
    'Katavi': ['Mpanda', 'Mlele', 'Nsimbo'],
    'Simiyu': ['Bariadi', 'Busega', 'Itilima', 'Maswa', 'Meatu'],
    'Songwe': ['Tunduma', 'Mbozi', 'Momba', 'Songwe'],
    'Njombe': ['Njombe Urban', 'Njombe Rural', 'Makambako', 'Ludewa', 'Makete', 'Wanging\'ombe'],
    'Zanzibar': ['Mjini Magharibi', 'Kaskazini A', 'Kaskazini B', 'Kusini', 'Magharibi A', 'Magharibi B', 'Kati']
  };

  const currentDistricts = districts[region] || [];

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Animation */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-150px', right: '-150px', animation: 'float 20s infinite' }} />
      <div style={{ position: 'absolute', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', bottom: '-100px', left: '-100px', animation: 'float 15s infinite reverse' }} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '20px', 
            margin: '0 auto 16px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '40px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            animation: 'logoFloat 3s ease-in-out infinite'
          }}>
            🏪
          </div>
          <h1 style={{ 
            margin: '0 0 4px', 
            fontSize: '28px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            KasiTRADE
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#64748b', 
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            {lang === 'sw' ? 'Mfumo wa Kisasa wa POS' : 'Modern POS System'}
          </p>
        </div>

        {/* Language Switcher - Side Position */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={handleLangChange}
            style={{ 
              background: lang === 'sw' ? '#667eea' : '#f1f5f9', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title={lang === 'sw' ? 'English' : 'Kiswahili'}
          >
            {lang === 'sw' ? '🇹🇿' : '🇬'}
          </button>
        </div>

        {/* ==================== LOGIN MODE ==================== */}
        {mode === 'login' && (
          <>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in to your account'}
            </h2>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="email" 
                placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={loading} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <input 
                type="password" 
                placeholder={lang === 'sw' ? 'Nenosiri' : 'Password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              
              {/* Forgot Password Link */}
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#667eea', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  alignSelf: 'flex-end',
                  textDecoration: 'underline',
                  padding: '0'
                }}
              >
                {lang === 'sw' ? 'Umesahau nenosiri?' : 'Forgot password?'}
              </button>

              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'transform 0.2s'
                }}
              >
                {loading ? '⏳ Inasubiri...' : '🔓 Ingia'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {lang === 'sw' ? 'Huna akaunti? ' : "Don't have account? "}
                <button 
                  type="button"
                  onClick={() => setMode('register-step-1')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#667eea', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  {lang === 'sw' ? 'Jisajili Sasa' : 'Sign Up'}
                </button>
              </p>
            </div>
          </>
        )}

        {/* ==================== FORGOT PASSWORD MODAL ==================== */}
        {showForgotPassword && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Rejesha Nenosiri' : 'Reset Password'}
            </h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
              {lang === 'sw' ? 'Tutaikutuma link ya kurejesha nenosiri kwenye email yako.' : 'We will send you a link to reset your password.'}
            </p>
            
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="email" 
                placeholder={lang === 'sw' ? 'Barua pepe yako' : 'Your email'} 
                value={forgotEmail} 
                onChange={e => setForgotEmail(e.target.value)} 
                required 
                disabled={loading} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: 'pointer'
                }}
              >
                {loading ? '⏳ Inatuma...' : '📧 Tuma Link'}
              </button>
              
              <button 
                type="button"
                onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                style={{ 
                  padding: '14px', 
                  background: '#f1f5f9', 
                  color: '#64748b', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {lang === 'sw' ? 'Rudi' : 'Back to Login'}
              </button>
            </form>
          </div>
        )}

        {/* ==================== REGISTER STEP 1 ==================== */}
        {mode === 'register-step-1' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: '#fff', color: '#667eea', fontWeight: '600', fontSize: '13px' }}>
                  {lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>
                  {lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}
                </div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Taarifa za Mtu' : 'Personal Information'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="email" 
                placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              <input 
                type="tel" 
                placeholder={lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              <input 
                type="password" 
                placeholder={lang === 'sw' ? 'Nenosiri (herufi 6+)' : 'Password (6+ chars)'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              
              {password.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} style={{ flex: 1, height: '4px', background: level <= passwordStrength ? getPasswordStrengthColor() : '#e2e8f0', borderRadius: '2px' }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: getPasswordStrengthColor(), fontWeight: '600' }}>{getPasswordStrengthText()}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setMode('login')} 
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ← {lang === 'sw' ? 'Rudi' : 'Back'}
                </button>
                <button 
                  type="button"
                  onClick={handleNextStep} 
                  style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {lang === 'sw' ? 'Endelea' : 'Continue'} →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ==================== REGISTER STEP 2 ==================== */}
        {mode === 'register-step-2' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>
                  {lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: '#fff', color: '#667eea', fontWeight: '600', fontSize: '13px' }}>
                  {lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}
                </div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Taarifa za Biashara' : 'Business Information'}
            </h2>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{lang === 'sw' ? 'Aina ya Biashara' : 'Business Type'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setBusinessType('duka')} 
                    style={{ 
                      padding: '16px', 
                      border: `2px solid ${businessType === 'duka' ? '#0047AB' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      background: businessType === 'duka' ? '#f0f7ff' : '#fff', 
                      cursor: 'pointer', 
                      fontWeight: '600', 
                      color: businessType === 'duka' ? '#0047AB' : '#64748b' 
                    }}
                  >
                    🛒 {lang === 'sw' ? 'Duka' : 'Shop'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBusinessType('microfinance')} 
                    style={{ 
                      padding: '16px', 
                      border: `2px solid ${businessType === 'microfinance' ? '#0047AB' : '#e2e8f0'}`, 
                      borderRadius: '12px', 
                      background: businessType === 'microfinance' ? '#f0f7ff' : '#fff', 
                      cursor: 'pointer', 
                      fontWeight: '600', 
                      color: businessType === 'microfinance' ? '#0047AB' : '#64748b' 
                    }}
                  >
                    💰 Microfinance
                  </button>
                </div>
              </div>

              <input 
                type="text" 
                placeholder={lang === 'sw' ? 'Jina la duka/biashara' : 'Business Name'} 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />

              <h4 style={{ margin: '8px 0 8px', color: '#1e293b', fontSize: '15px', fontWeight: '600' }}>
                📍 {lang === 'sw' ? 'Mahali Linapatikana' : 'Location'}
              </h4>

              <select 
                value={country} 
                onChange={(e) => setCountry(e.target.value)} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px' }}
              >
                <option value="Tanzania">🇹🇿 Tanzania</option>
                <option value="Kenya">🇰🇪 Kenya</option>
                <option value="Uganda">🇺🇬 Uganda</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select 
                  value={region} 
                  onChange={(e) => { setRegion(e.target.value); setDistrict(''); setWard(''); }} 
                  style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px' }}
                >
                  <option value="">{lang === 'sw' ? 'Chagua Mkoa...' : 'Select Region...'}</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select 
                  value={district} 
                  onChange={(e) => { setDistrict(e.target.value); setWard(''); }} 
                  disabled={!region}
                  style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px', opacity: !region ? 0.5 : 1 }}
                >
                  <option value="">{lang === 'sw' ? 'Chagua Wilaya...' : 'Select District...'}</option>
                  {currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* ✅ WARD INPUT - User types their own ward */}
              <input 
                type="text" 
                placeholder={lang === 'sw' ? 'Andika Kata yako' : 'Type your Ward'} 
                value={ward} 
                onChange={(e) => setWard(e.target.value)} 
                disabled={!district}
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', fontSize: '15px', outline: 'none', opacity: !district ? 0.5 : 1 }}
              />

              <div style={{ background: '#f0f7ff', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #0047AB' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                  💡 {lang === 'sw' ? 'Unamiliki duka zaidi ya moja? Utaweza kuongeza maduka mengine baada ya kujisajili.' : 'Own multiple shops? You can add more after registration.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setMode('register-step-1')} 
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ← {lang === 'sw' ? 'Rudi' : 'Back'}
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {loading ? '⏳ Inasubiri...' : '✨ Kamilisha Usajili'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0) rotate(0deg); } 
          50% { transform: translateY(-20px) rotate(10deg); } 
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default Auth;