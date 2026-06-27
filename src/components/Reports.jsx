import React, { useState } from 'react';

const Reports = ({ lang, supabase, currentShop }) => {
  // --- STATE MANAGEMENT ---
  const [period, setPeriod] = useState('week'); // 'today', 'week', 'month'

  // --- MOCK DATA (In production, calculate from Supabase transactions) ---
  const reportData = {
    today: { sales: 450000, profit: 120000, expenses: 30000, orders: 12, avgOrder: 37500 },
    week: { sales: 3250000, profit: 850000, expenses: 150000, orders: 85, avgOrder: 38235 },
    month: { sales: 12500000, profit: 3200000, expenses: 600000, orders: 340, avgOrder: 36764 },
  };

  const currentData = reportData[period];

  // Chart Data (Sales Trend)
  const chartData = period === 'today' 
    ? [{time: '8am', val: 40}, {time: '10am', val: 65}, {time: '12pm', val: 85}, {time: '2pm', val: 50}, {time: '4pm', val: 90}, {time: '6pm', val: 75}]
    : period === 'week'
    ? [{time: 'Mon', val: 60}, {time: 'Tue', val: 75}, {time: 'Wed', val: 55}, {time: 'Thu', val: 85}, {time: 'Fri', val: 95}, {time: 'Sat', val: 100}, {time: 'Sun', val: 70}]
    : [{time: 'Wiki 1', val: 70}, {time: 'Wiki 2', val: 85}, {time: 'Wiki 3', val: 65}, {time: 'Wiki 4', val: 90}];

  const paymentMethods = [
    { method: 'Fedha (Cash)', amount: currentData.sales * 0.6, color: '#10b981', icon: '💵' },
    { method: 'Simu (Mobile)', amount: currentData.sales * 0.35, color: '#667eea', icon: '📱' },
    { method: 'Kadi (Card)', amount: currentData.sales * 0.05, color: '#f59e0b', icon: '💳' },
  ];

  const topProducts = [
    { name: 'Mchezo wa Darasa', sold: 145, revenue: 362500, profit: 72500 },
    { name: 'Mafuta ya Kupikia', sold: 85, revenue: 382500, profit: 85000 },
    { name: 'Sukari 1kg', sold: 120, revenue: 360000, profit: 60000 },
    { name: 'Maji ya Mineral', sold: 300, revenue: 300000, profit: 150000 },
    { name: 'Coca Cola 500ml', sold: 210, revenue: 315000, profit: 105000 },
  ];

  // --- HELPERS ---
  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
  const maxChartVal = Math.max(...chartData.map(d => d.val));

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      
      {/* Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            {lang === 'sw' ? 'Ripoti na Uchambuzi' : 'Reports & Analytics'}
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            {lang === 'sw' ? 'Duka: ' : 'Shop: '}{currentShop?.shop_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.8)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)' }}>
          {[
            { id: 'today', label: lang === 'sw' ? 'Leo' : 'Today' },
            { id: 'week', label: lang === 'sw' ? 'Wiki Hii' : 'This Week' },
            { id: 'month', label: lang === 'sw' ? 'Mwezi Huu' : 'This Month' }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                background: period === p.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: period === p.id ? '#fff' : '#64748b',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales', value: formatCurrency(currentData.sales), icon: '💰', color: '#667eea' },
          { label: lang === 'sw' ? 'Faida Halisi' : 'Net Profit', value: formatCurrency(currentData.profit), icon: '📈', color: '#10b981' },
          { label: lang === 'sw' ? 'Gharama' : 'Expenses', value: formatCurrency(currentData.expenses), icon: '📉', color: '#ef4444' },
          { label: lang === 'sw' ? 'Idadi ya Maagizo' : 'Total Orders', value: currentData.orders, icon: '🧾', color: '#f59e0b' },
          { label: lang === 'sw' ? 'Wastani wa Agizo' : 'Avg Order', value: formatCurrency(currentData.avgOrder), icon: '', color: '#8b5cf6' },
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
            padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderLeft: `4px solid ${stat.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Sales Trend Chart */}
        <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
            {lang === 'sw' ? 'Mwenendo wa Mauzo' : 'Sales Trend'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: '220px', gap: '12px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' }}>
            {chartData.map((item, index) => {
              const height = (item.val / maxChartVal) * 100;
              return (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${height}%`, 
                    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)', 
                    borderRadius: '8px 8px 0 0', 
                    transition: 'height 0.5s ease',
                    position: 'relative'
                  }}>
                    <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '700', color: '#667eea' }}>
                      {item.val}%
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
            {lang === 'sw' ? 'Njia za Malipo' : 'Payment Methods'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paymentMethods.map((method, index) => {
              const percentage = (method.amount / currentData.sales) * 100;
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{method.icon}</span> {method.method}
                    </span>
                    <span style={{ fontWeight: '700', color: '#64748b' }}>{percentage.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      background: method.color, 
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{formatCurrency(method.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
            {lang === 'sw' ? 'Bidhaa Zinazouzika Zaidi' : 'Top Selling Products'}
          </h3>
          <button style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#667eea' }}>
            {lang === 'sw' ? 'Pakua PDF' : 'Download PDF'}
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              {['Bidhaa', 'Ziliuzwa', 'Mauzo', 'Faida'].map((h, i) => (
                <th key={i} style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: index === 0 ? '#fef3c7' : index === 1 ? '#e0e7ff' : '#fce7f3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700',
                      color: index === 0 ? '#d97706' : index === 1 ? '#4f46e5' : '#db2777'
                    }}>
                      {index + 1}
                    </span>
                    {product.name}
                  </div>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '14px', color: '#64748b' }}>{product.sold} pcs</td>
                <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{formatCurrency(product.revenue)}</td>
                <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(product.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;