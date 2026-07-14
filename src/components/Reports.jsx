import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icons } from './Icons';
import { sendSMS, generateReportSMS } from '../services/smsService';
import { printReport } from '../utils/print';

const GRADIENT_START = '#6366f1';
const GRADIENT_END = '#8b5cf6';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

const texts = {
  sw: {
    reports: 'Ripoti na Uchambuzi',
    today: 'Leo',
    thisWeek: 'Wiki Hii',
    thisMonth: 'Mwezi Huu',
    thisYear: 'Mwaka Huu',
    custom: 'Binafsi',
    totalRevenue: 'Mapato Yote',
    totalProfit: 'Faida Yote',
    totalTransactions: 'Miamala Yote',
    averageOrder: 'Wastani wa Agizo',
    productsSold: 'Bidhaa Zilizouzwa',
    salesTrend: 'Mwenendo wa Mauzo',
    topProducts: 'Bidhaa Zinazouzwa Zaidi',
    salesByCategory: 'Mauzo kwa Kategoria',
    recentTransactions: 'Miamala ya Hivi Karibuni',
    profitMargin: 'Uchambuzi wa Faida',
    exportCSV: 'Pakua CSV',
    loading: 'Inapakia...',
    noData: 'Hakuna data',
    date: 'Tarehe',
    id: 'ID',
    amount: 'Kiasi',
    profit: 'Faida',
    items: 'Bidhaa',
    payment: 'Malipo',
    startDate: 'Tarehe ya Kuanza',
    endDate: 'Tarehe ya Mwisho',
    apply: 'Tekeleza',
    product: 'Bidhaa',
    quantity: 'Idadi',
    total: 'Jumla',
    category: 'Kategoria',
    revenue: 'Mapato',
    cost: 'Gharama',
    margin: 'Kiasi cha Faida',
    marginPercent: 'Asilimia ya Faida',
    sales: 'Mauzo',
    allCategories: 'Zote',
    thisPeriod: 'Kipindi Hiki',
    previousPeriod: 'Kipindi Kilichopita',
    change: 'Mabadiliko',
    closeDuka: 'Funga Duka',
    closeDukaTitle: 'Funga Duka - Tuma Ripoti',
    todaySalesSummary: 'Mauzo ya Leo',
    recipientPhone: 'Namba ya Kupokea',
    sendReport: 'Tuma Ripoti',
    sending: 'Inatuma...',
    reportSent: 'Ripoti Imetumwa!',
    failed: 'Imeshindwa',
  },
  en: {
    reports: 'Reports & Analytics',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    custom: 'Custom',
    totalRevenue: 'Total Revenue',
    totalProfit: 'Total Profit',
    totalTransactions: 'Total Transactions',
    averageOrder: 'Average Order Value',
    productsSold: 'Products Sold',
    salesTrend: 'Sales Trend',
    topProducts: 'Top Selling Products',
    salesByCategory: 'Sales by Category',
    recentTransactions: 'Recent Transactions',
    profitMargin: 'Profit Margin Analysis',
    exportCSV: 'Export CSV',
    loading: 'Loading...',
    noData: 'No data available',
    date: 'Date',
    id: 'ID',
    amount: 'Amount',
    profit: 'Profit',
    items: 'Items',
    payment: 'Payment',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply',
    product: 'Product',
    quantity: 'Quantity',
    total: 'Total',
    category: 'Category',
    revenue: 'Revenue',
    cost: 'Cost',
    margin: 'Profit Margin',
    marginPercent: 'Margin %',
    sales: 'Sales',
    allCategories: 'All',
    thisPeriod: 'This Period',
    previousPeriod: 'Previous Period',
    change: 'Change',
    closeDuka: 'Close Day',
    closeDukaTitle: 'Close Day - Send Report',
    todaySalesSummary: 'Today Sales',
    recipientPhone: 'Recipient Phone',
    sendReport: 'Send Report',
    sending: 'Sending...',
    reportSent: 'Report Sent!',
    failed: 'Failed',
  }
};

const translations = {
  sw: {
    cash: 'Taslimu',
    card: 'Kadi',
    mobile: 'Simu',
    transfer: 'Uhamisho',
    other: 'Nyingine',
  },
  en: {
    cash: 'Cash',
    card: 'Card',
    mobile: 'Mobile',
    transfer: 'Transfer',
    other: 'Other',
  }
};

const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'today': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
      break;
    }
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
  }

  return { start, end };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatAxisValue = (v) => {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return String(Math.round(v));
};

const getPaymentMethodLabel = (method, lang) => {
  const t = translations[lang] || translations.en;
  const m = (method || '').toLowerCase();
  if (m.includes('cash')) return t.cash;
  if (m.includes('card')) return t.card;
  if (m.includes('mobile') || m.includes('mpesa') || m.includes('tigo') || m.includes('airtel')) return t.mobile;
  if (m.includes('transfer') || m.includes('bank')) return t.transfer;
  return t.other;
};

const polarToCartesian = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

const Skeleton = ({ isDarkMode }) => {
  const shimmer = {
    background: isDarkMode
      ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
      : 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  };

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ ...shimmer, height: '36px', flex: 1, borderRadius: '20px' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ ...shimmer, height: '120px', borderRadius: '16px' }} />
        ))}
      </div>
      <div style={{ display: 'grid',         gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...shimmer, height: '300px', borderRadius: '16px' }} />
        <div style={{ ...shimmer, height: '300px', borderRadius: '16px' }} />
      </div>
      <div style={{ display: 'grid',         gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...shimmer, height: '300px', borderRadius: '16px' }} />
        <div style={{ ...shimmer, height: '300px', borderRadius: '16px' }} />
      </div>
      <div style={{ ...shimmer, height: '350px', borderRadius: '16px' }} />
    </div>
  );
};

const SalesTrendSVG = ({ data, isDarkMode, t }) => {
  const W = 580;
  const H = 290;
  const pad = { top: 15, right: 25, bottom: 45, left: 55 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.sales || 0, d.profit || 0)), 1);
  const yTicks = 5;
  const textColor = isDarkMode ? '#94a3b8' : '#475569';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  const xScale = (i) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const yScale = (v) => pad.top + ch - ((v || 0) / maxVal) * ch;

  const areaPath = (key) => {
    if (data.length === 0) return '';
    let d = `M ${xScale(0)} ${H - pad.bottom}`;
    for (let i = 0; i < data.length; i++) {
      d += ` L ${xScale(i)} ${yScale(data[i][key] || 0)}`;
    }
    d += ` L ${xScale(data.length - 1)} ${H - pad.bottom} Z`;
    return d;
  };

  const linePath = (key) => {
    if (data.length === 0) return '';
    return data.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(pt[key] || 0)}`).join(' ');
  };

  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="svg-area-sales-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={GRADIENT_START} stopOpacity="0.3" />
          <stop offset="95%" stopColor={GRADIENT_END} stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="svg-area-profit-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="95%" stopColor="#10b981" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = pad.top + (ch / yTicks) * i;
        const val = maxVal - (maxVal / yTicks) * i;
        return (
          <g key={`grid-${i}`}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke={gridColor} strokeDasharray="4 3" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill={textColor} fontSize="10">{formatAxisValue(val)}</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        if (i % labelStep !== 0 && i !== data.length - 1) return null;
        return (
          <text key={`xl-${i}`} x={xScale(i)} y={H - pad.bottom + 18} textAnchor="middle" fill={textColor} fontSize="10">{d.date}</text>
        );
      })}

      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke={gridColor} strokeWidth="1" />
      <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke={gridColor} strokeWidth="1" />

      <path d={areaPath('sales')} fill="url(#svg-area-sales-grad)" />
      <path d={linePath('sales')} fill="none" stroke={GRADIENT_START} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      <path d={areaPath('profit')} fill="url(#svg-area-profit-grad)" />
      <path d={linePath('profit')} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 3" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        <g key={`pts-${i}`}>
          <circle cx={xScale(i)} cy={yScale(d.sales || 0)} r="3.5" fill={GRADIENT_START} stroke={isDarkMode ? '#1e293b' : '#fff'} strokeWidth="1.5">
            <title>{t.revenue}: {formatCurrency(d.sales)}</title>
          </circle>
          <circle cx={xScale(i)} cy={yScale(d.profit || 0)} r="3.5" fill="#10b981" stroke={isDarkMode ? '#1e293b' : '#fff'} strokeWidth="1.5">
            <title>{t.profit}: {formatCurrency(d.profit)}</title>
          </circle>
        </g>
      ))}

      <g transform={`translate(${(W / 2) - 85}, ${H - 2})`}>
        <line x1="0" y1="0" x2="14" y2="0" stroke={GRADIENT_START} strokeWidth="2.5" strokeLinecap="round" />
        <text x="19" y="4" fill={textColor} fontSize="11">{t.revenue}</text>
        <line x1="70" y1="0" x2="84" y2="0" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
        <text x="89" y="4" fill={textColor} fontSize="11">{t.profit}</text>
      </g>
    </svg>
  );
};

const TopProductsSVG = ({ data, isDarkMode, t }) => {
  const count = data.length;
  const barH = 18;
  const gap = 8;
  const pad = { top: 10, right: 80, bottom: 30, left: 120 };
  const totalH = Math.max(count * (barH + gap) - gap, 1);
  const H = pad.top + totalH + pad.bottom;
  const W = 480;
  const cw = W - pad.left - pad.right;

  const maxVal = Math.max(...data.map(d => d.sales || 0), 1);
  const textColor = isDarkMode ? '#94a3b8' : '#475569';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  const gridCount = 4;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="svg-bar-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GRADIENT_START} stopOpacity="0.85" />
          <stop offset="100%" stopColor={GRADIENT_END} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {Array.from({ length: gridCount + 1 }).map((_, i) => {
        const x = pad.left + (cw / gridCount) * i;
        const val = (maxVal / gridCount) * i;
        return (
          <g key={`bg-${i}`}>
            <line x1={x} y1={pad.top} x2={x} y2={H - pad.bottom} stroke={gridColor} strokeDasharray="3 3" strokeWidth="1" />
            <text x={x} y={H - pad.bottom + 16} textAnchor="middle" fill={textColor} fontSize="10">{formatAxisValue(val)}</text>
          </g>
        );
      })}

      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke={gridColor} strokeWidth="1" />
      <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke={gridColor} strokeWidth="1" />

      {data.map((item, i) => {
        const y = pad.top + i * (barH + gap);
        const w = ((item.sales || 0) / maxVal) * cw;
        const safeW = Math.max(w, 2);
        const name = item.name || '';
        const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;
        return (
          <g key={`bar-${i}`}>
            <text x={pad.left - 8} y={y + barH / 2 + 4} textAnchor="end" fill={isDarkMode ? '#e2e8f0' : '#1e293b'} fontSize="11" fontFamily="monospace">{displayName}</text>
            <rect x={pad.left} y={y} width={safeW} height={barH} rx="4" fill="url(#svg-bar-grad)">
              <title>{item.name}: {formatCurrency(item.sales)} | {t.quantity}: {item.quantity}</title>
            </rect>
            <text x={pad.left + safeW + 6} y={y + barH / 2 + 4} fill={textColor} fontSize="10" fontWeight="600">{formatAxisValue(item.sales || 0)}</text>
          </g>
        );
      })}
    </svg>
  );
};

const CategoryPieSVG = ({ data, isDarkMode }) => {
  const W = 460;
  const H = 300;
  const cx = 155;
  const cy = 150;
  const outerR = 100;
  const innerR = 58;

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const cardBorder = isDarkMode ? '#334155' : '#e2e8f0';

  const slices = [];
  let currentAngle = -Math.PI / 2;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const sliceAngle = ((item.value || 0) / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const large = sliceAngle > Math.PI ? 1 : 0;

    const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
    const outerEnd = polarToCartesian(cx, cy, outerR, currentAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, currentAngle);

    const midAngle = currentAngle + sliceAngle / 2;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    const pathD = [
      `M ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      'Z',
    ].join(' ');

    slices.push({
      pathD,
      color,
      name: item.name || '',
      value: item.value || 0,
      pct: ((item.value || 0) / total) * 100,
      midAngle,
    });

    currentAngle = endAngle;
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      {slices.map((s, i) => (
        <path key={`s-${i}`} d={s.pathD} fill={s.color} stroke={isDarkMode ? '#1e293b' : '#ffffff'} strokeWidth="2">
          <title>{s.name}: {s.pct.toFixed(1)}%</title>
        </path>
      ))}

      <text x={cx} y={cy - 8} textAnchor="middle" fill={textColor} fontSize="15" fontWeight="700">
        {formatCurrency(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={isDarkMode ? '#94a3b8' : '#475569'} fontSize="10">
        Total
      </text>

      {slices.map((s, i) => {
        const col = i < 5 ? 0 : 1;
        const row = i < 5 ? i : i - 5;
        const lx = 285 + col * 88;
        const ly = 22 + row * 24;
        const name = (s.name || '').length > 11 ? (s.name || '').substring(0, 11) + '\u2026' : (s.name || '');
        return (
          <g key={`leg-${i}`}>
            <rect x={lx} y={ly - 8} width="10" height="10" rx="2" fill={s.color} />
            <text x={lx + 14} y={ly} fill={textColor} fontSize="10">
              {name} {s.pct.toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const ProfitMarginGauge = ({ pct, isDarkMode }) => {
  const W = 210;
  const H = 170;
  const cx = 105;
  const cy = 120;
  const r = 68;
  const sw = 16;
  const circumference = 2 * Math.PI * r;

  const clamped = Math.min(100, Math.max(0, pct));
  const progress = circumference * (clamped / 100);
  const remaining = circumference - progress;

  const trackColor = isDarkMode ? '#334155' : '#e2e8f0';
  const getColor = (v) => {
    if (isDarkMode) {
      if (v < 20) return '#fca5a5';
      if (v < 50) return '#fcd34d';
      return '#6ee7b7';
    }
    if (v < 20) return '#dc2626';
    if (v < 50) return '#d97706';
    return '#059669';
  };
  const gaugeColor = getColor(clamped);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="svg-gauge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={gaugeColor} />
          <stop offset="100%" stopColor={gaugeColor} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />

      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#svg-gauge-grad)"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${progress} ${remaining}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      <text x={cx} y={cy - 10} textAnchor="middle" fill={gaugeColor} fontSize="30" fontWeight="700">
        {clamped.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill={isDarkMode ? '#94a3b8' : '#475569'} fontSize="12">
        Profit Margin
      </text>
    </svg>
  );
};

const Reports = ({ lang = 'en', supabase, currentShop, isDarkMode = false, theme }) => {
  const t = texts[lang] || texts.en;

  const iconMap = {
    money: <Icons.ShoppingCart size={22} color="#10b981" />,
    trending: <Icons.BarChart size={22} color="#6366f1" />,
    chart: <Icons.BarChart size={22} color="#f59e0b" />,
    cart: <Icons.ShoppingCart size={22} color="#06b6d4" />,
    package: <Icons.Box size={22} color="#ec4899" />,
  };

  const localTheme = useMemo(() => ({
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    gradientBg: isDarkMode
      ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)'
      : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
    accent: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    accentText: '#6366f1',
  }), [isDarkMode]);
  const th = theme || localTheme;

  const [activeTab, setActiveTab] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  const [showEodModal, setShowEodModal] = useState(false);
  const [eodPhone, setEodPhone] = useState('');
  const [eodSending, setEodSending] = useState(false);
  const [eodResult, setEodResult] = useState(null);

  const periodTabs = useMemo(() => [
    { key: 'today', label: t.today },
    { key: 'week', label: t.thisWeek },
    { key: 'month', label: t.thisMonth },
    { key: 'year', label: t.thisYear },
    { key: 'custom', label: t.custom },
  ], [t]);

  const fetchProducts = useCallback(async () => {
    if (!currentShop?.id) return [];
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, category, cost_price, selling_price')
        .eq('shop_id', currentShop.id);
      return data || [];
    } catch (err) {
      console.error('Error fetching products:', err);
      return [];
    }
  }, [supabase, currentShop]);

  const fetchTransactions = useCallback(async (start, end) => {
    if (!currentShop?.id) return [];
    try {
      let allData = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('transactions')
          .select('*')
          .eq('shop_id', currentShop.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      return allData;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }, [supabase, currentShop]);

  useEffect(() => {
    if (!currentShop?.id) return;

    const loadData = async () => {
      setLoading(true);

      const productsData = await fetchProducts();
      setProducts(productsData);

      const { start, end } = getDateRange(activeTab, customStart, customEnd);
      const txData = await fetchTransactions(start, end);
      setTransactions(txData);

      setLoading(false);
    };

    loadData();
  }, [currentShop, activeTab, customStart, customEnd, fetchProducts, fetchTransactions]);

  const kpis = useMemo(() => {
    if (!transactions.length) return [
      { label: t.totalRevenue, value: formatCurrency(0), icon: 'money', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
      { label: t.totalProfit, value: formatCurrency(0), icon: 'trending', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
      { label: t.totalTransactions, value: '0', icon: 'chart', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { label: t.averageOrder, value: formatCurrency(0), icon: 'cart', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { label: t.productsSold, value: '0', icon: 'package', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    ];

    const totalRevenue = transactions.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0);
    const totalProfit = transactions.reduce((sum, tx) => sum + (Number(tx.profit) || 0), 0);
    const totalTx = transactions.length;
    const avgOrder = totalTx > 0 ? totalRevenue / totalTx : 0;
    const totalItems = transactions.reduce((sum, tx) => sum + (Number(tx.items_count) || 0), 0);

    return [
      { label: t.totalRevenue, value: formatCurrency(totalRevenue), icon: 'money', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
      { label: t.totalProfit, value: formatCurrency(totalProfit), icon: 'trending', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
      { label: t.totalTransactions, value: formatNumber(totalTx), icon: 'chart', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { label: t.averageOrder, value: formatCurrency(avgOrder), icon: 'cart', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { label: t.productsSold, value: formatNumber(totalItems), icon: 'package', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    ];
  }, [transactions, t]);

  const salesTrendData = useMemo(() => {
    if (!transactions.length) return [];

    const { start, end } = getDateRange(activeTab, customStart, customEnd);
    let groupKey;

    if (activeTab === 'today') {
      groupKey = 'hour';
    } else if (activeTab === 'week') {
      groupKey = 'day';
    } else if (activeTab === 'month') {
      groupKey = 'day';
    } else {
      groupKey = 'month';
    }

    const grouped = {};

    if (groupKey === 'hour') {
      for (let h = 0; h < 24; h++) {
        const key = `${String(h).padStart(2, '0')}:00`;
        grouped[key] = { date: key, sales: 0, profit: 0 };
      }
      transactions.forEach(tx => {
        const d = new Date(tx.created_at);
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (grouped[key]) {
          grouped[key].sales += Number(tx.total_amount) || 0;
          grouped[key].profit += Number(tx.profit) || 0;
        }
      });
    } else if (groupKey === 'day') {
      const current = new Date(start);
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        grouped[key] = {
          date: new Date(current).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          sales: 0,
          profit: 0,
        };
        current.setDate(current.getDate() + 1);
      }
      transactions.forEach(tx => {
        const key = tx.created_at.split('T')[0];
        if (grouped[key]) {
          grouped[key].sales += Number(tx.total_amount) || 0;
          grouped[key].profit += Number(tx.profit) || 0;
        }
      });
    } else {
      for (let m = 0; m < 12; m++) {
        const key = new Date(start.getFullYear(), m, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        grouped[key] = { date: key, sales: 0, profit: 0 };
      }
      transactions.forEach(tx => {
        const d = new Date(tx.created_at);
        const key = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        if (grouped[key]) {
          grouped[key].sales += Number(tx.total_amount) || 0;
          grouped[key].profit += Number(tx.profit) || 0;
        }
      });
    }

    return Object.values(grouped);
  }, [transactions, activeTab, customStart, customEnd]);

  const topProductsData = useMemo(() => {
    if (!transactions.length || !products.length) return [];

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = { name: p.name || 'Unknown', sales: 0, quantity: 0, category: p.category || 'Uncategorized' };
    });

    transactions.forEach(tx => {
      const items = tx.items || tx.line_items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const pid = item.product_id || item.id;
          if (pid && productMap[pid]) {
            productMap[pid].sales += Number(item.total || item.price * item.quantity || 0);
            productMap[pid].quantity += Number(item.quantity || 1);
          }
        });
      }
    });

    return Object.values(productMap)
      .filter(p => p.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [transactions, products]);

  const categoryData = useMemo(() => {
    if (!transactions.length || !products.length) return [];

    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, value: 0 };
    });

    transactions.forEach(tx => {
      const items = tx.items || tx.line_items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const pid = item.product_id || item.id;
          const product = products.find(p => p.id === pid);
          const cat = product ? product.category || 'Uncategorized' : 'Uncategorized';
          if (categoryMap[cat]) {
            categoryMap[cat].value += Number(item.total || item.price * item.quantity || 0);
          }
        });
      }
    });

    return Object.values(categoryMap)
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions, products]);

  const profitMarginData = useMemo(() => {
    if (!transactions.length) return { totalRevenue: 0, totalCost: 0, totalProfit: 0, marginPercent: 0 };

    const totalRevenue = transactions.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0);
    const totalProfit = transactions.reduce((sum, tx) => sum + (Number(tx.profit) || 0), 0);
    const totalCost = totalRevenue - totalProfit;
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalProfit, marginPercent };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);
  }, [transactions]);

  const exportToCSV = useCallback(() => {
    if (!transactions.length) return;

    const headers = [
      'Transaction ID',
      'Date',
      'Total Amount (TZS)',
      'Profit (TZS)',
      'Items Count',
      'Payment Method',
    ];

    const rows = transactions.map(tx => [
      tx.id || '',
      formatDateTime(tx.created_at),
      tx.total_amount || 0,
      tx.profit || 0,
      tx.items_count || 0,
      getPaymentMethodLabel(tx.payment_method, lang),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `kasitrade-report-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transactions, lang]);

  const handleOpenSms = async () => {
    if (!transactions.length) return;
    if (currentShop?.phone) setSmsPhone(currentShop.phone);
    setShowSmsModal(true);
  };

  const handleSendSms = async () => {
    if (!smsPhone.trim()) return;
    setSmsSending(true);
    setSmsResult(null);
    try {
      const { data: settings } = await supabase.from('sms_settings').select('api_key').eq('shop_id', currentShop.id).maybeSingle();
      const apiKey = settings?.api_key || undefined;

      const reportData = {
        totalRevenue: kpis[0].value,
        totalProfit: kpis[1].value,
        totalTransactions: kpis[2].value,
        avgOrderValue: kpis[3].value,
        productsSold: kpis[4].value,
        topProducts: topProductsData.map(p => ({ name: p.name, total: p.total }))
      };
      const message = generateReportSMS(reportData, lang);
      const result = await sendSMS({ to: smsPhone, message, apiKey });

      if (result.success) {
        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id,
          recipient: smsPhone,
          message,
          type: 'report',
          status: 'sent',
          provider_response: JSON.stringify(result.data).slice(0, 500)
        });
        setSmsResult({ success: true });
      } else {
        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id,
          recipient: smsPhone,
          message,
          type: 'report',
          status: 'failed',
          provider_response: result.error?.slice(0, 500) || ''
        });
        setSmsResult({ success: false, error: result.error });
      }
    } catch (err) {
      setSmsResult({ success: false, error: err.message });
    } finally {
      setSmsSending(false);
    }
  };

  const handleCloseDuka = async () => {
    if (!eodPhone.trim()) return;
    setEodSending(true);
    setEodResult(null);
    try {
      const { start, end } = getDateRange('today');
      const todayTx = await fetchTransactions(start, end);
      const totalRevenue = todayTx.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0);
      const totalProfit = todayTx.reduce((sum, tx) => sum + (Number(tx.profit) || 0), 0);
      const totalTx = todayTx.length;
      const productsSold = todayTx.reduce((sum, tx) => sum + (Number(tx.items_count) || 0), 0);

      const { data: settings } = await supabase.from('sms_settings').select('api_key').eq('shop_id', currentShop.id).maybeSingle();
      const apiKey = settings?.api_key || undefined;

      const reportData = {
        totalRevenue,
        totalProfit,
        totalTransactions: totalTx,
        avgOrderValue: totalTx > 0 ? totalRevenue / totalTx : 0,
        productsSold,
        topProducts: []
      };
      const message = generateReportSMS(reportData, lang);
      const result = await sendSMS({ to: eodPhone, message, apiKey });

      if (result.success) {
        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id,
          recipient: eodPhone,
          message,
          type: 'report',
          status: 'sent',
          provider_response: JSON.stringify(result.data).slice(0, 500)
        });
        setEodResult({ success: true });
      } else {
        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id,
          recipient: eodPhone,
          message,
          type: 'report',
          status: 'failed',
          provider_response: result.error?.slice(0, 500) || ''
        });
        setEodResult({ success: false, error: result.error });
      }
    } catch (err) {
      setEodResult({ success: false, error: err.message });
    } finally {
      setEodSending(false);
    }
  };

  if (loading) return <Skeleton isDarkMode={isDarkMode} />;

  return (
    <div style={{
      minHeight: '100vh',
      background: th.bg,
      color: th.text,
      padding: '24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <style>{`
        .report-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .report-scroll::-webkit-scrollbar-track { background: transparent; }
        .report-scroll::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#475569' : '#cbd5e1'}; border-radius: 3px; }
        .report-scroll::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#64748b' : '#94a3b8'}; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, background: th.accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {t.reports}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleOpenSms} disabled={!transactions.length}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px',
              border: `1px solid ${th.border}`,
              background: transactions.length ? '#6366f1' : th.border,
              color: '#fff', cursor: transactions.length ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 600, opacity: transactions.length ? 1 : 0.5,
              transition: 'all 0.2s'
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="1" />
              <path d="M22 7 13.5 12.5a2 2 0 0 1-2.27.02L2 7" />
            </svg>
            {lang === 'sw' ? 'Tuma kwa SMS' : 'Send via SMS'}
          </button>
          <button onClick={exportToCSV} disabled={!transactions.length}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: `1px solid ${th.border}`,
            background: transactions.length ? th.accent : th.border,
            color: '#fff',
            cursor: transactions.length ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 600,
            opacity: transactions.length ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t.exportCSV}
        </button>

          <button onClick={() => {
            const rows = transactions.map(tx => [
              tx.id?.slice(0, 8) || '-',
              new Date(tx.created_at).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US'),
              tx.payment_method || '-',
              (tx.total_amount || 0).toLocaleString(),
              (tx.profit || 0).toLocaleString(),
            ]);
            printReport({
              title: lang === 'sw' ? 'Ripoti ya Mauzo' : 'Sales Report',
              headers: ['ID', lang === 'sw' ? 'Tarehe' : 'Date', lang === 'sw' ? 'Njia' : 'Method', lang === 'sw' ? 'Jumla' : 'Total', lang === 'sw' ? 'Faida' : 'Profit'],
              rows,
              totals: ['', '', '', (transactions.reduce((s, t) => s + (t.total_amount || 0), 0)).toLocaleString(), (transactions.reduce((s, t) => s + (t.profit || 0), 0)).toLocaleString()],
            });
          }} disabled={!transactions.length}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            border: `1px solid ${th.border}`,
            background: transactions.length ? '#10b981' : th.border,
            color: '#fff', cursor: transactions.length ? 'pointer' : 'not-allowed',
            fontSize: '14px', fontWeight: 600, opacity: transactions.length ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-3"/><rect width="10" height="8" x="7" y="13" rx="1"/>
          </svg>
           {lang === 'sw' ? 'Chapisha' : 'Print'}
        </button>

          <button
            onClick={() => { setEodPhone(currentShop?.phone || ''); setEodResult(null); setShowEodModal(true); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${th.border}`,
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s',
              opacity: 0.9,
            }}
            title={lang === 'sw' ? 'Funga Duka - Tuma Ripoti ya Leo kwa SMS' : 'Close Day - Send Today Report via SMS'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
            {t.closeDuka}
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        background: th.cardBg,
        padding: '6px',
        borderRadius: '14px',
        border: `1px solid ${th.border}`,
      }}>
        {periodTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              background: activeTab === tab.key ? th.accent : 'transparent',
              color: activeTab === tab.key ? '#fff' : th.textMuted,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${th.border}`,
                background: th.cardBg,
                color: th.text,
                fontSize: '13px',
              }}
            />
            <span style={{ color: th.textMuted, fontSize: '13px' }}>-</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${th.border}`,
                background: th.cardBg,
                color: th.text,
                fontSize: '13px',
              }}
            />
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              background: th.cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${th.border}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: kpi.gradient }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              {iconMap[kpi.icon] || <Icons.Box size={22} color={th.textMuted} />}
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: th.textMuted, fontWeight: 500 }}>
              {kpi.label}
            </p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: th.text }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: th.cardBg,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${th.border}`,
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: th.text }}>
            {t.salesTrend}
          </h3>
          {salesTrendData.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <SalesTrendSVG data={salesTrendData} isDarkMode={isDarkMode} t={t} />
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, fontSize: '14px' }}>
              {t.noData}
            </div>
          )}
        </div>

        <div style={{
          background: th.cardBg,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${th.border}`,
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: th.text }}>
            {t.topProducts}
          </h3>
          {topProductsData.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <TopProductsSVG data={topProductsData} isDarkMode={isDarkMode} t={t} />
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, fontSize: '14px' }}>
              {t.noData}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: th.cardBg,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${th.border}`,
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: th.text }}>
            {t.salesByCategory}
          </h3>
          {categoryData.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <CategoryPieSVG data={categoryData} isDarkMode={isDarkMode} />
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, fontSize: '14px' }}>
              {t.noData}
            </div>
          )}
        </div>

        <div style={{
          background: th.cardBg,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${th.border}`,
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: th.text }}>
            {t.profitMargin}
          </h3>
          {profitMarginData.totalRevenue > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: th.textMuted }}>{t.revenue}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: GRADIENT_START }}>{formatCurrency(profitMarginData.totalRevenue)}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: th.textMuted }}>{t.profit}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: isDarkMode ? '#6ee7b7' : '#059669' }}>{formatCurrency(profitMarginData.totalProfit)}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: th.textMuted }}>{t.cost}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: isDarkMode ? '#fcd34d' : '#b45309' }}>{formatCurrency(profitMarginData.totalCost)}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: th.textMuted }}>{t.marginPercent}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: GRADIENT_END }}>{profitMarginData.marginPercent.toFixed(1)}%</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <div style={{ width: '180px', height: '150px' }}>
                  <ProfitMarginGauge pct={profitMarginData.marginPercent} isDarkMode={isDarkMode} />
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '12px', borderRadius: '10px', background: th.gradientBg }}>
                <p style={{ margin: 0, fontSize: '13px', color: th.text, lineHeight: 1.6 }}>
                  {lang === 'sw'
                    ? `Katika kipindi hiki, faida ni ${formatCurrency(profitMarginData.totalProfit)} kutoka mapato ya ${formatCurrency(profitMarginData.totalRevenue)}, ikiwa ni kiwango cha faida cha ${profitMarginData.marginPercent.toFixed(1)}%.`
                    : `During this period, profit is ${formatCurrency(profitMarginData.totalProfit)} from revenue of ${formatCurrency(profitMarginData.totalRevenue)}, resulting in a profit margin of ${profitMarginData.marginPercent.toFixed(1)}%.`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, fontSize: '14px' }}>
              {t.noData}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: th.cardBg,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${th.border}`,
        overflow: 'hidden',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: th.text }}>
          {t.recentTransactions}
        </h3>
        {recentTransactions.length > 0 ? (
          <div className="report-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${th.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.id}
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.date}
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.amount}
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.profit}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.items}
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: th.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.payment}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id || idx}
                    style={{
                      borderBottom: `1px solid ${th.border}`,
                      background: idx % 2 === 0 ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')}
                  >
                    <td style={{ padding: '12px 16px', color: th.textMuted, fontFamily: 'monospace', fontSize: '12px' }}>
                      {(tx.id || '').substring(0, 12)}...
                    </td>
                    <td style={{ padding: '12px 16px', color: th.text, whiteSpace: 'nowrap' }}>
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: th.text, fontWeight: 600 }}>
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: (tx.profit || 0) >= 0 ? (isDarkMode ? '#6ee7b7' : '#059669') : (isDarkMode ? '#fca5a5' : '#dc2626'), fontWeight: 600 }}>
                      {formatCurrency(tx.profit)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: th.text }}>
                      {tx.items_count || 0}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                        color: GRADIENT_START,
                      }}>
                        {getPaymentMethodLabel(tx.payment_method, lang)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: th.textMuted, fontSize: '14px' }}>
            {t.noData}
          </div>
        )}
      </div>

    {/* SMS Send Modal */}
    {showSmsModal && (
      <div className="modal-overlay" onClick={() => { setShowSmsModal(false); setSmsResult(null); }}>
        <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
          <div className="modal-header">
            <h3 className="modal-title">{lang === 'sw' ? 'Tuma Ripoti kwa SMS' : 'Send Report via SMS'}</h3>
            <button className="modal-close" onClick={() => { setShowSmsModal(false); setSmsResult(null); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {smsResult ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                background: smsResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${smsResult.success ? '#10b981' : '#ef4444'}`
              }}>
                {smsResult.success ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                )}
              </div>
              <h4 className="text-h4 mb-sm">
                {smsResult.success ? (lang === 'sw' ? 'Ripoti Imetumwa!' : 'Report Sent!') : (lang === 'sw' ? 'Imeshindwa' : 'Failed')}
              </h4>
              {!smsResult.success && <p className="text-small">{smsResult.error}</p>}
              <button className="btn btn-primary mt-lg" onClick={() => { setShowSmsModal(false); setSmsResult(null); }}
                style={{ padding: '10px 32px', borderRadius: '10px' }}>OK</button>
            </div>
          ) : (
            <>
              <div className="modal-body">
                <div className="flex flex-col" style={{ gap: '4px' }}>
                  <label className="text-small" style={{ fontWeight: 600, color: th.text }}>
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                  </label>
                  <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)}
                    className="input input-lg" placeholder="255XXXXXXXXX" />
                </div>
                <div className="flex flex-col" style={{ gap: '4px' }}>
                  <label className="text-small" style={{ fontWeight: 600, color: th.text }}>
                    {lang === 'sw' ? 'Mfano wa Ujumbe' : 'Message Preview'}
                  </label>
                  <div style={{
                    padding: '14px', borderRadius: '10px',
                    background: isDarkMode ? '#0f172a' : '#f8fafc',
                    border: `1px solid ${th.border}`,
                    fontSize: '12px', color: th.text, fontFamily: "'Inter', monospace",
                    whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {generateReportSMS({
                      totalRevenue: kpis[0].value,
                      totalProfit: kpis[1].value,
                      totalTransactions: kpis[2].value,
                      avgOrderValue: kpis[3].value,
                      productsSold: kpis[4].value,
                      topProducts: topProductsData.map(p => ({ name: p.name, total: p.total }))
                    }, lang)}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowSmsModal(false); setSmsResult(null); }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={handleSendSms} disabled={smsSending || !smsPhone.trim()}>
                  {smsSending ? (lang === 'sw' ? 'Inatuma...' : 'Sending...') : (lang === 'sw' ? 'Tuma SMS' : 'Send SMS')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}

    {/* Close Duka Modal */}
    {showEodModal && (
      <div className="modal-overlay" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
        <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
          <div className="modal-header">
            <h3 className="modal-title">{t.closeDukaTitle}</h3>
            <button className="modal-close" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {eodResult ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                background: eodResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${eodResult.success ? '#10b981' : '#ef4444'}`
              }}>
                {eodResult.success ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                )}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: th.text, margin: '0 0 8px' }}>
                {eodResult.success ? t.reportSent : t.failed}
              </h4>
              {!eodResult.success && <p style={{ fontSize: '13px', color: '#ef4444' }}>{eodResult.error}</p>}
              <button onClick={() => { setShowEodModal(false); setEodResult(null); }}
                style={{ marginTop: '16px', padding: '10px 32px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>OK</button>
            </div>
          ) : (
            <>
              <div className="modal-body">
                <div className="flex flex-col" style={{ gap: '4px' }}>
                  <label className="text-small" style={{ fontWeight: 600, color: th.text }}>
                    {t.recipientPhone}
                  </label>
                  <input type="tel" value={eodPhone} onChange={e => setEodPhone(e.target.value)}
                    className="input input-lg" placeholder="255XXXXXXXXX" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={handleCloseDuka} disabled={eodSending || !eodPhone.trim()}>
                  {eodSending ? t.sending : t.sendReport}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
  );
};

export default Reports;
