import React from 'react';
import { Icons } from './Icons';

const Footer = ({ lang, isDarkMode }) => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { label: lang === 'sw' ? 'Nyumbani' : 'Home', icon: Icons.Home },
    { label: lang === 'sw' ? 'Msaada' : 'Help', icon: Icons.Help },
    { label: lang === 'sw' ? 'Mawasiliano' : 'Contact', icon: Icons.Mail },
    { label: lang === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy', icon: Icons.Eye },
  ];

  const socials = [
    { icon: Icons.Globe, label: 'Website', color: '#6366f1' },
    { icon: Icons.Mail, label: 'Email', color: '#ec4899' },
    { icon: Icons.Phone, label: 'Phone', color: '#10b981' },
  ];

  return (
    <footer style={{
      background: isDarkMode ? '#1e293b' : '#ffffff',
      borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
      padding: '40px 0 20px',
      marginTop: '60px',
      transition: 'all 0.3s'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
            }}>
              <Icons.ShoppingCart size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.5px' }}>
                KasiTRADE
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                POS System
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
            {lang === 'sw' 
              ? 'Mfumo wa kisasa wa POS unaokuletea uzoefu bora wa biashara. Endesha duka lako kwa ufanisi zaidi.' 
              : 'Modern POS system bringing you the best business experience. Run your shop more efficiently.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {socials.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{
                  width: '36px', height: '36px',
                  background: `${s.color}15`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = `${s.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = `${s.color}15`; }}
                >
                  <Icon size={16} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'sw' ? 'Viungo vya Haraka' : 'Quick Links'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.map((link, i) => {
              const Icon = link.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <Icon size={14} /> {link.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'sw' ? 'Mawasiliano' : 'Contact'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
              <Icons.Mail size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>support@kasitrade.co.tz</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
              <Icons.Phone size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>+255 123 456 789</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
              <Icons.Globe size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>Dar es Salaam, Tanzania</span>
            </div>
          </div>
        </div>

        {/* Version & Status */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'sw' ? 'Hali ya Mfumo' : 'System Status'}
          </h4>
          <div style={{
            padding: '16px',
            background: isDarkMode ? '#0f172a' : '#f8fafc',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '8px', height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                {lang === 'sw' ? 'Mfumo Unafanya Kazi' : 'System Operational'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
              <div>{lang === 'sw' ? 'Toleo:' : 'Version:'} <strong style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>v1.0.0</strong></div>
              <div>{lang === 'sw' ? 'Uptime:' : 'Uptime:'} <strong style={{ color: '#10b981' }}>99.9%</strong></div>
              <div>{lang === 'sw' ? 'Mwisho wa kusasisha:' : 'Last update:'} <strong style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>June 2026</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 24px 0'
      }}>
        <div style={{ fontSize: '12px', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
          © {currentYear} KasiTRADE. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
          <span style={{ cursor: 'pointer' }}>{lang === 'sw' ? 'Masharti' : 'Terms'}</span>
          <span style={{ cursor: 'pointer' }}>{lang === 'sw' ? 'Faragha' : 'Privacy'}</span>
          <span style={{ cursor: 'pointer' }}>{lang === 'sw' ? 'Kuki' : 'Cookies'}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;