import React from 'react';

const Footer = ({ lang = 'sw', isDarkMode = false }) => {
  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <footer style={{
      background: bgColor,
      padding: '24px',
      borderTop: `1px solid ${borderColor}`,
      marginTop: '40px',
      textAlign: 'center'
    }}>
      <div style={{ color: textColor, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
        KasiTRADE POS System
      </div>
      <div style={{ color: subTextColor, fontSize: '12px' }}>
        © {new Date().getFullYear()} {lang === 'sw' ? 'Haki zote zimehifadhiwa' : 'All rights reserved'}
      </div>
    </footer>
  );
};

export default Footer;