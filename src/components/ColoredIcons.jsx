import React from 'react';

export const CI = {
  Money: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M12 6v12M9 9h4.5a1.5 1.5 0 0 1 0 3H10.5a1.5 1.5 0 0 0 0 3H15" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Package: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#3b82f6" opacity="0.12"/>
      <path d="M12 2v20M2 12h20" stroke="#3b82f6" strokeWidth="1.5"/>
      <path d="M8 2v20M16 2v20" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
    </svg>
  ),
  Users: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#8b5cf6" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#8b5cf6" strokeWidth="1.5"/>
      <circle cx="9" cy="9" r="3" fill="#8b5cf6" opacity="0.3"/><circle cx="9" cy="9" r="1.5" fill="#8b5cf6"/>
      <circle cx="16" cy="9" r="3" fill="#8b5cf6" opacity="0.3"/><circle cx="16" cy="9" r="1.5" fill="#8b5cf6"/>
      <path d="M4 18c0-2.5 3-4 5-4M15 14c2 0 5 1.5 5 4" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Warning: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 22h20L12 2z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 9v4M12 17v0" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Cart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ec4899" opacity="0.12"/>
      <circle cx="8" cy="18" r="1.5" fill="#ec4899"/>
      <circle cx="17" cy="18" r="1.5" fill="#ec4899"/>
      <path d="M3 3h2.5L8 11l2 6h7l3-8H6" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6366f1" opacity="0.12"/>
      <rect x="8" y="12" width="4" height="7" rx="1" fill="#6366f1" opacity="0.4"/>
      <rect x="14" y="7" width="4" height="12" rx="1" fill="#6366f1" opacity="0.7"/>
      <rect x="2" y="15" width="4" height="4" rx="1" fill="#6366f1" opacity="0.2"/>
    </svg>
  ),
  TrendingUp: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.12"/>
      <polyline points="6 16 10 11 14 14 18 6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 6 18 6 17 10" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  User: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6366f1" opacity="0.1"/>
      <circle cx="12" cy="8" r="4" fill="#6366f1" opacity="0.3"/>
      <circle cx="12" cy="8" r="2" fill="#6366f1"/>
      <path d="M4 20c0-3 4-6 8-6s8 3 8 6" fill="#6366f1" opacity="0.3" stroke="#6366f1" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  Help: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#f59e0b" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M9 9.5C9 7.5 11 7 12 7s3 .5 3 2.5c0 2-3 2.5-3 4.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="17.5" r="0.75" fill="#f59e0b"/>
    </svg>
  ),
  Lock: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="11" rx="2" fill="#6366f1" opacity="0.15"/>
      <rect x="5" y="11" width="14" height="11" rx="2" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="#6366f1"/>
    </svg>
  ),
  Unlock: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="11" rx="2" fill="#10b981" opacity="0.15"/>
      <rect x="5" y="11" width="14" height="11" rx="2" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M8 11V7a4 4 0 0 1 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="#10b981"/>
    </svg>
  ),
  Key: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#f59e0b" opacity="0.12"/>
      <circle cx="8" cy="12" r="2.5" fill="#f59e0b" opacity="0.3" stroke="#f59e0b" strokeWidth="1"/>
      <path d="M10 12h9l2 2-2 2-1.5-1.5L15 16l-1.5-1.5L12 16" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Mail: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="15" rx="2" fill="#6366f1" opacity="0.12"/>
      <rect x="2" y="5" width="20" height="15" rx="2" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M2 7l8.5 5.5a2 2 0 0 0 2.2 0L22 7" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Phone: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.12"/>
      <path d="M16.5 20c-.5 0-4-1-8-5s-5-7.5-5-8c0-.5.5-1.5 2.5-1.5.5 0 1 .3 1.4.7l1.8 2.4c.3.4.3 1 0 1.4L8 11.5c1 2 3 4 5 5l1.5-1.2c.4-.3 1-.3 1.4 0l2.4 1.8c.4.3.7.9.7 1.4 0 2-1 2.5-1.5 2.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Location: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ef4444" opacity="0.12"/>
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" stroke="#ef4444" strokeWidth="1.5"/>
      <circle cx="12" cy="9" r="2.5" fill="#ef4444" opacity="0.4" stroke="#ef4444" strokeWidth="1"/>
    </svg>
  ),
  Calendar: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" fill="#6366f1" opacity="0.12"/>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M3 10h18M8 2v4M16 2v4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="12" width="4" height="3" rx="0.5" fill="#6366f1" opacity="0.3"/>
      <rect x="13" y="12" width="4" height="3" rx="0.5" fill="#6366f1" opacity="0.3"/>
    </svg>
  ),
  Camera: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="15" rx="3" fill="#6366f1" opacity="0.12"/>
      <rect x="2" y="6" width="20" height="15" rx="3" stroke="#6366f1" strokeWidth="1.5"/>
      <circle cx="12" cy="13.5" r="3.5" fill="#6366f1" opacity="0.3" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M7 3h10l2 3H5l2-3z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Eye: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6366f1" opacity="0.1"/>
      <circle cx="12" cy="12" r="3" fill="#6366f1" opacity="0.3" stroke="#6366f1" strokeWidth="1"/>
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" stroke="#6366f1" strokeWidth="1.5"/>
    </svg>
  ),
  EyeOff: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#64748b" opacity="0.1"/>
      <path d="M2 2l20 20M10 6.5C10.7 6.2 11.4 6 12 6c6 0 10 6 10 6s-1.5 3-4.5 5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 9c-1.5 1.5-2.5 3-2.5 3s4 8 10 8c1.2 0 2.4-.3 3.5-.8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2.5" stroke="#64748b" strokeWidth="1"/>
    </svg>
  ),
  Heart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ef4444" opacity="0.85">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Star: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" opacity="0.85">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Trash: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ef4444" opacity="0.12"/>
      <path d="M4 6h16M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 10v6M14 10v6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Printer: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="12" rx="2" fill="#6366f1" opacity="0.12"/>
      <rect x="6" y="2" width="12" height="6" rx="1" fill="#6366f1" opacity="0.12" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M6 12h12" stroke="#6366f1" strokeWidth="1.5"/>
      <path d="M9 16h6M9 19h4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Clock: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#64748b" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="1.5"/>
      <path d="M12 6v6l4 2" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Settings: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#64748b" opacity="0.12"/>
      <circle cx="12" cy="12" r="2.5" fill="#64748b" opacity="0.3" stroke="#64748b" strokeWidth="1.5"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Globe: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.12"/>
      <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5"/>
      <ellipse cx="12" cy="12" rx="5" ry="10" stroke="#3b82f6" strokeWidth="0.75" opacity="0.5"/>
      <path d="M2 12h20M12 2v20" stroke="#3b82f6" strokeWidth="0.75" opacity="0.5"/>
    </svg>
  ),
  Shield: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v5c0 5 4 9 9 11 5-2 9-6 9-11V7L12 2z" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M8 12l2.5 2.5L16 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Building: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="19" rx="2" fill="#8b5cf6" opacity="0.12"/>
      <rect x="3" y="3" width="18" height="19" rx="2" stroke="#8b5cf6" strokeWidth="1.5"/>
      <path d="M9 22v-3h6v3M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Home: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6366f1" opacity="0.12"/>
      <path d="M3 12l9-8 9 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22v-8h6v8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.12"/>
      <path d="M2 12A10 10 0 0 1 16 3.5M22 12a10 10 0 0 1-14 8.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="16 2 16 5 13 5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="8 22 8 19 11 19" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Mobile: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="2" width="12" height="20" rx="3" fill="#3b82f6" opacity="0.12"/>
      <rect x="6" y="2" width="12" height="20" rx="3" stroke="#3b82f6" strokeWidth="1.5"/>
      <circle cx="12" cy="17" r="1" fill="#3b82f6"/>
      <path d="M7 5h10" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  CreditCard: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#8b5cf6" opacity="0.12"/>
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="#8b5cf6" strokeWidth="1.5"/>
      <path d="M2 11h20" stroke="#8b5cf6" strokeWidth="1.5"/>
      <path d="M6 16h4M12 16h2" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  Chat: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.12"/>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Photo: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#8b5cf6" opacity="0.12"/>
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="#8b5cf6" strokeWidth="1.5"/>
      <circle cx="8.5" cy="9.5" r="2" fill="#8b5cf6" opacity="0.3"/>
      <path d="M22 16l-5-5-4 4-3-3-8 8" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="d" values="M22 16l-5-5-4 4-3-3-8 8;M22 16l-5-5-4 4-3-3-8 8" dur="1s" repeatCount="1"/>
      </path>
    </svg>
  ),
};

export default CI;
