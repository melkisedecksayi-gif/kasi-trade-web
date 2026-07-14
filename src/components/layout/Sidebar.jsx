import React, { useState } from 'react';
import { Icons } from '../Icons';

const CreditCard = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
    <line x1="4" y1="15" x2="7" y2="15" />
    <line x1="10" y1="15" x2="13" y2="15" />
  </svg>
);
const ShieldCheck = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const Truck = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const HelpCircle = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const Sidebar = ({ onLogout, activePage, setActivePage, lang, isSidebarOpen, setIsSidebarOpen, isDarkMode, shopName, theme }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const t = theme || {};

  const tSidebarBg = t.sidebarBg || '#0f172a';
  const tText = t.text || '#0f172a';
  const tTextSec = t.textSecondary || '#475569';
  const tBorder = t.sidebarBorder || '#e2e8f0';
  const tHoverBg = t.sidebarHover || 'rgba(99,102,241,0.06)';
  const tSurfaceHover = t.surfaceHover || '#f1f5f9';

  const menuItems = [
    { id: 'dashboard', icon: Icons.Home, label: lang === 'sw' ? 'Dashibodi' : 'Dashboard' },
    { id: 'pos', icon: Icons.ShoppingCart, label: lang === 'sw' ? 'Mauzo' : 'POS' },
    { id: 'products', icon: Icons.Box, label: lang === 'sw' ? 'Bidhaa' : 'Products' },
    { id: 'customers', icon: Icons.Users, label: lang === 'sw' ? 'Wateja' : 'Customers' },
    { id: 'reports', icon: Icons.BarChart, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { id: 'expenses', icon: CreditCard, label: lang === 'sw' ? 'Matumizi' : 'Expenses' },
    { id: 'suppliers', icon: Truck, label: lang === 'sw' ? 'Wauzaji' : 'Suppliers' },
    { id: 'settings', icon: Icons.Settings, label: lang === 'sw' ? 'Mipangilio' : 'Settings' },
    { id: 'subscription', icon: ShieldCheck, label: lang === 'sw' ? 'Usajili' : 'Subscription' },
  ];

  const closeSidebar = () => { if (setIsSidebarOpen) setIsSidebarOpen(false); };
  const handleMenuClick = (pageId) => { if (setActivePage) setActivePage(pageId); closeSidebar(); };

  const navItemStyle = (isActive) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
    padding: '12px 16px', border: 'none', borderRadius: '12px',
    background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
    color: isActive ? '#ffffff' : tTextSec,
    fontSize: '14px', fontWeight: isActive ? 600 : 500,
    cursor: 'pointer', justifyContent: 'flex-start', textAlign: 'left',
    position: 'relative',
    boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
    transform: isActive ? 'translateX(4px)' : 'translateX(0)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  });

  const bottomBtnStyle = {
    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
    padding: '12px 16px', border: 'none', borderRadius: '12px',
    background: 'transparent', color: tTextSec, fontSize: '14px',
    fontWeight: 500, cursor: 'pointer', justifyContent: 'flex-start',
    textAlign: 'left', transition: 'all 0.2s ease'
  };

  return (
    <>
      {isSidebarOpen && (
        <div onClick={closeSidebar} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 998, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.3s ease'
        }} />
      )}

      <div style={{
        width: 'min(280px, 85vw)', maxWidth: '300px', background: tSidebarBg, height: '100vh', position: 'fixed',
        left: isSidebarOpen ? '0' : 'calc(-1 * min(280px, 85vw))', top: 0, zIndex: 999,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSidebarOpen ? '8px 0 40px rgba(0,0,0,0.3)' : 'none',
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${tBorder}`,
        overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px', borderBottom: `1px solid ${tBorder}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/Logo.png" alt="KasiTRADE" style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: tText, letterSpacing: '-0.3px' }}>
                KasiTRADE
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: tTextSec, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                POS System
              </p>
            </div>
          </div>
          <button onClick={closeSidebar} style={{
            width: '36px', height: '36px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: tSurfaceHover, color: tText
          }}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button key={item.id} onClick={() => handleMenuClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={navItemStyle(isActive)}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = hoveredItem === item.id ? tHoverBg : 'transparent';
                  }
                }}>
                <span style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.transform = 'scale(1)'; }}>
                  <IconComponent size={20} />
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '24px', background: '#ffffff', borderRadius: '0 4px 4px 0'
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{
          borderTop: `1px solid ${tBorder}`,
          padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0
        }}>
          <button onClick={() => handleMenuClick('help')} style={bottomBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = tHoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <HelpCircle size={20} />
            <span>{lang === 'sw' ? 'Msaada' : 'Help'}</span>
          </button>

          <button onClick={() => { if (onLogout) onLogout(); closeSidebar(); }}
            style={{ ...bottomBtnStyle, color: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <Icons.LogOut size={20} />
            <span>{lang === 'sw' ? 'Toka' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
