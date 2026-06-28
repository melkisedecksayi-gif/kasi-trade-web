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
    if (setIsSidebarOpen) setIsSidebarOpen(false);
  };

  const handleMenuClick = (pageId) => {
    if (setActivePage) setActivePage(pageId);
    closeSidebar();
  };

  const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDarkMode ? '#cbd5e1' : '#475569';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <>
      {isSidebarOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 998,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
      
      <div 
        style={{
          width: '260px',
          background: bgColor,
          height: '100vh',
          position: 'fixed',
          left: isSidebarOpen ? '0' : '-260px',
          top: 0,
          zIndex: 999,
          transition: 'left 0.3s ease-in-out',
          boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${borderColor}`,
          overflowY: 'auto'
        }}
      >
        <div style={{ 
          padding: '20px 16px', 
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '800', fontSize: '20px'
            }}>
              K
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>
                KasiTRADE
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: subTextColor, fontWeight: '600', textTransform: 'uppercase' }}>
                POS System
              </p>
            </div>
          </div>
          
          <button 
            onClick={closeSidebar}
            style={{
              background: isDarkMode ? '#334155' : '#f1f5f9',
              border: 'none', 
              width: '36px', height: '36px', 
              borderRadius: '8px',
              cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textColor
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Array.isArray(menuItems) && menuItems.map((item) => {
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
                  color: isActive ? '#ffffff' : subTextColor,
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  justifyContent: 'flex-start',
                  textAlign: 'left'
                }}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ 
          padding: '16px 12px', 
          borderTop: `1px solid ${borderColor}`, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          flexShrink: 0
        }}>
          <button
            onClick={() => { if (onLogout) onLogout(); closeSidebar(); }}
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
              textAlign: 'left'
            }}
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