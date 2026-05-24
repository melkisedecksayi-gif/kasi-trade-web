import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Angalia kama user tayari amelogin
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Sikiliza mabadiliko ya login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🔄 DukaPOS inasubiri...</h2>
          <p>Inaunganisha na database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {session ? <Dashboard session={session} supabase={supabase} /> : <Login supabase={supabase} />}
    </div>
  );
}

export default App;