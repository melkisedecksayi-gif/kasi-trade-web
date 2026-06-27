import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

// ✅ Supabase Credentials
const supabaseUrl = 'https://wajlksmnomxeeohakqsr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamxrc21ub214ZWVvaGFrcXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTc5NDMsImV4cCI6MjA5NDg5Mzk0M30.BsXnv4WqMs01mslIwpud750yCg7qCKHfpm9JiGrv_a0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        ⏳ Inapakia...
      </div>
    );
  }

  if (!session) {
    return (
      <Auth 
        supabase={supabase} 
        onAuthSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} 
      />
    );
  }

  return <Dashboard supabase={supabase} />;
}

export default App;