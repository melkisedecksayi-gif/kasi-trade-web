import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { FancyDonut } from './Charts';
import getStyles from '../stylePresets';
import logger from '../utils/logger';

const Dashboard = ({ supabase, currentShop, isDarkMode, lang, setActivePage }) => {
  const [stats, setStats] = useState({ todaySales: 0, todayProfit: 0, productsCount: 0, customersCount: 0, lowStock: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSw = lang === 'sw';
  const s = getStyles(isDarkMode);
  const t = s.t;

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);
  const formatNumber = (n) => n?.toLocaleString?.() || '0';

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const [prodRes, custRes, todayTxRes, lowStockRes, catRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('transactions').select('total_amount, profit').eq('shop_id', currentShop.id).gte('created_at', today),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', currentShop.id).lt('stock', 5).gt('stock', -1),
          supabase.from('products').select('category').eq('shop_id', currentShop.id).not('category', 'is', null),
        ]);

        const todaySales = (todayTxRes.data || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
        const todayProfit = (todayTxRes.data || []).reduce((s, tx) => s + (tx.profit || 0), 0);
        setStats({ todaySales, todayProfit, productsCount: prodRes.count || 0, customersCount: custRes.count || 0, lowStock: lowStockRes.count || 0 });

        const catCounts = {};
        (catRes.data || []).forEach(p => {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        });
        const labelMap = { food: isSw ? 'Vyakula' : 'Food', drinks: isSw ? 'Vinywaji' : 'Drinks', clothing: isSw ? 'Mavazi' : 'Clothing', electronics: isSw ? 'Elektroniki' : 'Electronics', home: isSw ? 'Nyumbani' : 'Home', medicine: isSw ? 'Dawa' : 'Medicine', gift: isSw ? 'Zawadi' : 'Gift', shopping: isSw ? 'Ununuzi' : 'Shopping', beauty: isSw ? 'Uzuri' : 'Beauty', other: isSw ? 'Nyingine' : 'Other' };
        const data = Object.entries(catCounts)
          .map(([cat, count]) => ({ label: labelMap[cat] || cat, value: count }))
          .sort((a, b) => b.value - a.value);
        setCategoryData(data);
      } catch (e) { logger.error('Dashboard', 'Dashboard data error:', e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [currentShop, supabase, isSw]);

  const statCards = [
    { label: isSw ? 'Mauzo ya Leo' : 'Today Sales', value: formatCurrency(stats.todaySales), icon: <Icons.ShoppingCart size={22} />, gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    { label: isSw ? 'Faida ya Leo' : 'Today Profit', value: formatCurrency(stats.todayProfit), icon: <Icons.BarChart size={22} />, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
    { label: isSw ? 'Bidhaa Zote' : 'Total Products', value: formatNumber(stats.productsCount), icon: <Icons.Box size={22} />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    { label: isSw ? 'Wateja' : 'Customers', value: formatNumber(stats.customersCount), icon: <Icons.Users size={22} />, gradient: 'linear-gradient(135deg, #ec4899, #db2777)', bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  ];

  const quickActions = [
    { page: 'pos', label: isSw ? 'Mauzo Mapya' : 'New Sale', desc: isSw ? 'Anza kuuza sasa' : 'Start selling now', icon: <Icons.ShoppingCart size={20} />, color: '#10b981' },
    { page: 'products', label: isSw ? 'Ongeza Bidhaa' : 'Add Product', desc: isSw ? 'Ingiza bidhaa mpya' : 'Add new product', icon: <Icons.Plus size={20} />, color: '#f59e0b' },
    { page: 'customers', label: isSw ? 'Ongeza Mteja' : 'Add Customer', desc: isSw ? 'Sajili mteja mpya' : 'Register customer', icon: <Icons.Users size={20} />, color: '#ec4899' },
    { page: 'reports', label: isSw ? 'Tazama Ripoti' : 'View Reports', desc: isSw ? 'Angalia takwimu' : 'Check statistics', icon: <Icons.BarChart size={20} />, color: '#6366f1' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '110px', borderRadius: '16px' }} />)}
        </div>
        <div className="skeleton" style={{ height: '340px', borderRadius: '20px' }} />
      </div>
    );
  }

  const totalProducts = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            ...s.statCard, cursor: 'default', transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = s.t.shadow.lg; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = s.t.shadow.sm; }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: card.gradient, opacity: 0.06 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: t.text, lineHeight: 1, letterSpacing: '-0.5px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Fancy Donut Chart + Welcome + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        {/* The Fancy Donut */}
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: '20px',
          padding: '24px', position: 'relative', overflow: 'hidden',
          boxShadow: t.shadow.sm,
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.02))' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(6,182,212,0.02))' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, letterSpacing: '-0.2px' }}>
                {isSw ? 'Mgawanyo wa Bidhaa' : 'Product Categories'}
              </div>
              <div style={{ fontSize: '11px', color: t.textSecondary, marginTop: '2px' }}>
                {totalProducts} {isSw ? 'bidhaa zote' : 'total products'}
              </div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
              background: 'rgba(99,102,241,0.1)', color: '#818cf8', letterSpacing: '0.3px'
            }}>
              {categoryData.length} {isSw ? 'kategoria' : 'categories'}
            </div>
          </div>

          {categoryData.length > 0 ? (
            <FancyDonut
              data={categoryData}
              isDark={isDarkMode}
            />
          ) : (
            <EmptyPlaceholder text={isSw ? 'Hakuna bidhaa bado' : 'No products yet'} />
          )}
        </div>

        {/* Right Column: Welcome + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Welcome Card */}
          <div style={{ ...s.card, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: t.shadow.glowMd
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: t.text, marginBottom: '2px' }}>
                {currentShop?.shop_name || 'KasiTRADE'}
              </div>
              <div style={{ fontSize: '11px', color: t.textSecondary }}>
                {new Date().toLocaleDateString(isSw ? 'sw-TZ' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {stats.lowStock > 0 && (
                <div style={{ marginTop: '8px', ...s.badgeDanger, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Alert size={14} /> {stats.lowStock} {isSw ? 'bidhaa chache' : 'low stock'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ ...s.card, padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', flex: 1 }}>
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => setActivePage?.(action.page)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '4px', padding: '10px 6px', borderRadius: '12px', border: 'none',
                background: 'transparent', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${action.color}10`; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ color: action.color }}>{action.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: t.text }}>{action.label}</div>
                <div style={{ fontSize: '10px', color: t.textSecondary }}>{action.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function EmptyPlaceholder({ text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '8px', minHeight: '180px', position: 'relative', zIndex: 1 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{text}</span>
    </div>
  );
}

export default Dashboard;
