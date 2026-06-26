import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '✅' };
      case 'error': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '' };
      case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠️' };
      default: return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️' };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="toast-enter"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        padding: '14px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '90%',
        width: 'auto',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <span style={{ fontSize: '18px' }}>{colors.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          opacity: 0.6
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;