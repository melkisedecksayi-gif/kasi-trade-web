import React from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';

const Help = ({ lang, theme }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang]?.help || translations.sw.help;

  const contactItems = [
    {
      icon: '👥',
      title: t.owners,
      text: 'Melicksedeki Zakaria Sayi & Abdallah Mshamu Nassoro',
      color: THEME.colors.primary
    },
    {
      icon: '📞',
      title: t.call,
      text: '+255 622 995 734 | +255 613 808 727',
      color: THEME.colors.success
    },
    {
      icon: '💬',
      title: t.whatsapp,
      text: '+255 613 334 713 | +255 656 448 727',
      color: '#25D366'
    },
    {
      icon: '📝',
      title: t.feedback,
      action: 'https://forms.gle/EoNjSm2NCHNh7ixD6',
      color: THEME.colors.warning
    }
  ];

  return (
    <div className="glass shadow-premium" style={{ padding: '30px', borderRadius: '16px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: `2px solid ${colors.border}` }}>
        <h2 style={{ margin: '0 0 12px', color: colors.text, fontSize: '28px' }}>{t.title}</h2>
        <p style={{ margin: 0, color: colors.textSec, fontSize: '15px' }}>
          {lang === 'sw' ? 'Tuko hapa kukusaidia. Wasiliana nasi kupitia njia zifuatazo.' : 'We are here to help. Contact us through the following channels.'}
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {contactItems.map((item, i) => (
          <div 
            key={i} 
            className="card-micro"
            style={{ 
              padding: '20px', 
              background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)', 
              borderRadius: '12px', 
              borderLeft: `4px solid ${item.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
              <h4 style={{ margin: 0, color: colors.text, fontSize: '16px', fontWeight: '600' }}>{item.title}</h4>
            </div>
            {item.action ? (
              <a 
                href={item.action} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  color: THEME.colors.primary, 
                  fontWeight: '600', 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {lang === 'sw' ? 'Fungua Fomu ya Maoni →' : 'Open Feedback Form →'}
              </a>
            ) : (
              <p style={{ margin: 0, color: colors.text, fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-word' }}>
                {item.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* About Section */}
      <div style={{ padding: '24px', background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)', borderRadius: '12px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px', color: colors.text, fontSize: '18px' }}>{t.aboutTitle}</h3>
        <p style={{ margin: 0, color: colors.textSec, lineHeight: '1.7', fontSize: '14px' }}>
          {t.aboutDesc}
        </p>
      </div>

      {/* Features List */}
      <div style={{ padding: '24px', background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)', borderRadius: '12px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: colors.text, fontSize: '18px' }}>{t.features}</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: colors.textSec, lineHeight: '1.8', fontSize: '14px' }}>
          {t.featuresList.map((feature, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: `1px solid ${colors.border}` }}>
        <p style={{ margin: 0, color: colors.textSec, fontSize: '13px' }}>
          © {new Date().getFullYear()} KasiTRADE. {t.copyright}
        </p>
        <p style={{ margin: '8px 0 0', color: colors.textSec, fontSize: '12px' }}>
          {lang === 'sw' ? 'Imetengenezwa kwa ❤️ Tanzania' : 'Made with ❤️ in Tanzania'}
        </p>
      </div>
    </div>
  );
};

export default Help;