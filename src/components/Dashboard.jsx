import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { AreaChart, BarChart, DonutChart, Sparkline } from './Charts';
import getStyles from '../stylePresets';
import logger from '../utils/logger';

const COLORS = {
  primary: '#6366f1', purple: '#8b5cf6', success: '#10b981', warning: '#f59e0b',
  danger: '#ef4444', info: '#06b6d4', pink: '#ec4899', lime: '#84cc16',
  orange: '#f97316', teal: '#14b8a6',
};

const Dashboard = ({ supabase, currentShop, isDarkMode, lang, setActivePage }) => {
  const [stats, setStats] = useState({ todaySales: 0, todayProfit: 0, productsCount: 0, customersCount: 0, lowStock: 0 });
  const [chartData, setChartData] = useState({ weeklySales: [], topProducts: [], categorySales: [], recentTx: [] });
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
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const weekStart = sevenDaysAgo.toISOString().split('T')[0];

        const [prodRes, custRes, todayTxRes, lowStockRes, weekTxRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('transactions').select('total_amount, profit').eq('shop_id', currentShop.id).gte('created_at', todayStr),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', currentShop.id).lt('stock', 5).gt('stock', -1),
          supabase.from('transactions').select('id, total_amount, profit, payment_method, created_at').eq('shop_id', currentShop.id).gte('created_at', weekStart).order('created_at', { ascending: false }),
        ]);

        const todaySales = (todayTxRes.data || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
        const todayProfit = (todayTxRes.data || []).reduce((s, tx) => s + (tx.profit || 0), 0);
        setStats({ todaySales, todayProfit, productsCount: prodRes.count || 0, customersCount: custRes.count || 0, lowStock: lowStockRes.count || 0 });

        const allWeekTx = weekTxRes.data || [];

        const dayNames = [];
        const daySales = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          dayNames.push(d.toLocaleDateString(isSw ? 'sw-TZ' : 'en-US', { weekday: 'short' }));
          const dayTotal = allWeekTx.filter(tx => tx.created_at?.startsWith(ds)).reduce((s, tx) => s + (tx.total_amount || 0), 0);
          daySales.push(dayTotal);
        }

        const txIds = allWeekTx.map(tx => tx.id);
        let allItems = [];
        if (txIds.length > 0) {
          const chunkSize = 100;
          for (let i = 0; i < txIds.length; i += chunkSize) {
            const chunk = txIds.slice(i, i + chunkSize);
            const { data: items } = await supabase.from('transaction_items').select('product_name, quantity, total_price').in('transaction_id', chunk);
            if (items) allItems = allItems.concat(items);
          }
        }

        const productMap = {};
        allItems.forEach(item => {
          const name = item.product_name || 'Unknown';
          if (!productMap[name]) productMap[name] = { name, total: 0, quantity: 0 };
          productMap[name].total += item.total_price || 0;
          productMap[name].quantity += item.quantity || 0;
        });
        const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 5);

        const productsRes = await supabase.from('products').select('category').eq('shop_id', currentShop.id).not('category', 'is', null);
        const catCounts = {};
        (productsRes.data || []).forEach(p => {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        });
        const categoryData = Object.entries(catCounts).map(([cat, count]) => {
          const labelMap = { food: isSw ? 'Vyakula' : 'Food', drinks: isSw ? 'Vinywaji' : 'Drinks', clothing: isSw ? 'Mavazi' : 'Clothing', electronics: isSw ? 'Elektroniki' : 'Electronics', home: isSw ? 'Nyumbani' : 'Home', medicine: isSw ? 'Dawa' : 'Medicine', gift: isSw ? 'Zawadi' : 'Gift', shopping: isSw ? 'Ununuzi' : 'Shopping', beauty: isSw ? 'Uzuri' : 'Beauty', other: isSw ? 'Mengineyo' : 'Other' };
          return { label: labelMap[cat] || cat, value: count };
        }).sort((a, b) => b.value - a.value);

        const recentTx = allWeekTx.slice(0, 5).map(tx => ({
          id: tx.id?.slice(0, 8) || '',
          amount: tx.total_amount,
          profit: tx.profit,
          method: tx.payment_method,
          time: tx.created_at ? new Date(tx.created_at).toLocaleTimeString(isSw ? 'sw-TZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        }));

        setChartData({ weeklySales: daySales, weekLabels: dayNames, topProducts, categorySales: categoryData, recentTx });
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

  const weekTotal = chartData.weeklySales.reduce((a, b) => a + b, 0);
  const prevWeekSales = weekTotal > 0 ? Math.round(stats.todaySales / (weekTotal / 7) * 100 - 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '110px', borderRadius: '16px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          <div className="skeleton" style={{ height: '310px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ height: '310px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

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

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        {/* Sales Trend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">{isSw ? 'Mwenendo wa Mauzo' : 'Sales Trend'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isSw ? 'Siku 7 zilizopita' : 'Last 7 days'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`chart-card-badge ${prevWeekSales >= 0 ? 'up' : 'down'}`}>
                {prevWeekSales > 0 ? '↑' : '↓'} {Math.abs(prevWeekSales)}% {isSw ? 'dhidi ya wastani' : 'vs avg'}
              </span>
            </div>
          </div>
          <AreaChart
            data={chartData.weeklySales}
            width={500} height={240}
            color={COLORS.primary}
            gradientId="dashboardArea"
            labels={chartData.weekLabels}
            formatY={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
          />
        </div>

        {/* Revenue Summary Card */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card-header">
            <div className="chart-card-title">{isSw ? 'Muhtasari wa Wiki' : 'Week Summary'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <SummaryTile
                label={isSw ? 'Jumla ya Wiki' : 'Week Total'}
                value={formatCurrency(weekTotal)}
                color={COLORS.primary}
                icon={<Icons.BarChart size={16} />}
                isDark={isDarkMode}
              />
              <SummaryTile
                label={isSw ? 'Wastani/Siku' : 'Avg/Day'}
                value={formatCurrency(weekTotal / 7)}
                color={COLORS.purple}
                icon={<Icons.Clock size={16} />}
                isDark={isDarkMode}
              />
              <SummaryTile
                label={isSw ? 'Mauzo ya Juu' : 'Best Day'}
                value={formatCurrency(Math.max(...chartData.weeklySales, 0))}
                color={COLORS.success}
                icon={<Icons.TrendUp size={16} />}
                isDark={isDarkMode}
              />
              <SummaryTile
                label={isSw ? 'Wastani wa Ununuzi' : 'Tx Count'}
                value={chartData.recentTx.length > 0 ? `${chartData.recentTx.length}` : '0'}
                color={COLORS.warning}
                icon={<Icons.ShoppingCart size={16} />}
                isDark={isDarkMode}
              />
            </div>

            {chartData.weeklySales.length > 0 && (
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isSw ? 'Mwenendo' : 'Trend'}
                </div>
                <Sparkline data={chartData.weeklySales} width={280} height={40} color={COLORS.primary} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        {/* Top Products Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">{isSw ? 'Bidhaa Zinazouzwa Zaidi' : 'Top Selling Products'}</div>
          </div>
          {chartData.topProducts.length > 0 ? (
            <BarChart
              data={chartData.topProducts.map(p => ({ label: p.name, value: p.total }))}
              width={460} height={230}
              color={COLORS.purple}
              formatY={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
            />
          ) : (
            <EmptyPlaceholder text={isSw ? 'Hakuna mauzo wiki hii' : 'No sales this week'} />
          )}
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">{isSw ? 'Mgawanyo wa Bidhaa' : 'Category Breakdown'}</div>
          </div>
          {chartData.categorySales.length > 0 ? (
            <DonutChart
              data={chartData.categorySales.map(c => ({ label: c.label, value: c.value }))}
              size={200}
              thickness={36}
            />
          ) : (
            <EmptyPlaceholder text={isSw ? 'Hakuna kategoria' : 'No categories'} />
          )}
        </div>
      </div>

      {/* Bottom Row: Welcome + Recent Tx + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        {/* Welcome Card */}
        <div style={{ ...s.card, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: t.shadow.glowMd
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: t.text, marginBottom: '4px' }}>
              {currentShop?.shop_name || 'KasiTRADE'}
            </div>
            <div style={{ fontSize: '12px', color: t.textSecondary }}>
              {new Date().toLocaleDateString(isSw ? 'sw-TZ' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {stats.lowStock > 0 && (
              <div style={{ marginTop: '10px', ...s.badgeDanger, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Alert size={14} /> {stats.lowStock} {isSw ? 'bidhaa zina hesabu chini' : 'products low on stock'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...s.card, padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => setActivePage?.(action.page)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '12px 8px', borderRadius: '12px', border: 'none',
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

        {/* Recent Transactions */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">{isSw ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}</div>
          </div>
          {chartData.recentTx.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {chartData.recentTx.map((tx, i) => (
                <div key={i} className="tx-mini-row">
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: tx.method === 'cash' ? 'rgba(16,185,129,0.1)' : tx.method === 'mobile' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: tx.method === 'cash' ? '#10b981' : tx.method === 'mobile' ? '#6366f1' : '#f59e0b', fontSize: '14px'
                  }}>
                    {tx.method === 'cash' ? '💵' : tx.method === 'mobile' ? '📱' : '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(tx.amount)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {tx.time} · {tx.method === 'cash' ? (isSw ? 'Taslimu' : 'Cash') : tx.method === 'mobile' ? (isSw ? 'Simu' : 'Mobile') : (isSw ? 'Kadi' : 'Card')}
                    </div>
                  </div>
                  {tx.profit > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>
                      +{formatCurrency(tx.profit)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder text={isSw ? 'Hakuna miamala bado' : 'No transactions yet'} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================== Sub-components ==================== */

function SummaryTile({ label, value, color, icon, isDark }) {
  return (
    <div style={{
      background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.8)',
      borderRadius: '12px', padding: '14px', border: '1px solid var(--border-muted)',
      display: 'flex', flexDirection: 'column', gap: '6px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{value}</span>
    </div>
  );
}

function EmptyPlaceholder({ text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '8px', minHeight: '180px' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{text}</span>
    </div>
  );
}

export default Dashboard;
