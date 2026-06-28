import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wajlksmnomxeeohakqsr.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div>Inapakia...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth supabase={supabase} onAuthSuccess={() => window.location.reload()} />;
  }

  return <Dashboard supabase={supabase} />;
}

export default App;