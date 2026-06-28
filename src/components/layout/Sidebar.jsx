import React from 'react';
import { Icons } from '../Icons';

const Sidebar = ({ supabase, onLogout, activePage, setActivePage, lang, isSidebarOpen, setIsSidebarOpen, isDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', icon: Icons.Home, label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Mauzo' : 'Sales' },
    { id: 'products', icon: Icons.Box, label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: Icons.Users, label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: Icons.BarChart, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'settings', icon: Icons.Settings, label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
  ];

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleMenuClick = (pageId) => {
    setActivePage(pageId);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Overlay - Inafunga sidebar unapobofya */}
      {isSidebarOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 998,
            backdropFilter: 'blur(4px)',
            cursor: 'pointer'
          }}
        />
      )}
      
      {/* Sidebar Container */}
      <div 
        style={{
          width: '260px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          height: '100vh',
          position: 'fixed',
          left: isSidebarOpen ? '0' : '-260px',
          top: 0,
          zIndex: 999,
          transition: 'left 0.3s ease-in-out',
          boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 16px', 
          borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', 
              height: '44px',
              background: '#ffffff',
              borderRadius: '12px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
              overflow: 'hidden'
            }}>
              <img 
                src="/logo.png" 
                alt="KasiTRADE" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '800', 
                color: isDarkMode ? '#f1f5f9' : '#0f172a' 
              }}>
                KasiTRADE
              </h2>
              <p style={{ 
                margin: '2px 0 0', 
                fontSize: '10px', 
                color: isDarkMode ? '#94a3b8' : '#64748b', 
                fontWeight: '600', 
                textTransform: 'uppercase' 
              }}>
                POS System
              </p>
            </div>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={closeSidebar}
            style={{
              background: isDarkMode ? '#334155' : '#f1f5f9',
              border: 'none', 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: isDarkMode ? '#f1f5f9' : '#475569',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#475569' : '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ 
          flex: 1, 
          padding: '16px 12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px' 
        }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  justifyContent: 'flex-start',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDarkMode ? '#334155' : '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ 
          padding: '16px 12px', 
          borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          flexShrink: 0
        }}>
          <button
            onClick={() => handleMenuClick('settings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              border: 'none',
              borderRadius: '10px',
              background: 'transparent',
              color: isDarkMode ? '#cbd5e1' : '#475569',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icons.Help size={20} />
            <span>{lang === 'sw' ? 'Msaada' : 'Help'}</span>
          </button>
          
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              border: 'none',
              borderRadius: '10px',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              justifyContent: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#450a0a' : '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icons.LogOut size={20} />
            <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;