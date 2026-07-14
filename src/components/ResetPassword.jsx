import { useState, useEffect } from 'react';
import CI from './ColoredIcons';

const ResetPassword = ({ supabase, onLogin }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true); // ✅ MPYA: Loading state ya check

  useEffect(() => {
    const checkRecovery = async () => {
      try {
        // ✅ Safi: Handle error na data kwa usahihi
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          setError('Link ya recovery haijapatikana au imeisha muda. Tafadhali omba tena.');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Hitilafu ya kuangalia session. Jaribu tena.');
      } finally {
        setChecking(false); // ✅ MPYA: Mwisho wa loading
      }
    };
    checkRecovery();
  }, [supabase]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirm) {
      setError('Password mpya hazilingani.');
      return;
    }
    if (password.length < 6) {
      setError('Password lazima iwe na angalau herufi 6.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setMessage('Password imerekebishwa! Unaelekezwa kwenye login...');
      setTimeout(() => onLogin?.(), 2500); // ✅ Safi: onLogin inaweza kuwa undefined
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'Hitilafu imepatikana. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ MPYA: Onyesha loading wakati wa session check
  if (checking) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CI.Refresh size={18} />
          Inaangalia link ya recovery...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <CI.Refresh size={22} />
        Weka Password Mpya
      </h2>
      
      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CI.Warning size={16} />
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '8px', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}
          >
            <CI.Refresh size={14} />
            Jaribu tena
          </button>
        </div>
      )}
      
      {message && (
        <p style={{ color: '#16a34a', textAlign: 'center', marginBottom: '15px', fontSize: '14px', background: '#f0fdf4', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CI.Shield size={16} />
          {message}
        </p>
      )}

      <form onSubmit={handleUpdate}>
        <input 
          type="password" 
          placeholder="Password mpya (angalau herufi 6)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          minLength={6}
          disabled={loading}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
        />
        <input 
          type="password" 
          placeholder="Thibitisha password" 
          value={confirm} 
          onChange={(e) => setConfirm(e.target.value)} 
          required 
          disabled={loading}
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: loading ? '#94a3b8' : '#22c55e', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: '15px',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Inahifadhi...' : 'Badilisha Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;