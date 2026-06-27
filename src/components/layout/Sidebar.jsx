import React from 'react';

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, onToggle, onHelpClick }) => {
  const menuItems = [
    { id: 'dashboard', icon: '🏪', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: '🛒', label: lang === 'sw' ? 'Mauzo (POS)' : 'Sales (POS)' },
    { id: 'products', icon: '📦', label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: '', label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: '📈', label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: '⚙️', label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div style={{
      width: isSidebarOpen ? '280px' : '80px',
      background: '#ffffff',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
      zIndex: 100,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      
      {/* ================= HEADER (Logo + Close Button) ================= */}
      <div style={{ 
        padding: '0 20px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isSidebarOpen ? 'space-between' : 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
          {/* Logo Icon (Purple Box) */}
          <div style={{
            minWidth: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #7c5cbf 0%, #6d5bba 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(124, 92, 191, 0.3)'
          }}>
            🏪
          </div>
          
          {isSidebarOpen && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>
                KasiTRADE
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                POS System
              </p>
            </div>
          )}
        </div>

        {/* Close Button (Blue Square) */}
        {isSidebarOpen && (
          <button 
            onClick={onToggle} 
            style={{ 
              background: '#3b82f6', 
              border: 'none', 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ⬅️
          </button>
        )}
      </div>

      {/* ================= MENU ITEMS ================= */}
      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                gap: '16px',
                padding: '16px 20px',
                border: 'none',
                borderRadius: '16px', // Rounded corners like in image
                background: isActive ? 'linear-gradient(135deg, #7c5cbf 0%, #6d5bba 100%)' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '16px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                boxShadow: isActive ? '0 4px 12px rgba(124, 92, 191, 0.25)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '22px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ================= BOTTOM ACTIONS (Help & Logout) ================= */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Help Button */}
        <button
          onClick={onHelpClick}
          title={!isSidebarOpen ? (lang === 'sw' ? 'Msaada' : 'Help') : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 20px',
            border: 'none',
            borderRadius: '16px',
            background: '#f0f9ff',
            color: '#0284c7',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2fe'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f0f9ff'}
        >
          <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>❓</span>
          {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{lang === 'sw' ? 'Msaada' : 'Help'}</span>}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={!isSidebarOpen ? (lang === 'sw' ? 'Toka' : 'Logout') : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 20px',
            border: '1px solid #fee2e2',
            borderRadius: '16px',
            background: '#fef2f2',
            color: '#ef4444',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
        >
          <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}></span>
          {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{lang === 'sw' ? 'Toka' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;