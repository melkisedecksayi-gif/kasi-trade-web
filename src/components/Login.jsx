import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration (Nimetumia keys zako kutoka kwenye code yako)
const supabaseUrl = 'https://wajlksmnomxeeohakqsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamxrc21ub214ZWVvaGFrcXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTc5NDMsImV4cCI6MjA5NDg5Mzk0M30.BsXnv4WqMs01mslIwpud750yCg7qCKHfpm9JiGrv_a0';
const supabase = createClient(supabaseUrl, supabaseKey);

const Login = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // Kutafsiri makosa ya Supabase kwa Kiswahili
        if (error.message.includes('Email not confirmed')) {
          setError('⚠️ Tafadhali thibitisha email yako kwanza. Angalia inbox yako na ubonyeze link ya uthibitisho.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('❌ Email au nenosiri si sahihi. Jaribu tena.');
        } else if (error.message.includes('Too many requests')) {
          setError('⏳ Umejaribu mara nyingi sana. Subiri dakika chache.');
        } else {
          setError('❌ ' + error.message);
        }
      } else {
        setSuccess('✅ Umeingia kwa mafanikio!');
        // Subiri sekunde 1 kisha reload au endelea
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          } else {
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      setError(' Hitilafu imetokea: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '24px', fontSize: '24px' }}>
          Ingia KasiTrade
        </h2>
        
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#059669',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #a7f3d0'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: '600' }}>
              Barua Pepe (Email)
            </label>
            <input
              type="email"
              placeholder="mfano@kasitrade.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: '600' }}>
              Nenosiri (Password)
            </label>
            <input
              type="password"
              placeholder="Weka nenosiri lako"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {loading ? '⏳ Inaingia...' : ' Ingia Sasa'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          Huna akaunti? <a href="#" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Jisajili Hapa</a>
        </p>
      </div>
    </div>
  );
};

export default Login;