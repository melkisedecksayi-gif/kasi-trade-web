import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <div style={{
      position: 'fixed',
      top: '30px',
      right: '30px',
      background: bgColor,
      color: '#fff',
      padding: '14px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      zIndex: 2000,
      fontSize: '14px',
      fontWeight: '600'
    }}>
      {message}
    </div>
  );
};

export default Toast;