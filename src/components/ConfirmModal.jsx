import React from 'react';

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const icon = isDanger ? '🗑️' : '⚠️';
  const confirmText = isDanger ? 'Ndiyo, Futa' : 'Ndiyo, Endelea';
  const confirmColor = isDanger ? '#ef4444' : '#f59e0b';

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, animation: 'fadeIn 0.2s ease'
      }}
      onClick={onCancel}
    >
      <div 
        className="glass shadow-premium"
        style={{
          background: 'rgba(255,255,255,0.95)', padding: '24px', borderRadius: '16px',
          width: '90%', maxWidth: '400px', textAlign: 'center',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569',
              border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
            }}
          >
            Ghairi
          </button>
          <button 
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px', background: confirmColor, color: '#fff',
              border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;