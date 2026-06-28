import React, { useState, useEffect } from 'react';
import Toast from './Toast';

const Auth = ({ supabase, onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
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
      showToast('✅ Tumepokea ombi lako. Angalia email yako.', 'success');
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
    if (!district) return showToast('Ingiza wilaya', 'error');
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
          msg = 'Email hii tayari imeshajisajiliwa.';
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
            country, region, district, ward
          }).eq('id', data.user.id);
        } catch (dbErr) { 
          console.warn('Profile update:', dbErr); 
        }

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
    'Arusha': ['Arusha City', 'Arusha Rural', 'Meru', 'Monduli', 'Karatu'],
    'Mwanza': ['Ilemela', 'Nyamagana', 'Kwimba', 'Magu', 'Sengerema'],
    'Dodoma': ['Dodoma Urban', 'Dodoma Rural', 'Chamwino', 'Bahi', 'Kondoa'],
    'Mbeya': ['Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Tukuyu'],
    'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga'],
    'Tanga': ['Tanga City', 'Muheza', 'Korogwe', 'Pangani', 'Handeni'],
    'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Siha', 'Rombo'],
    'Kagera': ['Bukoba Urban', 'Bukoba Rural', 'Muleba', 'Biharamulo', 'Ngara'],
    'Tabora': ['Tabora Urban', 'Tabora Rural', 'Sikonge', 'Urambo', 'Uyui'],
    'Rukwa': ['Sumbawanga Urban', 'Sumbawanga Rural', 'Nkasi', 'Kalambo'],
    'Mtwara': ['Mtwara Urban', 'Mtwara Rural', 'Tandahimba', 'Masasi', 'Newala'],
    'Mara': ['Musoma Urban', 'Musoma Rural', 'Tarime', 'Serengeti', 'Bunda'],
    'Pwani': ['Kibaha', 'Bagamoyo', 'Mkuranga', 'Rufiji', 'Mafia'],
    'Lindi': ['Lindi Urban', 'Lindi Rural', 'Nachingwea', 'Kilwa', 'Liwale'],
    'Iringa': ['Iringa Urban', 'Iringa Rural', 'Mufindi', 'Kilolo', 'Ludewa'],
    'Kigoma': ['Kigoma Urban', 'Kigoma Rural', 'Kasulu', 'Kibondo', 'Uvinza'],
    'Shinyanga': ['Shinyanga Urban', 'Shinyanga Rural', 'Kahama', 'Kishapu', 'Maswa'],
    'Ruvuma': ['Songea Urban', 'Songea Rural', 'Tunduru', 'Namtumbo', 'Nyasa'],
    'Singida': ['Singida Urban', 'Singida Rural', 'Manyoni', 'Iramba', 'Ikungi'],
    'Manyara': ['Babati', 'Hanang', 'Mbulu', 'Kiteto', 'Simanjiro'],
    'Geita': ['Geita Town', 'Chato', 'Mbogwe', 'Nyang\'hwale', 'Bukombe'],
    'Katavi': ['Mpanda', 'Mlele', 'Nsimbo'],
    'Simiyu': ['Bariadi', 'Busega', 'Itilima', 'Maswa', 'Meatu'],
    'Songwe': ['Tunduma', 'Mbozi', 'Momba', 'Songwe'],
    'Njombe': ['Njombe Urban', 'Njombe Rural', 'Makambako', 'Ludewa', 'Makete'],
    'Zanzibar': ['Mjini Magharibi', 'Kaskazini A', 'Kaskazini B', 'Kusini', 'Magharibi A']
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
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-150px', right: '-150px' }} />
      <div style={{ position: 'absolute', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', bottom: '-100px', left: '-100px' }} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontSize: '48px',
            fontWeight: '800'
          }}>
            K
          </div>
          <h1 style={{ 
            margin: '0 0 4px', 
            fontSize: '28px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
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

        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button 
            type="button"
            onClick={handleLangChange}
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            title={lang === 'sw' ? 'Switch to English' : 'Badilisha Kiswahili'}
          >
            {lang === 'sw' ? '🇹🇿' : '🇺🇸'}
          </button>
        </div>

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
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              <input 
                type="password" 
                placeholder={lang === 'sw' ? 'Nenosiri' : 'Password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading} 
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
              
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
                  cursor: 'pointer'
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

        {showForgotPassword && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Rejesha Nenosiri' : 'Reset Password'}
            </h2>
            
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
                {lang === 'sw' ? '← Rudi' : '← Back to Login'}
              </button>
            </form>
          </div>
        )}

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
                  {Array.isArray(regions) && regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select 
                  value={district} 
                  onChange={(e) => { setDistrict(e.target.value); setWard(''); }} 
                  disabled={!region}
                  style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px', opacity: !region ? 0.5 : 1 }}
                >
                  <option value="">{lang === 'sw' ? 'Chagua Wilaya...' : 'Select District...'}</option>
                  {Array.isArray(currentDistricts) && currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <input 
                type="text" 
                placeholder={lang === 'sw' ? 'Andika Kata yako' : 'Type your Ward'} 
                value={ward} 
                onChange={(e) => setWard(e.target.value)} 
                disabled={!district}
                style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', fontSize: '15px', outline: 'none', opacity: !district ? 0.5 : 1 }}
              />

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
    </div>
  );
};

export default Auth;