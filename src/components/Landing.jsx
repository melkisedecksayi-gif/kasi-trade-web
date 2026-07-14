import React from 'react';

const IconSvg = ({ children, color = '#6366f1' }) => (
  <div style={{
    width: '44px', height: '44px', borderRadius: '12px',
    background: `${color}15`, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  }}>
    {children}
  </div>
);

const Landing = ({ onGetStarted, lang = 'sw', setLang }) => {
  const isSw = lang === 'sw';

  const features = [
    { color: '#10b981', title: isSw ? 'Dhibiti Mauzo' : 'Manage Sales', desc: isSw ? 'Fuatilia mauzo yote, faida na hasara kila siku. Malipo kwa fedha, simu au kadi.' : 'Track all sales, profit and loss daily. Accept cash, mobile money or card payments.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> },
    { color: '#f59e0b', title: isSw ? 'Hesabu ya Bidhaa' : 'Stock Control', desc: isSw ? 'Jua hesabu yako muda wote. Pokea alert bidhaa zinapokaribia kuisha.' : 'Know your stock levels at all times. Get alerts when products run low.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/></svg> },
    { color: '#ec4899', title: isSw ? 'Wateja & Wauzaji' : 'Customers & Suppliers', desc: isSw ? 'Hifadhi taarifa za wateja na wauzaji wako. Jenga uhusiano bora wa kibiashara.' : 'Store customer and supplier info. Build better business relationships.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { color: '#6366f1', title: isSw ? 'Ripoti Kamili' : 'Full Reports', desc: isSw ? 'Pata ripoti za kina za mauzo, faida, matumizi na mwenendo wa biashara.' : 'Get detailed reports on sales, profit, expenses and business trends.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg> },
    { color: '#06b6d4', title: isSw ? 'Simu & Kompyuta' : 'Mobile & Desktop', desc: isSw ? 'Tumia kwenye simu, tablet au kompyuta. Data yako inalandana moja kwa moja.' : 'Use on phone, tablet or computer. Your data syncs automatically.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12" y1="18" y2="18.01"/></svg> },
    { color: '#8b5cf6', title: isSw ? 'Salama Kabisa' : 'Secure', desc: isSw ? 'Data yako iko salama. Wewe pekee ndiye unayeweza kuiona. Backup automatic.' : 'Your data is safe. Only you can access it. Automatic backups.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg> },
  ];

  const steps = [
    { num: '1', title: isSw ? 'Jisajili' : 'Sign Up', desc: isSw ? 'Fungua akaunti bure kwa sekunde chache.' : 'Open a free account in seconds.' },
    { num: '2', title: isSw ? 'Weka Bidhaa' : 'Add Products', desc: isSw ? 'Ingiza bidhaa zako na bei zake.' : 'Add your products and pricing.' },
    { num: '3', title: isSw ? 'Anza Kuuza' : 'Start Selling', desc: isSw ? 'Anza kurekodi mauzo na kufuatilia biashara.' : 'Start recording sales and tracking business.' },
  ];

  const bg = '#ffffff';
  const text = '#0f172a';
  const textSec = '#475569';
  const border = '#e2e8f0';
  const cardBg = '#f8fafc';
  const cardBorder = '#e2e8f0';
  const navBg = 'rgba(255,255,255,0.9)';

  return (
    <div style={{
      minHeight: '100vh', background: bg, color: text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: 'hidden'
    }}>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .landing-root { background: #0f172a !important; color: #f1f5f9 !important; }
          .landing-nav { background: rgba(15,23,42,0.9) !important; border-color: rgba(148,163,184,0.1) !important; }
          .landing-card { background: #1e293b !important; border-color: rgba(148,163,184,0.08) !important; }
          .landing-text-sec { color: #94a3b8 !important; }
          .landing-text-muted { color: #64748b !important; }
          .landing-hero-text { color: #94a3b8 !important; }
          .landing-footer { border-color: rgba(148,163,184,0.08) !important; color: #94a3b8 !important; }
          .landing-stat-card { background: rgba(30,41,59,0.8) !important; border-color: rgba(148,163,184,0.08) !important; }
          .landing-cta { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.15) !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="landing-nav" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', maxWidth: '1200px', margin: '0 auto',
        borderBottom: `1px solid ${border}`,
        background: navBg, position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/Logo.png" alt="KasiTRADE" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>KasiTRADE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => { const nl = isSw ? 'en' : 'sw'; setLang?.(nl); localStorage.setItem('app_lang', nl); }}
            style={{
              padding: '8px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer', fontSize: '22px',
              lineHeight: 1
            }}>
            {isSw ? '🇬🇧' : '🇹🇿'}
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: '10px 24px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer'
            }}>
            {isSw ? 'Ingia / Jisajili' : 'Login / Sign Up'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 50px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(99,102,241,0.08)', padding: '6px 16px',
          borderRadius: '20px', marginBottom: '24px', fontSize: '13px', color: '#6366f1', fontWeight: '600'
        }}>
          {isSw ? 'Mfumo wa POS kwa Biashara Yako' : 'POS System for Your Business'}
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 50px)', fontWeight: '800', lineHeight: 1.15,
          margin: '0 0 16px', letterSpacing: '-1px'
        }}>
          {isSw ? 'Dhibiti Biashara Yako' : 'Take Control of'}<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isSw ? 'Kwa Urahisi Kabisa' : 'Your Business'}
          </span>
        </h1>

        <p className="landing-hero-text" style={{
          fontSize: '16px', color: textSec, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.7
        }}>
          {isSw
            ? 'KasiTRADE ni mfumo kamili wa uendeshaji biashara unaokuwezesha kudhibiti mauzo, bidhaa, wateja, matumizi na ripoti zote sehemu moja. Rahisi, salama, na inafanya kazi popote.'
            : 'KasiTRADE is a complete business management system that lets you control sales, products, customers, expenses and reports all in one place. Simple, secure, and works everywhere.'
          }
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '14px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: '700', fontSize: '15px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
            }}>
            {isSw ? 'Anza Bure Sasa' : 'Start Free Now'} <span style={{ marginLeft: '4px' }}>&rarr;</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('landing-features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '14px 32px', borderRadius: '14px', border: `1px solid ${border}`,
              background: 'transparent', color: textSec,
              fontWeight: '600', fontSize: '15px', cursor: 'pointer'
            }}>
            {isSw ? 'Jifunze Zaidi' : 'Learn More'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div id="landing-features" style={{
        maxWidth: '900px', margin: '0 auto', padding: '0 24px 60px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '14px', textAlign: 'center'
      }}>
        {[
          { v: '10+', l: isSw ? 'Watumiaji' : 'Users' },
          { v: '3', l: isSw ? 'Hatua Rahisi' : 'Simple Steps' },
          { v: '24/7', l: isSw ? 'Online' : 'Online' },
          { v: '100%', l: isSw ? 'Salama' : 'Secure' },
        ].map((s, i) => (
          <div key={i} className="landing-stat-card" style={{
            padding: '22px 14px', borderRadius: '14px',
            background: cardBg, border: `1px solid ${cardBorder}`
          }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', marginBottom: '4px' }}>{s.v}</div>
            <div className="landing-text-sec" style={{ fontSize: '12px', color: textSec }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: '800', marginBottom: '36px' }}>
          {isSw ? 'Kila Kitu Unachohitaji' : 'Everything You Need'}
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px'
        }}>
          {features.map((f, i) => (
            <div key={i} className="landing-card" style={{
              padding: '28px', borderRadius: '16px',
              background: cardBg, border: `1px solid ${cardBorder}`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <IconSvg color={f.color}>{f.icon}</IconSvg>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '16px 0 6px' }}>{f.title}</h3>
              <p className="landing-text-sec" style={{ fontSize: '13px', color: textSec, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        maxWidth: '1000px', margin: '0 auto', padding: '0 24px 60px', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '36px' }}>
          {isSw ? 'Jinsi Inavyofanya Kazi' : 'How It Works'}
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px'
        }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontWeight: '800', fontSize: '22px', color: '#fff',
                boxShadow: '0 4px 16px rgba(99,102,241,0.25)'
              }}>
                {s.num}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>{s.title}</h3>
              <p className="landing-text-sec" style={{ fontSize: '13px', color: textSec, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <div className="landing-cta" style={{
          maxWidth: '700px', margin: '0 auto', padding: '48px 24px',
          borderRadius: '24px', background: 'rgba(99,102,241,0.04)',
          border: '1px solid rgba(99,102,241,0.12)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px' }}>
            {isSw ? 'Tayari Kuanza?' : 'Ready to Start?'}
          </h2>
          <p className="landing-text-sec" style={{ fontSize: '14px', color: textSec, margin: '0 0 28px' }}>
            {isSw ? 'Jiunge na mamia ya wafanyabiashara wanaotumia KasiTRADE kukuza biashara zao.' : 'Join hundreds of business owners using KasiTRADE to grow their businesses.'}
          </p>
          <button
            onClick={onGetStarted}
            style={{
              padding: '16px 40px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: '700', fontSize: '16px', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(99,102,241,0.35)'
            }}>
            {isSw ? 'Fungua Akaunti Bure' : 'Create Free Account'} <span style={{ marginLeft: '4px' }}>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer" style={{
        borderTop: `1px solid ${border}`,
        padding: '24px', textAlign: 'center',
        fontSize: '12px', color: '#64748b'
      }}>
        KasiTRADE &copy; {new Date().getFullYear()} &middot; {isSw ? 'Tanzania' : 'Tanzania'} &middot; +255 622 995 734
      </footer>
    </div>
  );
};

export default Landing;
