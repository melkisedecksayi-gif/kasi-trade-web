import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============ SUPABASE CONFIG ============
const supabaseUrl = 'https://wajlksmnomxeeohakqsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamxrc21ub214ZWVvaGFrcXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTc5NDMsImV4cCI6MjA5NDg5Mzk0M30.BsXnv4WqMs01mslIwpud750yCg7qCKHfpm9JiGrv_a0';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============ ICONS ============
const Icons = {
  Home: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  ShoppingCart: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
  Box: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  Users: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  BarChart: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  Settings: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/></svg>,
  User: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Building: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  LogOut: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Menu: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  X: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Plus: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Trash: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  Search: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Help: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  ChevronDown: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ArrowLeft: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Check: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  Alert: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  Sales: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Profit: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Clock: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Card: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  Moon: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Sun: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Zap: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Activity: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Shield: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  CreditCard: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  Database: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>,
  Download: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
};

// ============ TOAST COMPONENT ============
function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 10000 }}>
      <div style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 16, padding: '16px 20px', minWidth: 300, maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 14, transform: visible ? 'translateX(0)' : 'translateX(420px)', opacity: visible ? 1 : 0, transition: 'all 0.4s' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>{type === 'success' ? '✓' : type === 'error' ? '' : '!'}</div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{message}</div>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  );
}

// ============ AUTH COMPONENT ============
function Auth({ supabase, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuthSuccess();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setToast({ message: 'Usajili umekamilika! Angalia email yako.', type: 'success' });
      setTimeout(() => setMode('login'), 3000);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 22, color: '#1e293b', fontWeight: 700, textAlign: 'center' }}>
          {mode === 'login' ? 'Ingia kwenye akaunti yako' : 'Jisajili Sasa'}
        </h2>
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="email" placeholder="Barua pepe" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ padding: 14, border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 15 }} />
          <input type="password" placeholder="Nenosiri" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ padding: 14, border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 15 }} />
          <button type="submit" disabled={loading} style={{ padding: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            {loading ? 'Inasubiri...' : mode === 'login' ? ' Ingia' : '✨ Jisajili'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {mode === 'login' ? "Huna akaunti? Jisajili" : "Tayari una akaunti? Ingia"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SIDEBAR COMPONENT ============
function Sidebar({ currentView, setCurrentView, lang, isDarkMode, session, onLogout, shops, currentShop, setCurrentShop, isOpen, setIsOpen }) {
  const menuItems = [
    { id: 'dashboard', icon: Icons.Home, label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Mauzo' : 'Sales' },
    { id: 'products', icon: Icons.Box, label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: Icons.Users, label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: Icons.BarChart, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: Icons.Settings, label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];
  const bg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#cbd5e1' : '#475569';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ width: 260, background: bg, height: '100vh', position: 'fixed', left: isOpen ? 0 : -260, top: 0, zIndex: 999, transition: 'left 0.3s', boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${border}`, overflowY: 'auto' }}>
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>KasiTrade</div>
        <button onClick={() => setIsOpen(false)} style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', color: text }}>
          <Icons.X size={18} />
        </button>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setIsOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', borderRadius: 10, background: active ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent', color: active ? '#ffffff' : muted, fontSize: 15, fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left' }}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${border}` }}>
        <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', borderRadius: 10, background: 'transparent', color: '#ef4444', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
          <Icons.LogOut size={20} />
          <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}

// ============ POS COMPONENT ============
function POS({ lang, supabase, currentShop, isDarkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    if (!currentShop?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('shop_id', currentShop.id);
      if (!error && data) setProducts(data);
      setLoading(false);
    })();
  }, [currentShop, supabase]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: bg }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icons.Box size={24} /> {lang === 'sw' ? 'Mauzo (POS)' : 'Point of Sale'}
      </h2>
      <input type="text" placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `2px solid ${border}`, borderRadius: 12, fontSize: 14, background: cardBg, color: text, marginBottom: 16, boxSizing: 'border-box' }} />
      {loading ? (
        <p style={{ textAlign: 'center', color: muted }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: muted }}>
          <Icons.Box size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: cardBg, borderRadius: 12, border: `1px solid ${border}`, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{p.emoji || '📦'}</div>
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1', marginBottom: 8 }}>{formatCurrency(p.sell_price)}</div>
              <div style={{ padding: '4px 8px', background: p.stock < 10 ? '#fee2e2' : '#d1fae5', borderRadius: 6, fontSize: 11, fontWeight: 600, color: p.stock < 10 ? '#dc2626' : '#059669' }}>
                {p.stock} {lang === 'sw' ? 'zimebaki' : 'left'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ PRODUCTS COMPONENT ============
function Products({ lang, supabase, currentShop, isDarkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', buy_price: '', sell_price: '', stock: '' });
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    if (!currentShop?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) setProducts(data);
      setLoading(false);
    })();
  }, [currentShop, supabase]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.buy_price || !form.sell_price) {
      setToast({ message: lang === 'sw' ? 'Jaza taarifa zote' : 'Fill all fields', type: 'error' });
      return;
    }
    try {
      const { error } = await supabase.from('products').insert([{
        shop_id: currentShop.id,
        name: form.name,
        buy_price: parseFloat(form.buy_price),
        sell_price: parseFloat(form.sell_price),
        stock: parseInt(form.stock) || 0,
      }]);
      if (error) throw error;
      setToast({ message: lang === 'sw' ? 'Bidhaa imeongezwa!' : 'Product added!', type: 'success' });
      setShowModal(false);
      setForm({ name: '', buy_price: '', sell_price: '', stock: '' });
      const { data } = await supabase.from('products').select('*').eq('shop_id', currentShop.id);
      if (data) setProducts(data);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Futa bidhaa hii?' : 'Delete?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      setToast({ message: lang === 'sw' ? 'Bidhaa imefutwa' : 'Deleted', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: bg }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icons.Box size={28} /> {lang === 'sw' ? 'Bidhaa' : 'Products'}
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{products.length}</span>
        </h2>
        <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Plus size={18} /> {lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}
        </button>
      </div>
      <input type="text" placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `2px solid ${border}`, borderRadius: 12, fontSize: 14, background: cardBg, color: text, marginBottom: 24, boxSizing: 'border-box' }} />
      {loading ? (
        <p style={{ textAlign: 'center', color: muted }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: muted }}>
          <Icons.Box size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>{lang === 'sw' ? 'Hakuna bidhaa' : 'No products'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: cardBg, borderRadius: 12, border: `1px solid ${border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{p.emoji || '📦'}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: text }}>{p.name}</h4>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: muted }}>{lang === 'sw' ? 'Kununua' : 'Buy'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{formatCurrency(p.buy_price)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: muted }}>{lang === 'sw' ? 'Kuuza' : 'Sell'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatCurrency(p.sell_price)}</div>
                </div>
              </div>
              <div style={{ padding: '6px 12px', background: p.stock < 10 ? '#fee2e2' : '#d1fae5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: p.stock < 10 ? '#dc2626' : '#059669' }}>
                {p.stock} {lang === 'sw' ? 'imebaki' : 'left'}
              </div>
              <button onClick={() => handleDelete(p.id)} style={{ width: 36, height: 36, borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 32, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: text }}>{lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: text }}>
                <Icons.X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="text" placeholder={lang === 'sw' ? 'Jina la bidhaa' : 'Product name'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: 12, border: `2px solid ${border}`, borderRadius: 10, fontSize: 14, background: bg, color: text }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input type="number" placeholder={lang === 'sw' ? 'Bei kununua' : 'Buy price'} value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} required style={{ padding: 12, border: `2px solid ${border}`, borderRadius: 10, fontSize: 14, background: bg, color: text }} />
                <input type="number" placeholder={lang === 'sw' ? 'Bei kuuza' : 'Sell price'} value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} required style={{ padding: 12, border: `2px solid ${border}`, borderRadius: 10, fontSize: 14, background: bg, color: text }} />
              </div>
              <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={{ padding: 12, border: `2px solid ${border}`, borderRadius: 10, fontSize: 14, background: bg, color: text }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, background: '#f1f5f9', color: text, border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button type="submit" style={{ flex: 2, padding: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {lang === 'sw' ? 'Hifadhi' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CUSTOMERS COMPONENT ============
function Customers({ lang, supabase, currentShop, isDarkMode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    if (!currentShop?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) setCustomers(data);
      setLoading(false);
    })();
  }, [currentShop, supabase]);

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'sw' ? 'Futa mteja?' : 'Delete?')) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setCustomers(customers.filter(c => c.id !== id));
      setToast({ message: lang === 'sw' ? 'Mteja amefutwa' : 'Deleted', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: bg }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {lang === 'sw' ? 'Wateja' : 'Customers'}
        </span>
        <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{customers.length}</span>
      </h2>
      <input type="text" placeholder={lang === 'sw' ? 'Tafuta mteja...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: `2px solid ${border}`, borderRadius: 14, fontSize: 14, background: cardBg, color: text, marginBottom: 24, boxSizing: 'border-box' }} />
      {loading ? (
        <p style={{ textAlign: 'center', color: muted }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: muted }}>
          <Icons.Users size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>{lang === 'sw' ? 'Hakuna wateja' : 'No customers'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: text }}>{c.name}</h4>
                {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: muted }}><Icons.Phone size={14} style={{ color: '#10b981' }} /> {c.phone}</div>}
              </div>
              <button onClick={() => handleDelete(c.id)} style={{ width: 40, height: 40, borderRadius: 12, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ REPORTS COMPONENT ============
function Reports({ lang, supabase, currentShop, isDarkMode }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    if (!currentShop?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('transactions').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (!error && data) {
        setTransactions(data);
        setTotalSales(data.reduce((sum, t) => sum + (t.total_amount || 0), 0));
        setTotalProfit(data.reduce((sum, t) => sum + (t.profit || 0), 0));
      }
      setLoading(false);
    })();
  }, [currentShop, supabase]);

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: bg }}>
      <h2 style={{ color: text, margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>{lang === 'sw' ? 'Ripoti' : 'Reports'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: cardBg, padding: 24, borderRadius: 12, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><Icons.Sales size={24} /></div>
          </div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales'}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{formatCurrency(totalSales)}</div>
        </div>
        <div style={{ background: cardBg, padding: 24, borderRadius: 12, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><Icons.Profit size={24} /></div>
          </div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{lang === 'sw' ? 'Jumla ya Faida' : 'Total Profit'}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{formatCurrency(totalProfit)}</div>
        </div>
        <div style={{ background: cardBg, padding: 24, borderRadius: 12, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Icons.ShoppingCart size={24} /></div>
          </div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{lang === 'sw' ? 'Idadi ya Mauzo' : 'Number of Sales'}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{transactions.length}</div>
        </div>
      </div>
      <h3 style={{ color: text, margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>{lang === 'sw' ? 'Mauzo ya Hivi Karibuni' : 'Recent Transactions'}</h3>
      {loading ? (
        <p style={{ textAlign: 'center', color: muted }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: muted }}>
          <Icons.BarChart size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>{lang === 'sw' ? 'Hakuna mauzo bado' : 'No transactions yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transactions.map(t => (
            <div key={t.id} style={{ background: cardBg, padding: 20, borderRadius: 12, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: text, marginBottom: 4 }}>#{t.id?.slice(0, 8) || '---'}</div>
                <div style={{ fontSize: 13, color: muted }}>{new Date(t.created_at).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{formatCurrency(t.total_amount || 0)}</div>
                {t.profit > 0 && <div style={{ fontSize: 12, color: '#6366f1', marginTop: 4 }}>{lang === 'sw' ? 'Faida' : 'Profit'}: {formatCurrency(t.profit)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS COMPONENT ============
function Settings({ lang, supabase, currentShop, isDarkMode, setIsDarkMode }) {
  const [toast, setToast] = useState(null);
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: bg }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icons.Settings size={32} /> {lang === 'sw' ? 'Mipangilio' : 'Settings'}
      </h2>
      <p style={{ margin: '0 0 32px', color: muted, fontSize: 14 }}>{lang === 'sw' ? 'Dhibiti mipangilio ya akaunti yako' : 'Manage your account settings'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: cardBg, borderRadius: 12, border: `1px solid ${border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 4 }}>Dark Mode</div>
            <div style={{ fontSize: 13, color: muted }}>{lang === 'sw' ? 'Badilisha muonekano' : 'Change appearance'}</div>
          </div>
          <button onClick={() => { if (setIsDarkMode) { setIsDarkMode(!isDarkMode); localStorage.setItem('dark_mode', String(!isDarkMode)); } }} style={{ width: 52, height: 28, borderRadius: 14, background: isDarkMode ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : border, border: 'none', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 3, left: isDarkMode ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: cardBg, borderRadius: 12, border: `1px solid ${border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 4 }}>{lang === 'sw' ? 'Duka la Sasa' : 'Current Shop'}</div>
            <div style={{ fontSize: 13, color: muted }}>{currentShop?.shop_name || (lang === 'sw' ? 'Hakuna duka' : 'No shop')}</div>
          </div>
          <div style={{ padding: '8px 16px', background: '#d1fae5', color: '#059669', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{lang === 'sw' ? 'Inatumika' : 'Active'}</div>
        </div>
      </div>
    </div>
  );
}

// ============ ABOUT COMPONENT ============
function About({ lang, isDarkMode, onBack }) {
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: bg }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: cardBg, border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', color: text, fontSize: 14, fontWeight: 600, marginBottom: 32 }}>
        <Icons.ArrowLeft size={18} /> {lang === 'sw' ? 'Rudi Nyumbani' : 'Back to Home'}
      </button>
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 20, padding: '60px 40px', textAlign: 'center', color: '#fff', marginBottom: 48 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 48, fontWeight: 800 }}>{lang === 'sw' ? 'Kuhusu KasiTrade' : 'About KasiTrade'}</h1>
        <p style={{ margin: 0, fontSize: 18, opacity: 0.95 }}>{lang === 'sw' ? 'Mfumo wa kisasa wa POS' : 'A modern POS system'}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ background: cardBg, borderRadius: 16, padding: 32, border: `1px solid ${border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Icons.Zap size={32} color="#fff" /></div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700, color: text }}>{lang === 'sw' ? 'Maono Yetu' : 'Our Vision'}</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: muted }}>{lang === 'sw' ? 'Kuwa mfumo bora zaidi wa POS Afrika Mashariki.' : 'To be the leading POS system in East Africa.'}</p>
        </div>
        <div style={{ background: cardBg, borderRadius: 16, padding: 32, border: `1px solid ${border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Icons.Activity size={32} color="#fff" /></div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700, color: text }}>{lang === 'sw' ? 'Misheni Yetu' : 'Our Mission'}</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: muted }}>{lang === 'sw' ? 'Kutoa suluhisho la teknolojia la kisasa.' : 'To provide a modern technology solution.'}</p>
        </div>
      </div>
    </div>
  );
}

// ============ HELP COMPONENT ============
function Help({ lang, isDarkMode, onBack }) {
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  const faqs = [
    { q: lang === 'sw' ? 'Jinsi ya kuanza?' : 'How to start?', a: lang === 'sw' ? 'Jisajili na uanze kuuza.' : 'Register and start selling.' },
    { q: lang === 'sw' ? 'Je, inafanya kazi kwenye simu?' : 'Does it work on mobile?', a: lang === 'sw' ? 'Ndiyo, inafanya kazi vizuri.' : 'Yes, it works perfectly.' },
    { q: lang === 'sw' ? 'Je, data yangu iko salama?' : 'Is my data safe?', a: lang === 'sw' ? 'Ndiyo, tunatumia usalama wa hali ya juu.' : 'Yes, we use high-level security.' },
  ];
  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: bg }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: cardBg, border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', color: text, fontSize: 14, fontWeight: 600, marginBottom: 32 }}>
        <Icons.ArrowLeft size={18} /> {lang === 'sw' ? 'Rudi' : 'Back'}
      </button>
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 20, padding: '48px 32px', textAlign: 'center', color: '#fff', marginBottom: 48 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 40, fontWeight: 800 }}>{lang === 'sw' ? 'Kituo cha Msaada' : 'Help Center'}</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ background: cardBg, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: text }}>{i + 1}. {f.q}</h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: muted }}>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ TERMS COMPONENT ============
function Terms({ lang, isDarkMode, onBack }) {
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: bg }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: cardBg, border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', color: text, fontSize: 14, fontWeight: 600, marginBottom: 32 }}>
        <Icons.ArrowLeft size={18} /> {lang === 'sw' ? 'Rudi' : 'Back'}
      </button>
      <div style={{ background: cardBg, borderRadius: 20, padding: '48px 32px', border: `1px solid ${border}` }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 800, color: text }}>{lang === 'sw' ? 'Masharti na Matumizi' : 'Terms and Conditions'}</h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: muted }}>{lang === 'sw' ? 'Yaliyosasishwa: 1 Julai 2026' : 'Last updated: July 1, 2026'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: text, marginBottom: 16 }}>1. {lang === 'sw' ? 'Utangulizi' : 'Introduction'}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: muted, margin: 0 }}>{lang === 'sw' ? 'Karibu kwenye KasiTrade. Masharti haya yanatawala matumizi yako ya mfumo wetu.' : 'Welcome to KasiTrade. These terms govern your use of our system.'}</p>
          </section>
          <section>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: text, marginBottom: 16 }}>2. {lang === 'sw' ? 'Huduma Zetu' : 'Our Services'}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: muted, margin: 0 }}>{lang === 'sw' ? 'KasiTrade inatoa mfumo wa kisasa wa POS.' : 'KasiTrade provides a modern POS system.'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

// ============ PRIVACY COMPONENT ============
function Privacy({ lang, isDarkMode, onBack }) {
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: bg }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: cardBg, border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', color: text, fontSize: 14, fontWeight: 600, marginBottom: 32 }}>
        <Icons.ArrowLeft size={18} /> {lang === 'sw' ? 'Rudi' : 'Back'}
      </button>
      <div style={{ background: cardBg, borderRadius: 20, padding: '48px 32px', border: `1px solid ${border}` }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 800, color: text }}>{lang === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy'}</h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: muted }}>{lang === 'sw' ? 'Yaliyosasishwa: 1 Julai 2026' : 'Last updated: July 1, 2026'}</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: muted }}>{lang === 'sw' ? 'KasiTrade inaheshimu faragha yako na inajitolea kulinda data yako binafsi.' : 'KasiTrade respects your privacy and is committed to protecting your personal data.'}</p>
      </div>
    </div>
  );
}

// ============ FOOTER COMPONENT ============
function Footer({ lang, isDarkMode, onNavigate }) {
  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, padding: '60px 20px 30px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', marginBottom: 20, cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('dashboard')}>KasiTrade</div>
          <p style={{ margin: 0, fontSize: 14, color: muted, lineHeight: 1.6 }}>{lang === 'sw' ? 'Mfumo bora zaidi wa POS.' : 'The ultimate POS system.'}</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: text, textTransform: 'uppercase', letterSpacing: 1 }}>PRODUCT</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['pos', 'products', 'reports', 'customers'].map(item => (
              <li key={item}><a href={`#${item}`} onClick={e => { e.preventDefault(); onNavigate && onNavigate(item); }} style={{ color: muted, textDecoration: 'none', fontSize: 14, cursor: 'pointer' }}>{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: text, textTransform: 'uppercase', letterSpacing: 1 }}>RESOURCES</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['help', 'terms', 'privacy', 'about'].map(item => (
              <li key={item}><a href={`#${item}`} onClick={e => { e.preventDefault(); onNavigate && onNavigate(item); }} style={{ color: muted, textDecoration: 'none', fontSize: 14, cursor: 'pointer' }}>{item}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: `1px solid ${border}`, textAlign: 'center', color: muted, fontSize: 13 }}>
        © {new Date().getFullYear()} KasiTrade. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}
      </div>
    </footer>
  );
}

// ============ DASHBOARD (MAIN APP) ============
function Dashboard({ session, supabase }) {
  const [currentShop, setCurrentShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'sw');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('shops').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        setShops(data || []);
        if (data && data.length > 0) setCurrentShop(data[0]);
      } catch (err) {
        console.error('Error fetching shops:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, supabase]);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('darkMode', isDarkMode); }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div>
        </div>
      </div>
    );
  }

  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  const viewTitles = {
    dashboard: 'Dashboard',
    pos: lang === 'sw' ? 'Mauzo' : 'Sales',
    products: lang === 'sw' ? 'Bidhaa' : 'Products',
    reports: lang === 'sw' ? 'Ripoti' : 'Reports',
    customers: lang === 'sw' ? 'Wateja' : 'Customers',
    settings: lang === 'sw' ? 'Mipangilio' : 'Settings',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, position: 'relative', overflow: 'hidden' }}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} lang={lang} isDarkMode={isDarkMode} session={session} onLogout={handleLogout} shops={shops} currentShop={currentShop} setCurrentShop={setCurrentShop} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ background: cardBg, borderBottom: `1px solid ${border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: bg, color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Menu size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: text, flex: 1 }}>{viewTitles[currentView] || 'Dashboard'}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')} style={{ padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color: text, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              {lang === 'sw' ? 'EN' : 'SW'}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ width: 36, height: 36, borderRadius: 8, background: bg, border: `1px solid ${border}`, color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDarkMode ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', width: '100%', maxWidth: '100%', padding: 16 }}>
          {currentView === 'pos' && <POS lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {currentView === 'products' && <Products lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {currentView === 'reports' && <Reports lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {currentView === 'customers' && <Customers lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} />}
          {currentView === 'settings' && <Settings lang={lang} supabase={supabase} currentShop={currentShop} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          {currentView === 'about' && <About lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'help' && <Help lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'terms' && <Terms lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'privacy' && <Privacy lang={lang} isDarkMode={isDarkMode} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'dashboard' && (
            <div style={{ textAlign: 'center', padding: 40, color: muted }}>
              <h2>{lang === 'sw' ? 'Karibu KasiTrade!' : 'Welcome to KasiTrade!'}</h2>
              <p>{lang === 'sw' ? 'Chagua kipengee kwenye menyu kuanza.' : 'Select a menu item to get started.'}</p>
            </div>
          )}
        </div>
        <Footer lang={lang} isDarkMode={isDarkMode} onNavigate={setCurrentView} />
      </div>
    </div>
  );
}

// ============ MAIN APP EXPORT ============
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: 'white', fontSize: 24, fontWeight: 600 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div>Inapakia...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth supabase={supabase} onAuthSuccess={() => window.location.reload()} />;
  }

  return <Dashboard session={session} supabase={supabase} />;
}