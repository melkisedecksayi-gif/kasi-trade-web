import React from 'react';

const CategoryIcons = {
  food: {
    name: { sw: 'Vyakula', en: 'Food' },
    color: '#ef4444',
    bg: '#fee2e2',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 11h.01M11 15h.01M16 16a5 5 0 0 0-8 0" />
        <path d="M17 11a5 5 0 0 0-10 0" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      </svg>
    )
  },
  drinks: {
    name: { sw: 'Vinywaji', en: 'Drinks' },
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      </svg>
    )
  },
  clothing: {
    name: { sw: 'Mavazi', en: 'Clothing' },
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    )
  },
  electronics: {
    name: { sw: 'Elektroniki', en: 'Electronics' },
    color: '#06b6d4',
    bg: '#cffafe',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </svg>
    )
  },
  home: {
    name: { sw: 'Nyumbani', en: 'Home' },
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  medicine: {
    name: { sw: 'Dawa', en: 'Medicine' },
    color: '#10b981',
    bg: '#d1fae5',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    )
  },
  gift: {
    name: { sw: 'Zawadi', en: 'Gift' },
    color: '#ec4899',
    bg: '#fce7f3',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      </svg>
    )
  },
  shopping: {
    name: { sw: 'Ununuzi', en: 'Shopping' },
    color: '#6366f1',
    bg: '#e0e7ff',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    )
  },
  beauty: {
    name: { sw: 'Uzuri', en: 'Beauty' },
    color: '#d946ef',
    bg: '#fae8ff',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      </svg>
    )
  },
  other: {
    name: { sw: 'Mengineyo', en: 'Other' },
    color: '#64748b',
    bg: '#f1f5f9',
    icon: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    )
  },
};

export const getCategoryIcon = (category, size = 20) => {
  const cat = CategoryIcons[category] || CategoryIcons.other;
  return {
    icon: cat.icon(size),
    color: cat.color,
    bg: cat.bg,
    name: cat.name
  };
};

export default CategoryIcons;
