import React, { useEffect, useState } from 'react';
import { THEME } from '../theme';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: '#16a34a', text: '#fff', icon: '✅' },
    error: { bg: '#dc2626', text: '#fff', icon: '❌' },
    warning: { bg: '#d97706', text: '#fff', icon: '⚠️' },
    info: { bg: '#3b82f6', text: '#fff', icon: 'ℹ️' }
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      background: c.bg, color: c.text, padding: `${THEME.space.m} ${THEME.space.l}`,
      borderRadius: THEME.radius.md, boxShadow: THEME.shadow.lg,
      display: 'flex', alignItems: 'center', gap: THEME.space.m,
      minWidth: '280px', maxWidth: '400px',
      animation: visible ? 'toastIn 0.3s ease forwards' : 'toastOut 0.3s ease forwards',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: '500'
    }}>
      <span style={{ fontSize: '18px' }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} style={{
        background: 'none', border: 'none', color: c.text, fontSize: '18px', cursor: 'pointer', padding: '4px', opacity: 0.8
      }}>✕</button>
    </div>
  );
};

// Add toast animations to document
if (typeof document !== 'undefined' && !document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.innerHTML = `
    @keyframes toastIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100px); } }
  `;
  document.head.appendChild(style);
}

export default Toast;