import React from 'react';

// --- SVG ICONS ---
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  POS: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  Products: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Customers: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Reports: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Menu: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', icon: Icons.Dashboard, label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: Icons.POS, label: lang === 'sw' ? 'Mauzo' : 'Sales' },
    { id: 'products', icon: Icons.Products, label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: Icons.Customers, label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: Icons.Reports, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: Icons.Settings, label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  return (
    <div style={{
      width: isSidebarOpen ? '260px' : '72px',
      background: '#ffffff',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.04)' : 'none'
    }}>
      
      {/* ✅ HEADER: Ikifungwa = Button tu, Ikifunguka = Logo + Button */}
      <div style={{ 
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isSidebarOpen ? 'space-between' : 'center',
        padding: isSidebarOpen ? '0 20px' : '0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        {/* Logo Group - Inaonekana tu sidebar ikifunguka */}
        {isSidebarOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              flexShrink: 0
            }}>
              <Icons.Dashboard />
            </div>
            
            <div style={{ whiteSpace: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                KasiTRADE
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                POS System
              </p>
            </div>
          </div>
        )}

        {/* ✅ TOGGLE BUTTON: Inaonekana KILA WAKATI (ikifunguka au ikifungwa) */}
        <button 
          onClick={onToggle}
          style={{
            background: isSidebarOpen ? '#f8fafc' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: isSidebarOpen ? '1px solid #e2e8f0' : 'none',
            width: isSidebarOpen ? '32px' : '44px',
            height: isSidebarOpen ? '32px' : '44px',
            borderRadius: isSidebarOpen ? '8px' : '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSidebarOpen ? '#475569' : '#ffffff',
            flexShrink: 0,
            transition: 'all 0.3s',
            boxShadow: !isSidebarOpen ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => { 
            if (isSidebarOpen) {
              e.currentTarget.style.background = '#f1f5f9';
            } else {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => { 
            if (isSidebarOpen) {
              e.currentTarget.style.background = '#f8fafc';
            } else {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={isSidebarOpen ? 'Funga Sidebar' : 'Fungua Sidebar'}
        >
          {isSidebarOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      {/* MENU ITEMS */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          const IconComponent = item.icon;
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
                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: isActive ? '#6366f1' : '#475569',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <IconComponent />
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #f1f5f9' }}>
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
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Icons.Logout />
          {isSidebarOpen && <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;