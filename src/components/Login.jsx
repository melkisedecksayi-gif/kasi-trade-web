import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { translations } from '../translations';

const Login = ({ supabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState('sw');
  const t = translations[lang];

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert(lang === 'sw' ? '✅ Akaunti imeundwa! Angalia email yako.' : '✅ Account created! Check your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#f0f2f5'}}>
      <div style={{background:'white', padding:'2rem', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', width:'100%', maxWidth:'380px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h2 style={{margin:0}}>{t.appName}</h2>
          <button onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')} style={{padding:'4px 10px', background:'#17a2b8', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem'}}>{t.language}: {lang === 'sw' ? 'SW' : 'EN'}</button>
        </div>
        
        <p style={{textAlign:'center', color:'#666', marginBottom:'1.5rem'}}>{isSignUp ? t.signup : t.login}</p>
        
        <form onSubmit={handleAuth} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem'}} required />
          
          <div style={{display:'flex', gap:'8px'}}>
            <input type={showPassword ? "text" : "password"} placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', flex:1}} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{padding:'0.75rem 1rem', background:'#6c757d', color:'white', border:'none', borderRadius:'8px', cursor:'pointer'}}>{showPassword ? t.hidePassword : t.showPassword}</button>
          </div>
          
          {error && <p style={{color:'#dc3545', fontSize:'0.875rem', margin:0}}>❌ {error}</p>}
          
          <button type="submit" disabled={loading} style={{padding:'0.75rem', background:'#007bff', color:'white', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer', fontWeight:'bold'}}>
            {loading ? (lang === 'sw' ? 'Inasubiri...' : 'Loading...') : (isSignUp ? t.signup : t.login)}
          </button>
        </form>
        
        <p style={{textAlign:'center', marginTop:'1rem', fontSize:'0.9rem', color:'#666'}}>
          {isSignUp ? t.hasAccount : t.noAccount}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{color:'#007bff', cursor:'pointer', fontWeight:'bold', marginLeft:'4px'}}>
            {isSignUp ? t.login : t.signup}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;