import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import Toast from './Toast';
import { tanzaniaLocations } from '../data/locations'; // ✅ Import data mpya

const Auth = ({ supabase, onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  
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
    if (!email || !phone || !gender || !password || password.length < 6) {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!businessType) return showToast('Chagua aina ya biashara', 'error');
    if (!businessName.trim()) return showToast('Ingiza jina la duka', 'error');
    if (!region) return showToast('Chagua mkoa', 'error');
    if (!district) return showToast('Ingiza au chagua wilaya', 'error');
    if (!ward) return showToast('Ingiza au chagua kata', 'error');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, password,
        options: { 
          data: { 
            phone, gender, business_type: businessType, business_name: businessName, 
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
            phone, gender, business_type: businessType, business_name: businessName, 
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
    setEmail(''); setPassword(''); setPhone(''); setGender('');
    setBusinessType(''); setBusinessName(''); setCountry('Tanzania');
    setRegion(''); setDistrict(''); setWard('');
  };

  // ✅ Tumia data kutoka faili ya locations
  const regions = tanzaniaLocations.regions;
  const districtsData = tanzaniaLocations.districts;

  const currentDistricts = districtsData[region] ? Object.keys(districtsData[region]) : [];
  const currentWards = district && districtsData[region] && districtsData[region][district] ? districtsData[region][district] : [];

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

  const Logo = () => (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <div style={{ 
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '80px', height: '80px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '20px', marginBottom: '16px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        animation: 'logoFloat 3s ease-in-out infinite'
      }}>
        <span style={{ fontSize: '40px' }}>🏪</span>
      </div>
      <h1 style={{ 
        margin: '0 0 4px', fontSize: '32px', fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: '-0.5px'
      }}>
        KasiTRADE
      </h1>
      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {lang === 'sw' ? 'Mfumo wa Kisasa wa POS' : 'Modern POS System'}
      </p>
    </div>
  );

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite', padding: '20px', position: 'relative', overflow: 'hidden'}}>
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-150px', right: '-150px', animation: 'float 20s infinite' }} />
      <div style={{ position: 'absolute', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', bottom: '-100px', left: '-100px', animation: 'float 15s infinite reverse' }} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: mode === 'login' ? '450px' : '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1}}>
        
        <Logo />

        {(mode === 'register-step-1' || mode === 'register-step-2') && (
          <div style={{marginBottom: '24px'}}>
            <div style={{background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px'}}>
              <div style={{flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: mode === 'register-step-1' ? '#fff' : 'transparent', color: mode === 'register-step-1' ? '#667eea' : '#64748b', fontWeight: '600', fontSize: '13px'}}>
                {lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}
              </div>
              <div style={{flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: mode === 'register-step-2' ? '#fff' : 'transparent', color: mode === 'register-step-2' ? '#667eea' : '#64748b', fontWeight: '600', fontSize: '13px'}}>
                {lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}
              </div>
            </div>
          </div>
        )}

        <div style={{textAlign: 'center', marginBottom: '28px'}}>
          <h2 style={{margin: '0 0 8px', fontSize: '22px', color: '#1e293b', fontWeight: '700'}}>
            {mode === 'login' 
              ? (lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in to your account')
              : mode === 'register-step-1'
                ? (lang === 'sw' ? 'Taarifa za Mtu' : 'Personal Information')
                : (lang === 'sw' ? 'Taarifa za Biashara' : 'Business Information')
            }
          </h2>
        </div>

        {mode === 'login' && (
          <>
            <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <input type="email" placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none'}} />
              <input type="password" placeholder={lang === 'sw' ? 'Nenosiri' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none'}} />
              <button type="submit" disabled={loading} style={{padding: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>
                {loading ? '⏳ Inasubiri...' : '🔓 Ingia'}
              </button>
            </form>
            <div style={{textAlign: 'center', marginTop: '24px'}}>
              <button type="button" onClick={() => setMode('register-step-1')} style={{background: 'none', border: 'none', color: '#667eea', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontSize: '16px'}}>
                {lang === 'sw' ? 'Huna akaunti? Jisajili Sasa' : "Don't have account? Sign Up"}
              </button>
              <div style={{marginTop: '15px'}}>
                <button type="button" onClick={handleLangChange} style={{background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
                  {lang === 'sw' ? '🇧 English' : '🇹🇿 Kiswahili'}
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'register-step-1' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
            <input type="email" placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none'}} />
            <input type="tel" placeholder={lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} value={phone} onChange={e => setPhone(e.target.value)} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', fontSize: '15px', outline: 'none'}} />
            <div>
              <label style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>{lang === 'sw' ? 'Jinsia' : 'Gender'}</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                <button type="button" onClick={() => setGender('male')} style={{padding: '16px', border: `2px solid ${gender === 'male' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: gender === 'male' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: gender === 'male' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <span style={{fontSize: '20px'}}></span> {lang === 'sw' ? 'Mwanaume' : 'Male'}
                </button>
                <button type="button" onClick={() => setGender('female')} style={{padding: '16px', border: `2px solid ${gender === 'female' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: gender === 'female' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: gender === 'female' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <span style={{fontSize: '20px'}}>👩</span> {lang === 'sw' ? 'Mwanamke' : 'Female'}
                </button>
              </div>
            </div>
            <input type="password" placeholder={lang === 'sw' ? 'Nenosiri (herufi 6+)' : 'Password (6+ chars)'} value={password} onChange={e => setPassword(e.target.value)} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', fontSize: '15px', outline: 'none'}} />
            {password.length > 0 && (
              <div>
                <div style={{display: 'flex', gap: '4px', marginBottom: '4px'}}>
                  {[1, 2, 3, 4, 5].map((level) => (<div key={level} style={{flex: 1, height: '4px', background: level <= passwordStrength ? getPasswordStrengthColor() : '#e2e8f0', borderRadius: '2px'}} />))}
                </div>
                <p style={{margin: 0, fontSize: '12px', color: getPasswordStrengthColor(), fontWeight: '600'}}>{getPasswordStrengthText()}</p>
              </div>
            )}
            <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
              <button type="button" onClick={() => setMode('login')} style={{flex: 1, padding: '18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>← {lang === 'sw' ? 'Rudi' : 'Back'}</button>
              <button type="button" onClick={handleNextStep} style={{flex: 2, padding: '18px', background: 'linear-gradient(135deg, #0047AB 0%, #002F87 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>
                {lang === 'sw' ? 'Endelea' : 'Continue'} →
              </button>
            </div>
          </div>
        )}

        {mode === 'register-step-2' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>{lang === 'sw' ? 'Aina ya Biashara' : 'Business Type'}</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                <button type="button" onClick={() => setBusinessType('duka')} style={{padding: '16px', border: `2px solid ${businessType === 'duka' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'duka' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: businessType === 'duka' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <span style={{fontSize: '20px'}}>🛒</span> {lang === 'sw' ? 'Duka' : 'Shop'}
                </button>
                <button type="button" onClick={() => setBusinessType('microfinance')} style={{padding: '16px', border: `2px solid ${businessType === 'microfinance' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'microfinance' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: businessType === 'microfinance' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <span style={{fontSize: '20px'}}>💰</span> Microfinance
                </button>
              </div>
            </div>
            <input type="text" placeholder={lang === 'sw' ? 'Jina la duka/biashara' : 'Business Name'} value={businessName} onChange={e => setBusinessName(e.target.value)} style={{padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none'}} />
            <h4 style={{margin: '8px 0 8px', color: '#1e293b', fontSize: '15px', fontWeight: '600'}}> {lang === 'sw' ? 'Mahali Linapatikana' : 'Location'}</h4>
            <select value={country} onChange={(e) => setCountry(e.target.value)} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px'}}>
              <option value="Tanzania">🇹🇿 Tanzania</option>
              <option value="Kenya">🇰🇪 Kenya</option>
              <option value="Uganda">🇺🇬 Uganda</option>
            </select>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <select value={region} onChange={(e) => { setRegion(e.target.value); setDistrict(''); setWard(''); }} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px'}}>
                <option value="">{lang === 'sw' ? 'Chagua Mkoa...' : 'Select Region...'}</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {currentDistricts.length > 0 ? (
                <select value={district} onChange={(e) => { setDistrict(e.target.value); setWard(''); }} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px'}}>
                  <option value="">{lang === 'sw' ? 'Chagua Wilaya...' : 'Select District...'}</option>
                  {currentDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input type="text" placeholder={region ? (lang === 'sw' ? 'Andika Wilaya yako...' : 'Type your district...') : (lang === 'sw' ? 'Chagua Mkoa kwanza' : 'Select region first')} value={district} onChange={(e) => { setDistrict(e.target.value); setWard(''); }} disabled={!region} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px', opacity: !region ? 0.5 : 1}} />
              )}
            </div>
            {currentWards.length > 0 ? (
              <select value={ward} onChange={(e) => setWard(e.target.value)} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px'}}>
                <option value="">{lang === 'sw' ? 'Chagua Kata...' : 'Select Ward...'}</option>
                {currentWards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            ) : (
              <input type="text" placeholder={district ? (lang === 'sw' ? 'Andika Kata yako...' : 'Type your ward...') : (lang === 'sw' ? 'Chagua Wilaya kwanza' : 'Select district first')} value={ward} onChange={(e) => setWard(e.target.value)} disabled={!district} style={{padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px', opacity: !district ? 0.5 : 1}} />
            )}
            <div style={{background: '#f0f7ff', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #0047AB'}}>
              <p style={{margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5'}}> {lang === 'sw' ? 'Unamiliki duka zaidi ya moja? Utaweza kuongeza maduka mengine baada ya kujisajili.' : 'Own multiple shops? You can add more after registration.'}</p>
            </div>
            <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
              <button type="button" onClick={() => setMode('register-step-1')} style={{flex: 1, padding: '18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>← {lang === 'sw' ? 'Rudi' : 'Back'}</button>
              <button type="submit" onClick={handleRegister} disabled={loading} style={{flex: 2, padding: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>
                {loading ? ' Inasubiri...' : '✨ Kamilisha Usajili'}
              </button>
            </div>
          </div>
        )}

        {mode !== 'login' && (
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <button type="button" onClick={handleLangChange} style={{background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
              {lang === 'sw' ? '🇬 English' : '🇹🇿 Kiswahili'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        select { max-height: 200px; overflow-y: auto; }
        select::-webkit-scrollbar { width: 8px; }
        select::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        select::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        select::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Auth;