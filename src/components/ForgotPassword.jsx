import { useState } from 'react';
import CI from './ColoredIcons';

const ForgotPassword = ({ supabase, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage('Angalia email yako. Tutumie link ya kurekebisha password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <CI.Key size={24} />
        Sahau Password?
      </h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Weka email uliyosajili" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
        >
          {loading ? 'Inatuma...' : 'Tuma Link ya Recovery'}
        </button>
      </form>
      {message && <p style={{ color: '#16a34a', textAlign: 'center', marginTop: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CI.Shield size={16} />{message}</p>}
      {error && <p style={{ color: '#dc2626', textAlign: 'center', marginTop: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CI.Warning size={16} />{error}</p>}
      <p style={{ textAlign: 'center', marginTop: '25px', color: '#64748b' }}>
        <button onClick={onBackToLogin} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
          ← Rudi kwenye Login
        </button>
      </p>
    </div>
  );
};

export default ForgotPassword;