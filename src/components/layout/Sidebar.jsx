import React from 'react';

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, onToggle, isDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: '', label: lang === 'sw' ? 'Mauzo' : 'Sales' },
    { id: 'products', icon: '📦', label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: '', label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: '📊', label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: '⚙️', label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  return (
    <div style={{
      width: isSidebarOpen ? '260px' : '72px',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.3s ease'
    }}>
      {/* HEADER - Logo na Close Button */}
      <div style={{ 
        padding: '20px 16px', 
        borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          {/* ✅ LOGO HALISI YA KASITRADE */}
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            {/* Badilisha hii na logo yako */}
            <img 
              src="/logo.png" 
              alt="KasiTRADE" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
          </div>
          
          {isSidebarOpen && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.5px' }}>
                KasiTRADE
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                POS System
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button 
          onClick={onToggle}
          style={{
            background: isSidebarOpen ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDarkMode ? '#f1f5f9' : '#475569',
            flexShrink: 0,
            transition: 'all 0.2s',
            fontSize: '18px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#475569' : '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = isSidebarOpen ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent'}
          title={isSidebarOpen ? 'Funga Sidebar' : 'Fungua Sidebar'}
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* MENU ITEMS */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={!isSidebarOpen ? item.label : ''}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: isSidebarOpen ? '12px 16px' : '12px',
                border: 'none',
                borderRadius: '10px',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                color: isActive ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = isDarkMode ? '#334155' : '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM - Help & Logout */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => setActivePage('settings')}
          title={!isSidebarOpen ? 'Msaada' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: isSidebarOpen ? '12px 16px' : '12px',
            border: 'none',
            borderRadius: '10px',
            background: 'transparent',
            color: isDarkMode ? '#cbd5e1' : '#475569',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>❓</span>
          {isSidebarOpen && <span>Msaada</span>}
        </button>

        <button
          onClick={onLogout}
          title={!isSidebarOpen ? 'Logout' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: isSidebarOpen ? '12px 16px' : '12px',
            border: 'none',
            borderRadius: '10px',
            background: 'transparent',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#450a0a' : '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>🚪</span>
          {isSidebarOpen && <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;