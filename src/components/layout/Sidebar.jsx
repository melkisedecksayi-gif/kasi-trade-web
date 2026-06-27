import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons';

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, onToggle, isDarkMode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && !isSidebarOpen) {
        onToggle();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: Icons.Home, label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Mauzo' : 'Sales' },
    { id: 'products', icon: Icons.Box, label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: Icons.Users, label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: Icons.BarChart, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: Icons.Settings, label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  // Kwenye simu: drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            onClick={onToggle}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99,
              backdropFilter: 'blur(4px)'
            }}
          />
        )}
        
        {/* Sidebar Drawer */}
        <div style={{
          width: '260px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          height: '100vh',
          position: 'fixed',
          left: isSidebarOpen ? '0' : '-260px',
          top: 0,
          borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'left 0.3s ease',
          boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none'
        }}>
          <div style={{ 
            padding: '20px 16px', 
            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: '#ffffff',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                overflow: 'hidden'
              }}>
                <img src="/logo.png" alt="KasiTRADE" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>KasiTRADE</h2>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>POS System</p>
              </div>
            </div>
            <button 
              onClick={onToggle}
              style={{
                background: isDarkMode ? '#334155' : '#f1f5f9',
                border: 'none', width: '32px', height: '32px', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDarkMode ? '#f1f5f9' : '#475569'
              }}
            >
              <Icons.X size={16} />
            </button>
          </div>

          <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menuItems.map((item) => {
              const isActive = activePage === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActivePage(item.id); onToggle(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', border: 'none', borderRadius: '10px',
                    background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                    fontSize: '15px', fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'flex-start'
                  }}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '16px 12px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
            <button
              onClick={() => { setActivePage('settings'); onToggle(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', border: 'none', borderRadius: '10px',
                background: 'transparent', color: isDarkMode ? '#cbd5e1' : '#475569',
                fontSize: '15px', fontWeight: '500', cursor: 'pointer', justifyContent: 'flex-start'
              }}
            >
              <Icons.Help size={20} />
              <span>{lang === 'sw' ? 'Msaada' : 'Help'}</span>
            </button>
            <button
              onClick={onLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', border: 'none', borderRadius: '10px',
                background: 'transparent', color: '#ef4444',
                fontSize: '15px', fontWeight: '500', cursor: 'pointer', justifyContent: 'flex-start', marginTop: '4px'
              }}
            >
              <Icons.LogOut size={20} />
              <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  // Kwenye desktop: sidebar ya kawaida
  return (
    <div style={{
      width: isSidebarOpen ? '260px' : '72px',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      height: '100vh',
      position: 'fixed',
      left: 0, top: 0,
      borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 100, transition: 'width 0.3s ease'
    }}>
      <div style={{ 
        padding: '20px 16px', 
        borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#ffffff', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
            overflow: 'hidden'
          }}>
            <img src="/logo.png" alt="KasiTRADE" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {isSidebarOpen && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>KasiTRADE</h2>
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>POS System</p>
            </div>
          )}
        </div>
        <button 
          onClick={onToggle}
          style={{
            background: isSidebarOpen ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent',
            border: 'none', width: '32px', height: '32px', borderRadius: '8px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDarkMode ? '#f1f5f9' : '#475569', flexShrink: 0
          }}
        >
          {isSidebarOpen ? <Icons.X size={16} /> : <Icons.Menu size={16} />}
        </button>
      </div>

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
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: isSidebarOpen ? '12px 16px' : '12px',
                border: 'none', borderRadius: '10px',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                color: isActive ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                fontSize: '14px', fontWeight: isActive ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
            >
              <IconComponent size={18} />
              {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => setActivePage('settings')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
            padding: isSidebarOpen ? '12px 16px' : '12px',
            border: 'none', borderRadius: '10px',
            background: 'transparent', color: isDarkMode ? '#cbd5e1' : '#475569',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
          }}
        >
          <Icons.Help size={18} />
          {isSidebarOpen && <span>{lang === 'sw' ? 'Msaada' : 'Help'}</span>}
        </button>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
            padding: isSidebarOpen ? '12px 16px' : '12px',
            border: 'none', borderRadius: '10px',
            background: 'transparent', color: '#ef4444',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
          }}
        >
          <Icons.LogOut size={18} />
          {isSidebarOpen && <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;