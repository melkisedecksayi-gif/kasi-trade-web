import React, { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { THEME, getThemeColors } from '../theme';
import Toast from './Toast';

const fmt = (val) => { if (val == null || val === '') return '0'; const n = Number(val); return isNaN(n) ? '0' : n.toLocaleString(); };

const Reports = ({ supabase, lang, userId, theme, showToast: parentShowToast, mode = 'admin', session }) => {
  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);
  const t = translations[lang]?.reports || translations.sw.reports;
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [toast, setToast] = useState(null);

  const effectiveUserId = userId || session?.user?.id;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (parentShowToast) parentShowToast(message, type);
  }, [parentShowToast]);

  useEffect(() => {
    if (!supabase || !effectiveUserId) return;
    let active = true;
    const fetchSales = async () => {
      try {
        setLoading(true);
        let query = supabase.from('sales').select('*').eq('user_id', effectiveUserId).order('created_at', { ascending: false });
        
        const now = new Date();
        if (dateRange === 'today') {
          const start = new Date(now.setHours(0,0,0,0)).toISOString();
          const end = new Date(now.setHours(23,59,59,999)).toISOString();
          query = query.gte('created_at', start).lte('created_at', end);
        } else if (dateRange === 'week') {
          const start = new Date(now);
          start.setDate(now.getDate() - 7);
          query = query.gte('created_at', start.toISOString());
        } else if (dateRange === 'month') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          query = query.gte('created_at', start.toISOString());
        } else if (dateRange === 'year') {
          const start = new Date(now.getFullYear(), 0, 1);
          query = query.gte('created_at', start.toISOString());
        }
        
        const { data, error } = await query;
        if (error) throw error;
        if (active) setSales(Array.isArray(data) ? data : []);
      } catch (err) { 
        console.error(err); 
        showToast('❌ Hitilafu ya kupakia ripoti', 'error');
      } finally { if (active) setLoading(false); }
    };
    fetchSales();
    return () => { active = false; };
  }, [supabase, effectiveUserId, dateRange, showToast]);

  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalProfit = sales.reduce((sum, s) => {
    const itemsProfit = (s.items || []).reduce((p, i) => {
      const profit = ((i.selling_price || i.price || 0) - (i.cost_price || 0)) * (i.qty || 1);
      return p + profit;
    }, 0);
    return sum + itemsProfit;
  }, 0);
  const avgSale = sales.length > 0 ? totalSales / sales.length : 0;

  const topProducts = React.useMemo(() => {
    const productMap = {};
    sales.forEach(s => {
      (s.items || []).forEach(i => {
        const key = i.name || 'Unknown';
        if (!productMap[key]) productMap[key] = { name: key, qty: 0, revenue: 0 };
        productMap[key].qty += i.qty || 1;
        productMap[key].revenue += (i.price || i.selling_price || 0) * (i.qty || 1);
      });
    });
    return Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  const exportCSV = () => {
    const headers = ['Tarehe', 'Risiti', 'Bidhaa', 'Jumla', 'Njia ya Malipo'];
    const rows = sales.map(s => [
      new Date(s.created_at).toLocaleString(),
      s.receipt_number,
      (s.items || []).map(i => i.name).join('; '),
      s.total_amount,
      s.payment_method
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ripoti-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('✅ Ripoti ime-export!', 'success');
  };

  if (mode !== 'admin') {
    return (
      <div style={{ 
        background: colors.surface, 
        padding: isMobile ? '40px 20px' : '60px 20px', 
        borderRadius: THEME.radius.lg, 
        textAlign: 'center', 
        border: `2px solid ${colors.border}` 
      }}>
        <div style={{ fontSize: isMobile ? '50px' : '64px', marginBottom: isMobile ? '16px' : '20px' }}>🔒</div>
        <h2 style={{ color: colors.text, marginBottom: isMobile ? '10px' : '10px', fontSize: isMobile ? '17px' : '20px' }}>
          {lang === 'sw' ? 'Ripoti ni za Admin Pekee' : 'Reports are Admin Only'}
        </h2>
        <p style={{ color: colors.textSec, fontSize: isMobile ? '14px' : '15px' }}>
          {lang === 'sw' ? 'Badilisha hali kwenda Admin ili kuona ripoti.' : 'Switch to Admin mode to view reports.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: colors.surface, 
      padding: isMobile ? '14px' : THEME.space.xl, 
      borderRadius: THEME.radius.lg, 
      boxShadow: THEME.shadow.sm, 
      border: `2px solid ${colors.border}` 
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ marginBottom: isMobile ? '16px' : THEME.space.xl }}>
        <h2 style={{ margin: `0 0 ${isMobile ? '8px' : '8px'}`, color: colors.text, fontSize: isMobile ? '19px' : '22px' }}>{t.title}</h2>
        <p style={{ margin: 0, color: colors.textSec, fontSize: isMobile ? '13px' : '14px' }}>{t.subtitle}</p>
      </div>

      {/* Date Range Filter */}
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '8px' : THEME.space.s, 
        marginBottom: isMobile ? '16px' : THEME.space.xl, 
        flexWrap: 'wrap',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {['today', 'week', 'month', 'year', 'all'].map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            style={{
              padding: isMobile ? '12px 16px' : `${THEME.space.s} ${THEME.space.m}`,
              background: dateRange === range ? THEME.colors.primary : colors.surface,
              color: dateRange === range ? '#fff' : colors.text,
              border: `2px solid ${colors.border}`,
              borderRadius: THEME.radius.md,
              cursor: 'pointer',
              fontWeight: dateRange === range ? 'bold' : 'normal',
              fontSize: isMobile ? '14px' : '13px',
              flex: isMobile ? '1' : 'none',
              textAlign: 'center'
            }}
          >
            {t[range]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '60px 20px' : '80px 20px' }}>
          <div style={{ display: 'inline-block', width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', border: `4px solid #e2e8f0`, borderTopColor: THEME.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ color: colors.textSec, marginTop: isMobile ? '15px' : '20px', fontSize: isMobile ? '14px' : '16px' }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
        </div>
      ) : sales.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '60px 20px' : '80px 20px', 
          background: isDark ? THEME.colors.surfaceDark : '#f8fafc', 
          borderRadius: THEME.radius.md,
          border: `2px dashed ${colors.border}`
        }}>
          <div style={{ fontSize: isMobile ? '50px' : '60px', marginBottom: isMobile ? '12px' : '16px' }}>📊</div>
          <p style={{ color: colors.text, fontSize: isMobile ? '15px' : '16px', fontWeight: '500' }}>{t.noSales}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '12px' : THEME.space.m, 
            marginBottom: isMobile ? '16px' : THEME.space.xl 
          }}>
            <div style={{ 
              padding: isMobile ? '14px' : THEME.space.l, 
              background: isDark ? '#1e3a5f' : '#eff6ff', 
              borderRadius: THEME.radius.md, 
              borderLeft: `4px solid ${THEME.colors.primary}` 
            }}>
              <p style={{ margin: `0 0 ${isMobile ? '8px' : '8px'}`, color: '#60a5fa', fontSize: isMobile ? '12px' : '13px', fontWeight: '600' }}>{t.totalSales}</p>
              <p style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.5rem', fontWeight: '700', color: colors.text }}>{fmt(totalSales)} TSh</p>
            </div>
            <div style={{ 
              padding: isMobile ? '14px' : THEME.space.l, 
              background: isDark ? '#14532d' : '#f0fdf4', 
              borderRadius: THEME.radius.md, 
              borderLeft: `4px solid ${THEME.colors.success}` 
            }}>
              <p style={{ margin: `0 0 ${isMobile ? '8px' : '8px'}`, color: '#4ade80', fontSize: isMobile ? '12px' : '13px', fontWeight: '600' }}>{t.totalProfit}</p>
              <p style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.5rem', fontWeight: '700', color: colors.text }}>{fmt(totalProfit)} TSh</p>
            </div>
            <div style={{ 
              padding: isMobile ? '14px' : THEME.space.l, 
              background: isDark ? '#4c1d95' : '#faf5ff', 
              borderRadius: THEME.radius.md, 
              borderLeft: `4px solid #a855f7` 
            }}>
              <p style={{ margin: `0 0 ${isMobile ? '8px' : '8px'}`, color: '#a855f7', fontSize: isMobile ? '12px' : '13px', fontWeight: '600' }}>{t.totalTransactions}</p>
              <p style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.5rem', fontWeight: '700', color: colors.text }}>{sales.length}</p>
            </div>
            <div style={{ 
              padding: isMobile ? '14px' : THEME.space.l, 
              background: isDark ? '#78350f' : '#fffbeb', 
              borderRadius: THEME.radius.md, 
              borderLeft: `4px solid ${THEME.colors.warning}` 
            }}>
              <p style={{ margin: `0 0 ${isMobile ? '8px' : '8px'}`, color: THEME.colors.warning, fontSize: isMobile ? '12px' : '13px', fontWeight: '600' }}>{t.avgSale}</p>
              <p style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.5rem', fontWeight: '700', color: colors.text }}>{fmt(avgSale)} TSh</p>
            </div>
          </div>

          {/* Top Products */}
          <div style={{ 
            background: isDark ? THEME.colors.surfaceDark : '#f8fafc', 
            padding: isMobile ? '14px' : THEME.space.l, 
            borderRadius: THEME.radius.md, 
            marginBottom: isMobile ? '16px' : THEME.space.xl, 
            border: `2px solid ${colors.border}` 
          }}>
            <h3 style={{ margin: `0 0 ${isMobile ? '12px' : '16px'}`, color: colors.text, fontSize: isMobile ? '16px' : '18px' }}>🏆 {t.topProducts}</h3>
            {topProducts.length === 0 ? (
              <p style={{ color: colors.textSec, margin: 0, fontSize: isMobile ? '13px' : '14px' }}>{t.noData}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : THEME.space.s }}>
                {topProducts.map((p, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: isMobile ? '10px' : THEME.space.s, 
                    background: colors.surface, 
                    borderRadius: THEME.radius.sm, 
                    border: `2px solid ${colors.border}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : THEME.space.m, flex: 1 }}>
                      <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : colors.textSec, minWidth: '30px' }}>
                        #{i + 1}
                      </span>
                      <span style={{ color: colors.text, fontWeight: '500', fontSize: isMobile ? '13px' : '14px', wordBreak: 'break-word' }}>{p.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: isMobile ? '10px' : 'auto' }}>
                      <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: colors.textSec }}>{p.qty} units</p>
                      <p style={{ margin: 0, fontSize: isMobile ? '12px' : '13px', color: THEME.colors.success, fontWeight: 'bold' }}>{fmt(p.revenue)} TSh</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales Table */}
          <div style={{ 
            background: isDark ? THEME.colors.surfaceDark : '#f8fafc', 
            padding: isMobile ? '14px' : THEME.space.l, 
            borderRadius: THEME.radius.md, 
            border: `2px solid ${colors.border}` 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: isMobile ? '12px' : THEME.space.m, 
              flexWrap: 'wrap', 
              gap: isMobile ? '10px' : THEME.space.s,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <h3 style={{ margin: 0, color: colors.text, fontSize: isMobile ? '16px' : '18px' }}>📋 {lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}</h3>
              <button 
                onClick={exportCSV} 
                style={{ 
                  padding: isMobile ? '10px 16px' : `${THEME.space.s} ${THEME.space.m}`, 
                  background: THEME.colors.success, 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: THEME.radius.md, 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '13px' : '13px' 
                }}
              >
                {t.exportCSV}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '12px' : '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ textAlign: 'left', padding: isMobile ? '8px' : '10px', color: colors.textSec, fontSize: isMobile ? '11px' : '12px', fontWeight: '600' }}>{lang === 'sw' ? 'Tarehe' : 'Date'}</th>
                    <th style={{ textAlign: 'left', padding: isMobile ? '8px' : '10px', color: colors.textSec, fontSize: isMobile ? '11px' : '12px', fontWeight: '600' }}>{lang === 'sw' ? 'Risiti' : 'Receipt'}</th>
                    <th style={{ textAlign: 'left', padding: isMobile ? '8px' : '10px', color: colors.textSec, fontSize: isMobile ? '11px' : '12px', fontWeight: '600' }}>{lang === 'sw' ? 'Bidhaa' : 'Items'}</th>
                    <th style={{ textAlign: 'right', padding: isMobile ? '8px' : '10px', color: colors.textSec, fontSize: isMobile ? '11px' : '12px', fontWeight: '600' }}>{lang === 'sw' ? 'Jumla' : 'Total'}</th>
                    <th style={{ textAlign: 'right', padding: isMobile ? '8px' : '10px', color: colors.textSec, fontSize: isMobile ? '11px' : '12px', fontWeight: '600' }}>{lang === 'sw' ? 'Malipo' : 'Payment'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: isMobile ? '8px' : '10px', color: colors.text, fontSize: isMobile ? '11px' : '13px' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: isMobile ? '8px' : '10px', color: colors.textSec, fontFamily: 'monospace', fontSize: isMobile ? '10px' : '12px' }}>#{s.receipt_number}</td>
                      <td style={{ padding: isMobile ? '8px' : '10px', color: colors.text, maxWidth: isMobile ? '100px' : '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: isMobile ? '11px' : '13px' }}>
                        {(s.items || []).map(i => i.name).join(', ')}
                      </td>
                      <td style={{ padding: isMobile ? '8px' : '10px', color: THEME.colors.success, fontWeight: 'bold', textAlign: 'right', fontSize: isMobile ? '12px' : '13px' }}>{fmt(s.total_amount)} TSh</td>
                      <td style={{ padding: isMobile ? '8px' : '10px', color: colors.textSec, textAlign: 'right', fontSize: isMobile ? '11px' : '13px' }}>{s.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Reports;