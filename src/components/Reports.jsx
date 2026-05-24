import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// eslint-disable-next-line no-unused-vars
import { translations } from '../translations';

const Reports = ({ supabase, lang = 'sw', t }) => {
  const [stats, setStats] = useState({ totalSales: 0, totalProfit: 0, lowStock: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    
    const { data: sales, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }

    const totalSales = sales?.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0) || 0;
    const totalProfit = sales?.reduce((sum, s) => sum + (parseFloat(s.profit) || (parseFloat(s.total_amount) - parseFloat(s.total_cost))), 0) || 0;

    const { data: products } = await supabase.from('products').select('name, stock_quantity');
    const lowStock = products?.filter(p => p.stock_quantity <= 5).length || 0;

    setStats({ totalSales, totalProfit, lowStock });

    const last7Days = sales?.slice(0, 7).reverse().map(s => ({
      name: new Date(s.created_at).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { weekday: 'short' }),
      Mauzo: parseFloat(s.total_amount) || 0,
      Faida: parseFloat(s.profit) || (parseFloat(s.total_amount) - parseFloat(s.total_cost))
    })) || [];
    setWeeklyData(last7Days);
    setLoading(false);
  }, [supabase, lang]);

  useEffect(() => { 
    fetchReports(); 
  }, [fetchReports]);

  if (loading) return <div style={{padding:'20px', textAlign:'center'}}>{lang === 'sw' ? '🔄 Inapakua ripoti...' : '🔄 Loading reports...'}</div>;

  return (
    <div style={{padding:'20px', fontFamily:'system-ui, sans-serif'}}>
      <h2>📊 {t.reports || 'Reports'}</h2>
      
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'20px'}}>
        <div style={styles.card}><h3>{t.totalSales || 'Total Sales'}</h3><p style={styles.bigNum}>TZS {stats.totalSales.toLocaleString()}</p></div>
        <div style={{...styles.card, background:'#e8f5e9'}}><h3>{t.totalProfit || 'Total Profit'}</h3><p style={{...styles.bigNum, color:'#2e7d32'}}>TZS {stats.totalProfit.toLocaleString()}</p></div>
        <div style={{...styles.card, background:'#fff3e0'}}><h3>{t.lowStock || 'Low Stock'}</h3><p style={{...styles.bigNum, color:'#c62828'}}>{stats.lowStock} {t.items || 'items'}</p></div>
      </div>

      <div style={styles.chartBox}>
        <h3>{lang === 'sw' ? 'Mauzo ya Wiki Hii' : 'Sales This Week'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `TZS ${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="Mauzo" fill="#8884d8" name={lang === 'sw' ? 'Mauzo' : 'Sales'} />
            <Bar dataKey="Faida" fill="#82ca9d" name={lang === 'sw' ? 'Faida' : 'Profit'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const styles = {
  card: {background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 6px rgba(0,0,0,0.05)'},
  bigNum: {fontSize:'24px', fontWeight:'bold', margin:'8px 0 0'},
  chartBox: {background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 6px rgba(0,0,0,0.05)'}
};

export default Reports;