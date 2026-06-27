import React from 'react';

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, onToggle, onHelpClick }) => {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: '🛒', label: lang === 'sw' ? 'Mauzo (POS)' : 'Sales (POS)' },
    { id: 'products', icon: '📦', label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: '👥', label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: '📈', label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: '⚙️', label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div style={{
      width: isSidebarOpen ? '260px' : '80px',
      background: '#ffffff',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
      zIndex: 100,
      transition: 'width 0.3s ease' // ✅ Smooth animation
    }}>
      {/* Logo Area */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            minWidth: '40px', height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>🏪</div>
          {isSidebarOpen && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>KasiTRADE</h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>POS System</p>
            </div>
          )}
        </div>
        {isSidebarOpen && (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>
            ⬅️
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            title={!isSidebarOpen ? item.label : ''} // ✅ Tooltip when closed
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              marginBottom: '4px',
              border: 'none',
              borderRadius: '10px',
              background: activePage === item.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activePage === item.id ? '#ffffff' : '#475569',
              fontSize: '14px',
              fontWeight: activePage === item.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
            {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Help Button */}
      <div style={{ padding: '0 12px', marginBottom: '12px' }}>
        <button
          onClick={onHelpClick}
          title={!isSidebarOpen ? (lang === 'sw' ? 'Msaada' : 'Help') : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '10px',
            background: '#f0f9ff',
            color: '#0284c7',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
          }}
        >
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>❓</span>
          {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{lang === 'sw' ? 'Msaada' : 'Help'}</span>}
        </button>
      </div>

      {/* Logout Button */}
      <div style={{ padding: '0 12px' }}>
        <button
          onClick={handleLogout}
          title={!isSidebarOpen ? (lang === 'sw' ? 'Toka' : 'Logout') : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: '1px solid #fee2e2',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
          }}
        >
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}></span>
          {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{lang === 'sw' ? 'Toka' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;