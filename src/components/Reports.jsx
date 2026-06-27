import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Reports = ({ lang, supabase, currentShop }) => {
  const [period, setPeriod] = useState('week');
  const [transactions, setTransactions] = useState([]); // ✅ Array tupu mwanzoni
  const [loading, setLoading] = useState(true);

  // Fetch real transactions
  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchTransactions = async () => {
      setLoading(true);
      let query = supabase.from('transactions').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      
      const now = new Date();
      if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        query = query.gte('created_at', today);
      } else if (period === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('created_at', weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        query = query.gte('created_at', monthAgo);
      }

      const { data, error } = await query;
      if (!error && data) setTransactions(data);
      setLoading(false);
    };
    fetchTransactions();
  }, [currentShop, period, supabase]);

  // Calculate stats from real data
  const totalSales = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalOrders = transactions.length;
  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Payment methods breakdown
  const paymentMethods = [
    { method: lang === 'sw' ? 'Fedha' : 'Cash', amount: transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + (t.total_amount || 0), 0), icon: Icons.Cash, color: '#10b981' },
    { method: 'Mobile Money', amount: transactions.filter(t => t.payment_method === 'mobile').reduce((sum, t) => sum + (t.total_amount || 0), 0), icon: Icons.Mobile, color: '#6366f1' },
    { method: lang === 'sw' ? 'Kadi' : 'Card', amount: transactions.filter(t => t.payment_method === 'card').reduce((sum, t) => sum + (t.total_amount || 0), 0), icon: Icons.Card, color: '#f59e0b' },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Ripoti na Uchambuzi' : 'Reports & Analytics'}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{currentShop?.shop_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#fff', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {[
            { id: 'today', label: lang === 'sw' ? 'Leo' : 'Today' },
            { id: 'week', label: lang === 'sw' ? 'Wiki Hii' : 'This Week' },
            { id: 'month', label: lang === 'sw' ? 'Mwezi Huu' : 'This Month' }
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              background: period === p.id ? '#0f172a' : 'transparent',
              color: period === p.id ? '#fff' : '#64748b', transition: 'all 0.2s'
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales', value: formatCurrency(totalSales), icon: Icons.Sales, color: '#10b981' },
          { label: lang === 'sw' ? 'Faida Halisi' : 'Net Profit', value: formatCurrency(totalProfit), icon: Icons.Profit, color: '#6366f1' },
          { label: lang === 'sw' ? 'Idadi ya Maagizo' : 'Total Orders', value: totalOrders, icon: Icons.ShoppingCart, color: '#f59e0b' },
          { label: lang === 'sw' ? 'Wastani wa Agizo' : 'Avg Order', value: formatCurrency(avgOrder), icon: Icons.BarChart, color: '#ec4899' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '40px', height: '40px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '12px' }}>
                <Icon size={20} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Njia za Malipo' : 'Payment Methods'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paymentMethods.map((method, index) => {
            const Icon = method.icon;
            const percentage = totalSales > 0 ? (method.amount / totalSales) * 100 : 0;
            return (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={method.color} /> {method.method}
                  </span>
                  <span style={{ fontWeight: '700', color: '#64748b' }}>{percentage.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: method.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{formatCurrency(method.amount)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{lang === 'sw' ? 'Miamala ya Hivi Karibuni' : 'Recent Transactions'}</h3>
          <button style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Download size={14} /> {lang === 'sw' ? 'Pakua' : 'Export'}
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Inapakia...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <Icons.BarChart size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>{lang === 'sw' ? 'Hakuna mauzo kwa kipindi hiki' : 'No transactions for this period'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Mteja', 'Kiasi', 'Njia', 'Muda', 'Hali'].map((h, i) => (
                  <th key={i} style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{transaction.customer_name || 'Walk-in'}</td>
                  <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(transaction.total_amount)}</td>
                  <td style={{ padding: '16px 12px', fontSize: '14px', color: '#64748b', textTransform: 'capitalize' }}>{transaction.payment_method}</td>
                  <td style={{ padding: '16px 12px', fontSize: '14px', color: '#64748b' }}>{new Date(transaction.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#d1fae5', color: '#059669' }}>
                      {lang === 'sw' ? 'Imekamilika' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;