import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
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
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Inapakia...</div>;
  }

  if (!session) {
    return <Auth supabase={supabase} onAuthSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />;
  }

  return <Dashboard supabase={supabase} />;
}

export default App;