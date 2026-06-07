import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import UpdatePassword from './components/UpdatePassword';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'update-password', 'dashboard'

  useEffect(() => {
    // Check kama URL ina hash ya reset token
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setCurrentView('update-password');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setCurrentView('dashboard');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setCurrentView('dashboard');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handlePasswordUpdated = async () => {
    await supabase.auth.signOut();
    window.location.href = window.location.origin; // Rudi login
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        fontSize: '18px'
      }}>
        ⏳ Inapakia...
      </div>
    );
  }

  if (currentView === 'update-password') {
    return <UpdatePassword supabase={supabase} onPasswordUpdated={handlePasswordUpdated} />;
  }

  if (!session) {
    return <Login supabase={supabase} onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard session={session} supabase={supabase} />;
}

export default App;