import React, { useState, useEffect } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
import { translations } from '../translations';

const Dashboard = ({ session, supabase }) => {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('sw');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  const t = translations[lang] || translations.sw;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarOpen(window.innerWidth >= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ UPDATED: Fetch stats filtered by current user (Part E)
  useEffect(() => {
    const fetchStats = async () => {
      const userId = session?.user?.id;
      if (!userId || view !== 'dashboard') return;
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);
        const totalSales = salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
        const { data: productsData } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', userId);
        setStats({ totalSales, totalProducts: productsData?.length || 0 });
      } catch (err) {
        console.warn('Stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [view, supabase, session?.user?.id]);

  const handleLogout = async () => { try { await supabase.auth.signOut(); } catch(e) { console.error(e); } };

  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard },
    { id: 'products', label: t.nav.products },
    { id: 'sales', label: t.nav.sales },
    { id: 'reports', label: t.nav.reports },
    { id: 'help', label: t.nav.help },
    { id: 'account', label: t.nav.account },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />}
      
      <aside style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-260px', width: '260px', height: '100vh', background: '#0f172a', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column', transition: 'left 0.3s ease', zIndex: 999 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{t.appName}</h2>
          {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>}
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); if (isMobile) setSidebarOpen(false); }}
              style={{ background: view === item.id ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '14px 20px', textAlign: 'left', cursor: 'pointer', fontSize: '15px', fontWeight: view === item.id ? '700' : '400', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.nav.logout}</button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen ? '260px' : '0', flex: 1, padding: '20px', transition: 'margin-left 0.3s ease', minHeight: '100vh' }}>
        <header style={{ background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>}
            <h2 style={{ margin: 0, color: '#0f172a' }}>
              {view === 'dashboard' && t.dashboard.title}
              {view === 'products' && t.products.title}
              {view === 'sales' && t.sales.title}
              {view === 'reports' && t.reports.title}
              {view === 'help' && t.help.title}
              {view === 'account' && t.account.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setLang(l => l === 'sw' ? 'en' : 'sw')} style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'sw' ? '🇹 SW' : '🇸 EN'}</button>
            <div style={{ width: '35px', height: '35px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 10px' }}>{t.general.welcome}, {session?.user?.email?.split('@')[0] || 'Mtu'}! 👋</h2>
            <p style={{ color: '#64748b', margin: '0 0 20px' }}>{t.dashboard.subtitle}</p>
            {loading ? <p style={{color:'#64748b'}}>{t.dashboard.loadingStats}</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h4 style={{ margin: '0 0 5px', color: '#3b82f6' }}>{t.dashboard.salesToday}</h4>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.totalSales.toLocaleString()} TSh</p>
                </div>
                <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
                  <h4 style={{ margin: '0 0 5px', color: '#22c55e' }}>{t.dashboard.totalProducts}</h4>
                  <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.totalProducts}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'help' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>{t.help.title}</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ margin: '0 0 8px' }}>{t.help.owners}</h4>
                <p style={{ margin: 0 }}>Melickisedeki Zakaria Sayi & Abdallah Mshamu Nassoro</p>
              </div>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
                <h4 style={{ margin: '0 0 8px' }}>{t.help.call}</h4>
                <p style={{ margin: 0 }}>
                  <a href="tel:+255622995734" style={{ color: '#3b82f6', marginRight: '15px' }}>+255 622 995 734</a>
                  <a href="tel:+255613808727" style={{ color: '#3b82f6' }}>+255 613 808 727</a>
                </p>
              </div>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                <h4 style={{ margin: '0 0 8px' }}>{t.help.whatsapp}</h4>
                <p style={{ margin: 0 }}>
                  <a href="https://wa.me/255613334713" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', marginRight: '15px', fontWeight: '600' }}>+255 613 334 713</a>
                  <a href="https://wa.me/255656448727" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: '600' }}>+255 656 448 727</a>
                </p>
              </div>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ margin: '0 0 8px' }}>{t.help.feedback}</h4>
                <a href="https://forms.gle/EoNjSm2NCHNh7ixD6" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: '600' }}>{t.help.feedbackLink}</a>
              </div>
            </div>
            <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <h3 style={{ marginBottom: '10px' }}>{t.help.aboutTitle}</h3>
            <p style={{ lineHeight: '1.6', color: '#475569' }}>{t.help.aboutDesc}</p>
            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>{t.help.features}</h3>
            <ul style={{ paddingLeft: '20px', color: '#475569' }}>
              {t.help.featuresList.map((f, i) => <li key={i} style={{marginBottom:'5px'}}>{f}</li>)}
            </ul>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '25px', fontSize: '0.85rem' }}>© {new Date().getFullYear()} KasiTrade Web. {t.help.copyright}</p>
          </div>
        )}

        {view === 'account' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>{t.account.title}</h2>
            <div style={{ marginBottom: '25px' }}>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 5px', fontWeight: '600', color: '#64748b' }}>{t.account.email}</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{session?.user?.email || 'Haipatikani'}</p>
              </div>
              <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px', fontWeight: '600', color: '#64748b' }}>{t.account.userId}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>{session?.user?.id || 'N/A'}</p>
              </div>
            </div>
            <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <h3 style={{ marginBottom: '15px', color: '#0f172a' }}>{t.account.changePassword}</h3>
            <ChangePasswordForm supabase={supabase} lang={lang} />
          </div>
        )}

        {/* ✅ UPDATED: Pass userId to components (Part A) */}
        {view === 'products' && <Products supabase={supabase} lang={lang} userId={session?.user?.id} />}
        {view === 'sales' && <Sales supabase={supabase} lang={lang} userId={session?.user?.id} />}
        {view === 'reports' && <Reports supabase={supabase} lang={lang} userId={session?.user?.id} />}
      </div>
    </div>
  );
};

const ChangePasswordForm = ({ supabase, lang }) => {
  const t = translations[lang].account;
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (newPass !== confirm) return setErr(t.errorMatch);
    if (newPass.length < 6) return setErr(t.errorLength);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setMsg(t.success); setNewPass(''); setConfirm('');
    } catch (e) { setErr(t.errorUpdate + ' ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
      <input type="password" placeholder={t.newPassword} value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={6} disabled={loading} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      <input type="password" placeholder={t.confirmNewPassword} value={confirm} onChange={e=>setConfirm(e.target.value)} required disabled={loading} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
      <button type="submit" disabled={loading} style={{ padding: '12px', background: loading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px' }}>{loading ? t.updating : t.update}</button>
      {msg && <p style={{ color: '#16a34a', margin: 0, fontSize: '14px', background: '#f0fdf4', padding: '10px', borderRadius: '6px' }}>{msg}</p>}
      {err && <p style={{ color: '#dc2626', margin: 0, fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>{err}</p>}
    </form>
  );
};

export default Dashboard;