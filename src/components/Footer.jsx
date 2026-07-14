import React from 'react';
import { Icons } from './Icons';

const Footer = ({ lang = 'sw', isDarkMode = false, setActivePage, theme }) => {
  const isSw = lang === 'sw';
  const t = theme || {};
  const textColor = t.textSecondary || (isDarkMode ? '#94a3b8' : '#475569');
  const headingColor = t.text || (isDarkMode ? '#f1f5f9' : '#0f172a');
  const borderColor = isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(0,0,0,0.06)';
  const bgColor = isDarkMode ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)';

  const handlePage = (page) => {
    if (setActivePage) setActivePage(page);
  };

  return (
    <div style={{ padding: '0 12px', marginTop: '40px', marginBottom: '12px' }}>
      <div style={{
        maxWidth: '1000px', margin: '0 auto',
        background: bgColor, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${borderColor}`, borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          {/* Brand */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <img src="/Logo.png" alt="" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: headingColor }}>KasiTRADE</span>
              <span style={{ fontSize: '10px', color: isDarkMode ? '#64748b' : '#94a3b8', marginLeft: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>v2.0</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap" style={{ gap: '4px' }}>
            {[
              { page: 'about', label: isSw ? 'Kuhusu Sisi' : 'About Us' },
              { page: 'privacy', label: isSw ? 'Sera ya Faragha' : 'Privacy' },
              { page: 'terms', label: isSw ? 'Masharti' : 'Terms' },
            ].map(link => (
              <button key={link.page} onClick={() => handlePage(link.page)}
                className="btn-ghost btn-sm"
                style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', border: 'none' }}>
                {link.label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div className="flex items-center" style={{ gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: textColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icons.Phone size={12} color="#6366f1" /> +255 622 995 734
            </span>
            <span style={{ fontSize: '12px', color: textColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icons.Mail size={12} color="#6366f1" /> info@kasitrade.co.tz
            </span>
          </div>
        </div>

        {/* Social Media */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {[
            { name: 'Instagram', url: 'https://instagram.com/kasi_trade', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
            { name: 'Facebook', url: 'https://facebook.com/kasitrade', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
            { name: 'Twitter/X', url: 'https://x.com/kasitrade', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l6 8-6 8h2l5-6.5L16 20h4l-6.5-9L19 4h-2l-4.5 6L9 4z"/></svg> },
          ].map((social, i) => (
            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer"
              title={social.name}
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: textColor, transition: 'all 0.2s ease',
                border: `1px solid ${borderColor}`
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.color = textColor; e.currentTarget.style.borderColor = borderColor; }}
            >
              {social.icon}
            </a>
          ))}
        </div>

        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: isDarkMode ? '#475569' : '#94a3b8' }}>
            &copy; {new Date().getFullYear()} KasiTRADE &middot; {isSw ? 'Haki zote zimehifadhiwa' : 'All rights reserved'} &middot; {isSw ? 'Tanzania' : 'Tanzania'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
