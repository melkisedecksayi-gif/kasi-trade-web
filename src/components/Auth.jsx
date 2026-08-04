import React, { useState, useEffect, useRef } from 'react';
import { REGIONS, DISTRICTS_BY_REGION } from '../data/tanzaniaLocations';
import CI from '../components/ColoredIcons';
import { sendWelcomeSMS, sendOTPSMS } from '../services/smsService';
import { sendWelcomeEmail } from '../services/emailService';
import logger from '../utils/logger';

const Toast = ({ message, type = 'success', onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';

  const Icon = () => {
    if (type === 'success') return <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', lineHeight: '1' }}>{'\u2713'}</span>;
    if (type === 'error') return <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', lineHeight: '1' }}>{'\u2715'}</span>;
    return '!';
  };

  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10000 }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '16px',
        padding: '16px 20px', minWidth: '300px', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'flex-start', gap: '14px', transform: visible ? 'translateX(0)' : 'translateX(420px)',
        opacity: visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>
          <Icon />
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.4' }}>{message}</div>
        </div>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  );
};

const Auth = ({ supabase, onAuthSuccess, theme }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Tanzania');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'sw');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [otpNeeded, setOtpNeeded] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    let strength = 0;
    if (password.length > 6) strength++;
    if (password.length > 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  useEffect(() => {
    if (!otpResendTimer) return;
    const timer = setInterval(() => {
      setOtpResendTimer(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendTimer]);

  useEffect(() => {
    if (otpNeeded && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpNeeded]);

  const showToast = (message, type) => setToast({ message, type, id: Date.now() });
  const resetForm = () => {
    setEmail(''); setPassword(''); setPhone('');
    setBusinessType(''); setBusinessName('');
    setCountry('Tanzania'); setRegion(''); setDistrict(''); setWard('');
    setOtpCode(''); setOtpNeeded(false); setAuthUser(null); setOtpVerified(false);
  };

  const regions = REGIONS;
  const districts = DISTRICTS_BY_REGION[region] || [];

  const getPasswordColor = () => passwordStrength <= 2 ? '#ef4444' : passwordStrength <= 3 ? '#f59e0b' : '#10b981';

  const getUserPhone = async (userId) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', userId).maybeSingle();
      return profile?.phone || '';
    } catch {
      return '';
    }
  };

  const handleSendOTP = async (userId, userPhone) => {
    setOtpSending(true);
    try {
      const { data: otp, error: rpcErr } = await supabase.rpc('generate_otp', {
        p_user_id: userId,
        p_purpose: 'login',
        p_expiry_minutes: 5,
      });
      if (rpcErr || !otp) throw new Error(rpcErr?.message || 'Failed to generate OTP');

      const smsResult = await sendOTPSMS({ phone: userPhone, code: otp, lang });
      if (smsResult.success) {
        setOtpResendTimer(60);
        setOtpHint(lang === 'sw'
          ? `Tumetuma namba ya uhakiki (OTP) kwenye simu yako ${userPhone.slice(-4).padStart(userPhone.length, '*')}. Ingiza hapa chini.`
          : `We sent a verification code (OTP) to your phone ${userPhone.slice(-4).padStart(userPhone.length, '*')}. Enter it below.`);
      } else {
        setOtpHint(lang === 'sw'
          ? `OTP: *${otp}* (Tumetumia fallback - SMS haikutumwa)`
          : `OTP: *${otp}* (Fallback mode - SMS not sent)`);
        setOtpResendTimer(60);
      }
    } catch (err) {
      showToast(lang === 'sw' ? 'Imeshindwa kutuma OTP. Jaribu tena.' : 'Failed to send OTP. Please try again.', 'error');
      setOtpNeeded(false);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      return showToast(lang === 'sw' ? 'Ingiza namba yako ya OTP' : 'Enter your OTP code', 'error');
    }
    if (!authUser) return;

    setLoading(true);
    try {
      const { data: valid, error: rpcErr } = await supabase.rpc('verify_otp', {
        p_user_id: authUser.id,
        p_code: otpCode,
        p_purpose: 'login',
      });
      if (rpcErr) throw new Error(rpcErr.message);

      if (valid) {
        setOtpVerified(true);
        onAuthSuccess && onAuthSuccess();
      } else {
        showToast(lang === 'sw' ? 'OTP siyo sahihi au imekwisha muda. Jaribu tena.' : 'Invalid or expired OTP. Please try again.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  const handleResendOTP = async () => {
    if (otpResendTimer > 0 || otpSending || !authUser) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', authUser.id).maybeSingle();
      await handleSendOTP(authUser.id, profile?.phone || '');
    } catch (e) { /* ignore */ }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.user) {
        const userPhone = await getUserPhone(data.user.id);
        if (userPhone) {
          setAuthUser(data.user);
          setOtpNeeded(true);
          setOtpResendTimer(0);
          await handleSendOTP(data.user.id, userPhone);
          setLoading(false);
          return;
        }

        await supabase.auth.signOut();
        showToast(
          lang === 'sw'
            ? 'Akaunti haina namba ya simu. Wasiliana na support kuongeza namba yako.'
            : 'Account has no phone number. Contact support to add your phone.',
          'error'
        );
        setLoading(false);
        return;
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (!otpNeeded) setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return showToast(lang === 'sw' ? 'Ingiza barua pepe yako' : 'Enter your email', 'error');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      showToast(lang === 'sw' ? 'Tumepokea ombi lako. Angalia email yako.' : 'Request received. Check your email.', 'success');
      setMode('login');
      setEmail('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = () => {
    if (!email || !phone || !password || password.length < 6) {
      return showToast(lang === 'sw' ? 'Jaza taarifa zote na password iwe na herufi 6+.' : 'Fill all fields. Password must be 6+ chars.', 'error');
    }
    setMode('register-step-2');
  };

  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    if (!businessType) return showToast(lang === 'sw' ? 'Chagua aina ya biashara' : 'Select business type', 'error');
    if (!businessName.trim()) return showToast(lang === 'sw' ? 'Ingiza jina la duka' : 'Enter business name', 'error');
    if (!region) return showToast(lang === 'sw' ? 'Chagua mkoa' : 'Select region', 'error');
    if (!district) return showToast(lang === 'sw' ? 'Ingiza wilaya' : 'Enter district', 'error');
    if (!ward) return showToast(lang === 'sw' ? 'Ingiza kata' : 'Enter ward', 'error');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { phone, business_type: businessType, business_name: businessName, country, region, district, ward } }
      });

      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('already registered')) msg = lang === 'sw' ? 'Email hii tayari imeshajisajiliwa.' : 'Email already registered.';
        throw new Error(msg);
      }

      if (data?.user) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await supabase.from('profiles').update({ phone, business_type: businessType, business_name: businessName, country, region, district, ward }).eq('id', data.user.id);
        } catch (profileErr) {
          logger.warn('Auth', 'Profile update warning:', profileErr);
        }

        if (phone) {
          const name = businessName || '';
          sendWelcomeSMS({ phone, businessName: name, lang }).catch(() => {});
        }

        sendWelcomeEmail({ email, businessName, shopName: businessName || '', lang }).catch(() => {});

        showToast(lang === 'sw' ? 'Usajili umekamilika! Angalia email yako.' : 'Registration complete! Check your email.', 'success');
        setTimeout(() => { setMode('login'); resetForm(); }, 3000);
      }
    } catch (err) {
      showToast(err.message || 'Hitilafu imetokea', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const newLang = lang === 'sw' ? 'en' : 'sw';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const renderOTPVerification = () => (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-150px', right: '-150px' }}></div>
        <div style={{ position: 'absolute', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', bottom: '-100px', left: '-100px' }}></div>

        <div style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1e293b', fontWeight: '700' }}>
              {lang === 'sw' ? 'Uthibitishaji wa Namba' : 'Phone Verification'}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
              {otpSending
                ? (lang === 'sw' ? 'Inatuma OTP...' : 'Sending OTP...')
                : (otpHint || (lang === 'sw' ? 'Tumetuma OTP kwenye simu yako' : 'We sent OTP to your phone'))}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={lang === 'sw' ? 'Ingiza namba 6 za OTP' : 'Enter 6-digit OTP'}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleOtpKeyDown}
              disabled={loading || otpSending}
              style={{
                padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '22px',
                outline: 'none', textAlign: 'center', letterSpacing: '12px', fontFamily: 'monospace',
                fontWeight: '700', color: '#1e293b',
              }}
            />

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otpSending || otpCode.length < 4}
              style={{
                padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px',
                cursor: (loading || otpSending || otpCode.length < 4) ? 'not-allowed' : 'pointer',
                opacity: (loading || otpSending || otpCode.length < 4) ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? <><CI.Clock size={18} />{lang === 'sw' ? 'Inathibitisha...' : 'Verifying...'}</> : <><CI.Unlock size={18} />{lang === 'sw' ? 'Thibitisha' : 'Verify'}</>}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleResendOTP}
                disabled={otpResendTimer > 0 || otpSending}
                style={{
                  background: 'none', border: 'none', color: otpResendTimer > 0 ? '#94a3b8' : '#667eea',
                  fontWeight: '600', cursor: otpResendTimer > 0 ? 'default' : 'pointer', fontSize: '13px',
                }}
              >
                {otpResendTimer > 0
                  ? `${lang === 'sw' ? 'Tuma tena baada ya' : 'Resend in'} ${otpResendTimer}s`
                  : (lang === 'sw' ? 'Tuma OTP tena' : 'Resend OTP')}
              </button>
              <button
                onClick={async () => {
                  setOtpNeeded(false);
                  setLoading(false);
                  await supabase.auth.signOut();
                }}
                style={{
                  background: 'none', border: 'none', color: '#ef4444', fontWeight: '600',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                {lang === 'sw' ? 'Ghairi' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (otpNeeded && !otpVerified) {
    return renderOTPVerification();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', top: '-150px', right: '-150px' }}></div>
      <div style={{ position: 'absolute', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', bottom: '-100px', left: '-100px' }}></div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>

        {/* Logo & Lang Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/Logo.png" alt="KasiTrade" style={{ width: '180px', height: 'auto', display: 'block', margin: '0 auto' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<h2 style="color:#667eea;margin:0;">KasiTrade</h2>'; }} />
        </div>

        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button type="button" onClick={toggleLang} style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#667eea', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', letterSpacing: '0.5px' }} title={lang === 'sw' ? 'Switch to English' : 'Badilisha Kiswahili'}>
            {lang === 'sw' ? 'SW' : 'EN'}
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Ingia kwenye akaunti yako' : 'Sign in to your account'}
            </h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />
              <input type="password" placeholder={lang === 'sw' ? 'Nenosiri' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />

              <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: '600', cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-end', textDecoration: 'underline', padding: '0' }}>
                {lang === 'sw' ? 'Umesahau nenosiri?' : 'Forgot password?'}
              </button>

              <button type="submit" disabled={loading} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <><CI.Clock size={18} />{lang === 'sw' ? 'Inasubiri...' : 'Loading...'}</> : <><CI.Unlock size={18} />{lang === 'sw' ? 'Ingia' : 'Sign In'}</>}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {lang === 'sw' ? 'Huna akaunti? ' : "Don't have an account? "}
                <button type="button" onClick={() => setMode('register-step-1')} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
                  {lang === 'sw' ? 'Jisajili Sasa' : 'Sign Up'}
                </button>
              </p>
            </div>
          </>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot-password' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Rejesha Nenosiri' : 'Reset Password'}
            </h2>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" placeholder={lang === 'sw' ? 'Barua pepe yako' : 'Your email'} value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />
              <button type="submit" disabled={loading} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <><CI.Clock size={18} />{lang === 'sw' ? 'Inatuma...' : 'Sending...'}</> : <><CI.Mail size={18} />{lang === 'sw' ? 'Tuma Link' : 'Send Link'}</>}
              </button>
              <button type="button" onClick={() => setMode('login')} style={{ padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                {lang === 'sw' ? '← Rudi' : '← Back to Login'}
              </button>
            </form>
          </>
        )}

        {/* REGISTER STEP 1 */}
        {mode === 'register-step-1' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: '#fff', color: '#667eea', fontWeight: '600', fontSize: '13px' }}>{lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}</div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>{lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}</div>
              </div>
            </div>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Taarifa za Mtu' : 'Personal Information'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" placeholder={lang === 'sw' ? 'Barua pepe' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />
              <input type="tel" placeholder={lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />
              <input type="password" placeholder={lang === 'sw' ? 'Nenosiri (herufi 6+)' : 'Password (6+ chars)'} value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />

              {password.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: '4px', background: i <= passwordStrength ? getPasswordColor() : '#e2e8f0', borderRadius: '2px' }}></div>
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: getPasswordColor(), fontWeight: '600' }}>
                    {passwordStrength <= 2 ? (lang === 'sw' ? 'Dhaifu' : 'Weak') : passwordStrength <= 3 ? (lang === 'sw' ? 'Kati' : 'Medium') : (lang === 'sw' ? 'Imara' : 'Strong')}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setMode('login')} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang === 'sw' ? '← Rudi' : '← Back'}
                </button>
                <button type="button" onClick={handleRegisterStep1} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Endelea' : 'Continue'} →
                </button>
              </div>
            </div>
          </>
        )}

        {/* REGISTER STEP 2 */}
        {mode === 'register-step-2' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'transparent', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>{lang === 'sw' ? 'HATUA 1 YA 2' : 'STEP 1 OF 2'}</div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: '#fff', color: '#667eea', fontWeight: '600', fontSize: '13px' }}>{lang === 'sw' ? 'HATUA 2 YA 2' : 'STEP 2 OF 2'}</div>
              </div>
            </div>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>
              {lang === 'sw' ? 'Taarifa za Biashara' : 'Business Information'}
            </h2>
            <form onSubmit={handleRegisterStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                  {lang === 'sw' ? 'Aina ya Biashara' : 'Business Type'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button type="button" onClick={() => setBusinessType('duka')} style={{ padding: '16px', border: `2px solid ${businessType === 'duka' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'duka' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: businessType === 'duka' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CI.Cart size={18} /> {lang === 'sw' ? 'Duka' : 'Shop'}
                  </button>
                  <button type="button" onClick={() => setBusinessType('microfinance')} style={{ padding: '16px', border: `2px solid ${businessType === 'microfinance' ? '#0047AB' : '#e2e8f0'}`, borderRadius: '12px', background: businessType === 'microfinance' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', color: businessType === 'microfinance' ? '#0047AB' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CI.Money size={18} /> Microfinance
                  </button>
                </div>
              </div>

              <input type="text" placeholder={lang === 'sw' ? 'Jina la duka/biashara' : 'Business Name'} value={businessName} onChange={e => setBusinessName(e.target.value)} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />

              <h4 style={{ margin: '8px 0 8px', color: '#1e293b', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CI.Location size={18} /> {lang === 'sw' ? 'Mahali Linapatikana' : 'Location'}
              </h4>

              <select value={country} onChange={e => setCountry(e.target.value)} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px' }}>
                <option value="Tanzania">Tanzania</option>
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select value={region} onChange={e => { setRegion(e.target.value); setDistrict(''); setWard(''); }} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px' }}>
                  <option value="">{lang === 'sw' ? 'Chagua Mkoa...' : 'Select Region...'}</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={district} onChange={e => { setDistrict(e.target.value); setWard(''); }} disabled={!region} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', background: '#fff', fontSize: '15px', opacity: region ? 1 : 0.5 }}>
                  <option value="">{lang === 'sw' ? 'Chagua Wilaya...' : 'Select District...'}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <input type="text" placeholder={lang === 'sw' ? 'Andika Kata yako' : 'Type your Ward'} value={ward} onChange={e => setWard(e.target.value)} disabled={!district} style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', width: '100%', fontSize: '15px', outline: 'none', opacity: district ? 1 : 0.5 }} />

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setMode('register-step-1')} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang === 'sw' ? '← Rudi' : '← Back'}
                </button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><CI.Clock size={18} />{lang === 'sw' ? 'Inasubiri...' : 'Loading...'}</> : <><CI.Star size={18} />{lang === 'sw' ? 'Kamilisha Usajili' : 'Complete Registration'}</>}
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
