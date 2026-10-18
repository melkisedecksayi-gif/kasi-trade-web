import React from 'react';
import Billing from './Billing';
import { THEME } from '../theme';

const Paywall = ({ subState, lang, theme, userRole, onPaid, onLogout }) => {
  const isDark = theme === 'dark';
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', padding: isDark ? '24px 20px' : '32px 24px', background: isDark ? '#1e293b' : '#ffffff', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ margin: '0 0 8px', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '22px' }}>
            {lang === 'sw' ? 'Jaribio lako limeisha' : 'Your trial has ended'}
          </h2>
          <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
            {lang === 'sw'
              ? 'KasiTrade PRO inakupa mfumo bila kikomo. Lipa kwa M-Pesa ili kuendelea kutumia duka lako.'
              : 'KasiTrade PRO gives you unlimited access. Pay via M-Pesa to keep running your shop.'}
          </p>
        </div>

        <Billing subState={subState} lang={lang} theme={theme} isMobile={false} userRole={userRole} onPaid={onPaid} />

        <button onClick={onLogout} className="btn-micro" style={{ padding: '12px', background: 'transparent', color: isDark ? '#94a3b8' : '#64748b', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: THEME.radius?.md || '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
          🚪 {lang === 'sw' ? 'Toka' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default Paywall;
