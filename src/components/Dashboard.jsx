import React, { useState, useEffect } from 'react';
import Products from './Products';
import Sales from './Sales';
import Reports from './Reports';
// eslint-disable-next-line no-unused-vars
import { translations } from '../translations';

const Dashboard = ({ session, supabase }) => {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('sw');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0 });
  
  const t = translations?.[lang] || {
    appName: 'KasiTrade Web',
    dashboard: '📊 Dashboard',
    products: '📦 Bidhaa',
    sales: '🛒 Mauzo',
    reports: '📈 Ripoti',
    help: '❓ Msaada',
    logout: '🚪 Toka',
    welcome: lang === 'sw' ? 'Karibu' : 'Welcome',
  };

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: salesData } = await supabase.from('sales').select('total_amount').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`);
      const totalSales = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const { data: productsData } = await supabase.from('products').select('id');
      const totalProducts = productsData?.length || 0;
      setStats({ totalSales, totalProducts });
    };
    if (view === 'dashboard') fetchStats();
  }, [view, supabase]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => await supabase.auth.signOut();

  const navItems = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'products', label: t.products },
    { id: 'sales', label: t.sales },
    { id: 'reports', label: t.reports },
    { id: 'help', label: t.help },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />}
      
      <aside style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-280px', width: '260px', height: '100vh', background: '#1e293b', color: '#fff', transition: 'left 0.3s ease', zIndex: 999, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{t.appName}</h2>
          {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}>✕</button>}
        </div>
        <nav style={{ flex: 1, marginTop: '10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setView(item.id); if (isMobile) setSidebarOpen(false); }} style={{ padding: '12px 20px', cursor: 'pointer', background: view === item.id ? '#334155' : 'transparent', borderLeft: view === item.id ? '4px solid #3b82f6' : '4px solid transparent', color: view === item.id ? '#fff' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '14px' }}>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '15px 20px', borderTop: '1px solid #334155' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{t.logout}</button>
        </div>
      </aside>

      <div style={{ marginLeft: (!isMobile && sidebarOpen) ? '260px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px', color: '#334155' }}>☰</button>}
            <h3 style={{ margin: 0, color: '#334155', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '600' }}>
              {view === 'dashboard' && 'Dashboard'}
              {view === 'products' && t.products}
              {view === 'sales' && t.sales}
              {view === 'reports' && t.reports}
              {view === 'help' && (lang === 'sw' ? 'Msaada & Kuhusu' : 'Help & About')}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')} style={{ padding: '6px 10px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>{lang === 'sw' ? '🇹 SW' : '🇸 EN'}</button>
            <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{session?.user?.email?.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main style={{ padding: isMobile ? '10px' : '20px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box', flex: 1 }}>
          {view === 'dashboard' && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: '#1e293b', fontSize: isMobile ? '1.2rem' : '1.5rem', marginBottom: '10px' }}>{t.welcome}, {session?.user?.email?.split('@')[0]}! 👋</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>{lang === 'sw' ? 'Karibu kwenye mfumo wa KasiTrade Web. Chagua kitu kwenye menu kuanza.' : 'Welcome to KasiTrade Web. Select an item from the menu to start.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}><h4 style={{ margin: '0 0 5px', color: '#3b82f6', fontSize: '0.9rem' }}>Mauzo Leo</h4><p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalSales.toLocaleString()} TSh</p></div>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}><h4 style={{ margin: '0 0 5px', color: '#22c55e', fontSize: '0.9rem' }}>Bidhaa Zote</h4><p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalProducts}</p></div>
              </div>
            </div>
          )}

          {view === 'help' && (
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', maxWidth: '650px', margin: '0 auto' }}>
              <h2 style={{ color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>ℹ️ {lang === 'sw' ? 'Kuhusu KasiTrade Web' : 'About KasiTrade Web'}</h2>
              <div style={{ lineHeight: '1.8', color: '#334155', fontSize: '0.95rem' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>KasiTrade Web POS</p>
                <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '0.9rem' }}>Version 1.0.0 (Beta)</p>
                
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600' }}>{lang === 'sw' ? '👥 Wamiliki na Watengenezaji:' : '👥 Owners & Developers:'}</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>• Melickisedeki Zakaria Sayi</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>• Abdallah Mshamu Nassoro</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600' }}>📧 {lang === 'sw' ? 'Msaada wa Kiufundi:' : 'Technical Support:'}</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>
                    <a href="mailto:melkisedecksayi@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '8px' }}>melkisedecksayi@gmail.com</a>
                    <a href="mailto:mshamltd@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>mshamltd@gmail.com</a>
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600' }}>📞 {lang === 'sw' ? 'Nambari za Kupiga:' : 'Call Numbers:'}</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>
                    <a href="tel:+255622995734" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '8px' }}>+255 622 995 734</a>
                    <a href="tel:+255613808727" style={{ color: '#3b82f6', textDecoration: 'none' }}>+255 613 808 727</a>
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600' }}>💬 {lang === 'sw' ? 'Nambari za WhatsApp:' : 'WhatsApp Numbers:'}</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>
                    <a href="https://wa.me/255613334713" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', marginRight: '8px', fontWeight: '500' }}>+255 613 334 713</a>
                    <a href="https://wa.me/255656448727" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: '500' }}>+255 656 448 727</a>
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600' }}>📝 {lang === 'sw' ? 'Tuma Maoni yako:' : 'Send Feedback:'}</p>
                  <p style={{ margin: '2px 0', paddingLeft: '4px' }}>
                    <a href="https://forms.gle/EoNjSm2NCHNh7ixD6" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>
                      {lang === 'sw' ? 'Fomu ya Maoni (Google Form)' : 'Feedback Form (Google Form)'} →
                    </a>
                  </p>
                </div>
                
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                
                <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#0f172a' }}>{lang === 'sw' ? '📌 KasiTrade Web ni nini?' : '📌 What is KasiTrade Web?'}</p>
                  <p style={{ margin: 0, lineHeight: '1.6' }}>{lang === 'sw' ? 'KasiTrade Web ni mfumo wa kisasa wa Point of Sale (POS) uliotengenezwa kusaidia wajasiriamu na maduka madogo kufuatilia biashara zao kwa urahisi. Mfumo huu unakuwezesha kuongeza bidhaa, kuuza kwa kutumia barcode scanner, kupata risiti za kipekee, na kuona ripoti za mauzo na faida kwa wakati halisi. Data zote zimehifadhiwa salama kwenye Supabase Cloud, na unaweza kufikia mfumo wako kutoka kwenye simu, tablet, au kompyuta yoyote yenye mtandao.' : 'KasiTrade Web is a modern Point of Sale (POS) system designed to help small businesses and entrepreneurs manage their operations with ease. This system enables you to add products, process sales using barcode scanners, generate unique receipts, and view real-time sales and profit reports. All data is securely stored on Supabase Cloud, and you can access your system from any internet-connected phone, tablet, or computer.'}</p>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '16px' }}>
                  <p style={{ margin: '4px 0' }}><strong>{lang === 'sw' ? 'Vipengele Vikuu:' : 'Key Features:'}</strong></p>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                    <li>{lang === 'sw' ? '✅ Usajili na kuingia kwa usalama' : '✅ Secure registration & login'}</li>
                    <li>{lang === 'sw' ? '✅ Usimamizi wa bidhaa na barcode' : '✅ Product management with barcode'}</li>
                    <li>{lang === 'sw' ? '✅ Mauzo ya haraka (POS) na risiti' : '✅ Fast POS sales with receipts'}</li>
                    <li>{lang === 'sw' ? '✅ Ripoti za mauzo na faida' : '✅ Sales & profit reports'}</li>
                    <li>{lang === 'sw' ? '✅ Lugha mbili: Kiswahili na Kiingereza' : '✅ Bilingual: Swahili & English'}</li>
                    <li>{lang === 'sw' ? '✅ Inafanya kazi kwenye simu na kompyuta' : '✅ Works on mobile & desktop'}</li>
                  </ul>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '20px', textAlign: 'center' }}>© {new Date().getFullYear()} KasiTrade Web. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}</p>
              </div>
            </div>
          )}

          {view === 'products' && <Products supabase={supabase} lang={lang} t={translations[lang]} />}
          {view === 'sales' && <Sales supabase={supabase} lang={lang} t={translations[lang]} />}
          {view === 'reports' && <Reports supabase={supabase} lang={lang} t={translations[lang]} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;