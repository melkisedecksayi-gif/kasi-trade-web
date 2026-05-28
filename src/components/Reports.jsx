import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

const Reports = ({ supabase, lang, userId, theme }) => {
  const isDark = theme === 'dark';
  const t = translations[lang].reports;
  const g = translations[lang].general;
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('table');

  const bg = isDark ? '#1e293b' : '#ffffff';
  const cardBg = isDark ? '#0f172a' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const btnBg = isDark ? '#334155' : '#f1f5f9';
  const btnActive = '#3b82f6';

  useEffect(() => {
    if (!supabase || !userId) return;
    const fetch = async () => {
      try {
        let query = supabase.from('sales').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        const now = new Date();
        if (filter === 'today') {
          const start = now.toISOString().split('T')[0] + 'T00:00:00';
          const end = now.toISOString().split('T')[0] + 'T23:59:59';
          query = query.gte('created_at', start).lt('created_at', end);
        } else if (filter === 'week') {
          const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
          query = query.gte('created_at', start);
        }
        const { data, error } = await query;
        if (error) throw error;
        setSales(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [supabase, userId, filter]);

  const getChartData = () => {
    const days = filter === 'today' ? 1 : filter === 'week' ? 7 : 30;
    const chartData = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.created_at?.startsWith(dateStr));
      const total = daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      chartData.push({ date: dateStr, label: date.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'short', day: 'numeric' }), value: total });
    }
    return chartData;
  };

  const LineChart = ({ data, height = 200 }) => {
    if (!data || data.length === 0) return <p style={{textAlign:'center', color:textSec, padding:'40px'}}>{t.noDataForGraph}</p>;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = 40;
    const chartHeight = height - padding * 2;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value / maxValue) * 100);
      return `${x},${y}`;
    }).join(' ');
    return (
      <div style={{ position: 'relative', width: '100%', height: `${height}px`, background: cardBg, borderRadius: '8px', padding: '20px', boxSizing: 'border-box', border: `1px solid ${border}` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: `${chartHeight}px` }}>
          {[0, 25, 50, 75, 100].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={border} strokeWidth="0.3" />)}
          <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {data.map((d, i) => { const x = (i / (data.length - 1)) * 100; const y = 100 - ((d.value / maxValue) * 100); return <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" />; })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: textSec }}>
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d, i) => <span key={i}>{d.label}</span>)}
        </div>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: textSec, writingMode: 'vertical-rl' }}>TSh</div>
      </div>
    );
  };

  const chartData = getChartData();
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const averageDaily = totalRevenue / (sales.length || 1);
  const peakDay = [...sales].sort((a,b) => (b.total_amount||0) - (a.total_amount||0))[0];

  const exportCSV = () => {
    const headers = ['ID', 'Tarehe', 'Bidhaa', 'Jumla', 'Malipo', 'Risiti'];
    const rows = sales.map(s => [s.id, new Date(s.created_at).toLocaleString(), s.items?.map(i=>i.name).join(', '), s.total_amount, s.payment_method, s.receipt_number]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "mauzo_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={{ background: bg, padding: '20px', borderRadius: '12px', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={()=>setView('table')} style={{ padding: '8px 12px', background: view==='table'?btnActive:btnBg, color: view==='table'?'#fff':textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.title}</button>
          <button onClick={()=>setView('analytics')} style={{ padding: '8px 12px', background: view==='analytics'?btnActive:btnBg, color: view==='analytics'?'#fff':textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.analytics}</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={()=>setFilter('all')} style={{ padding: '8px 12px', background: filter==='all'?btnActive:btnBg, color: filter==='all'?'#fff':textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.dateRange}: Zote</button>
          <button onClick={()=>setFilter('today')} style={{ padding: '8px 12px', background: filter==='today'?btnActive:btnBg, color: filter==='today'?'#fff':textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.dailySales}</button>
          <button onClick={()=>setFilter('week')} style={{ padding: '8px 12px', background: filter==='week'?btnActive:btnBg, color: filter==='week'?'#fff':textMain, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.monthlySales}</button>
          {view === 'table' && <button onClick={exportCSV} style={{ padding: '8px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.exportCSV}</button>}
        </div>
      </div>

      {view === 'analytics' && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px', color: textMain }}>{t.salesTrend}</h3>
          <LineChart data={chartData} height={250} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '15px', background: isDark ? '#1e3a5f' : '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#60a5fa' }}>{t.totalSales}</p>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: textMain }}>{totalRevenue.toLocaleString()} TSh</p>
            </div>
            <div style={{ padding: '15px', background: isDark ? '#14532d' : '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
              <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#4ade80' }}>{t.averageDaily}</p>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: textMain }}>{Math.round(averageDaily).toLocaleString()} TSh</p>
            </div>
            <div style={{ padding: '15px', background: isDark ? '#451a03' : '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#fbbf24' }}>{t.peakDay}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: textMain }}>{peakDay ? `${new Date(peakDay.created_at).toLocaleDateString()}: ${(peakDay.total_amount||0).toLocaleString()} TSh` : '-'}</p>
            </div>
            <div style={{ padding: '15px', background: cardBg, borderRadius: '8px', borderLeft: `4px solid ${border}` }}>
              <p style={{ margin: '0 0 5px', fontSize: '12px', color: textSec }}>{t.transactions}</p>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: textMain }}>{sales.length}</p>
            </div>
          </div>
        </div>
      )}

      {view === 'table' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', background: isDark ? '#1e3a5f' : '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <h4 style={{ margin: '0 0 5px', color: '#60a5fa' }}>{t.totalSales}</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: textMain }}>{totalRevenue.toLocaleString()} TSh</p>
            </div>
            <div style={{ padding: '15px', background: isDark ? '#14532d' : '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
              <h4 style={{ margin: '0 0 5px', color: '#4ade80' }}>{t.transactions}</h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: textMain }}>{sales.length}</p>
            </div>
          </div>
          {loading ? <p style={{textAlign:'center', color:textSec}}>{g.loading}</p> : sales.length === 0 ? <p style={{textAlign:'center', color:textSec}}>{t.noSales}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: cardBg, textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: `2px solid ${border}`, color: textMain }}>Tarehe</th>
                    <th style={{ padding: '12px', borderBottom: `2px solid ${border}`, color: textMain }}>Bidhaa</th>
                    <th style={{ padding: '12px', borderBottom: `2px solid ${border}`, color: textMain }}>{t.totalSales}</th>
                    <th style={{ padding: '12px', borderBottom: `2px solid ${border}`, color: textMain }}>Malipo</th>
                    <th style={{ padding: '12px', borderBottom: `2px solid ${border}`, color: textMain }}>Risiti</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '12px', color: textSec }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: textSec }}>{s.items?.map(i=>`${i.name} x${i.qty}`).join(', ')}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#4ade80' }}>{(s.total_amount||0).toLocaleString()} TSh</td>
                      <td style={{ padding: '12px', color: textSec }}>{s.payment_method}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: textSec }}>#{s.receipt_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;