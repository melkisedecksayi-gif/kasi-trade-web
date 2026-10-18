import React, { useState, useEffect } from 'react';
import { THEME, getThemeColors } from '../theme';

const Reports = ({ supabase, lang, shopId, theme, showToast }) => {
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  const colors = getThemeColors(theme === 'dark');

  useEffect(() => {
    fetchReportData();
  }, [shopId, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (dateRange === 'today') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        salesQuery = salesQuery.gte('created_at', startOfDay.toISOString()).lt('created_at', startOfTomorrow.toISOString());
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        salesQuery = salesQuery.gte('created_at', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        salesQuery = salesQuery.gte('created_at', monthAgo.toISOString());
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId);

      if (productsError) throw productsError;

      // Calculate stats
      const totalRevenue = sales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;
      const lowStockCount = products?.filter(p => p.stock_quantity < 5).length || 0;

      setSalesData(sales || []);
      setStats({
        totalSales: sales?.length || 0,
        totalRevenue,
        totalProducts: products?.length || 0,
        lowStock: lowStockCount
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      showToast(lang === 'sw' ? 'Hitilafu ya kupakia ripoti' : 'Error loading report', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: colors.text }}>
        {lang === 'sw' ? 'Inapakia...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: colors.text }}>
          {lang === 'sw' ? 'Ripoti' : 'Reports'}
        </h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{
            padding: '10px 16px',
            background: colors.surface,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: THEME.radius?.md || '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="all">{lang === 'sw' ? 'Zote' : 'All Time'}</option>
          <option value="today">{lang === 'sw' ? 'Leo' : 'Today'}</option>
          <option value="week">{lang === 'sw' ? 'Wiki Hii' : 'This Week'}</option>
          <option value="month">{lang === 'sw' ? 'Mwezi Huu' : 'This Month'}</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          padding: '20px',
          background: colors.surface,
          borderRadius: THEME.radius?.lg || '12px',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${THEME.colors?.primary || '#3b82f6'}`
        }}>
          <h4 style={{ margin: '0 0 8px', color: colors.textSec, fontSize: '13px' }}>
            {lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales'}
          </h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.text }}>
            {stats.totalSales}
          </p>
        </div>

        <div style={{
          padding: '20px',
          background: colors.surface,
          borderRadius: THEME.radius?.lg || '12px',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${THEME.colors?.success || '#22c55e'}`
        }}>
          <h4 style={{ margin: '0 0 8px', color: colors.textSec, fontSize: '13px' }}>
            {lang === 'sw' ? 'Mapato' : 'Revenue'}
          </h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.text }}>
            {stats.totalRevenue.toLocaleString()} TSh
          </p>
        </div>

        <div style={{
          padding: '20px',
          background: colors.surface,
          borderRadius: THEME.radius?.lg || '12px',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${THEME.colors?.warning || '#f59e0b'}`
        }}>
          <h4 style={{ margin: '0 0 8px', color: colors.textSec, fontSize: '13px' }}>
            {lang === 'sw' ? 'Bidhaa' : 'Products'}
          </h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.text }}>
            {stats.totalProducts}
          </p>
        </div>

        <div style={{
          padding: '20px',
          background: colors.surface,
          borderRadius: THEME.radius?.lg || '12px',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${THEME.colors?.error || '#ef4444'}`
        }}>
          <h4 style={{ margin: '0 0 8px', color: colors.textSec, fontSize: '13px' }}>
            {lang === 'sw' ? 'Stock Ndogo' : 'Low Stock'}
          </h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.text }}>
            {stats.lowStock}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div style={{
        background: colors.surface,
        borderRadius: THEME.radius?.lg || '12px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        <h3 style={{ margin: 0, padding: '20px', color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
          {lang === 'sw' ? 'Mauzo Yote' : 'All Sales'}
        </h3>
        {salesData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSec }}>
            {lang === 'sw' ? 'Hakuna mauzo katika kipindi hiki' : 'No sales in this period'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Risiti' : 'Receipt'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Tarehe' : 'Date'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Bidhaa' : 'Items'}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', color: colors.textSec, fontSize: '13px' }}>
                    {lang === 'sw' ? 'Jumla' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', color: colors.text, fontFamily: 'monospace' }}>
                      #{sale.receipt_number}
                    </td>
                    <td style={{ padding: '12px', color: colors.text }}>
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', color: colors.text }}>
                      {sale.items?.length || 0} {lang === 'sw' ? 'bidhaa' : 'items'}
                    </td>
                    <td style={{ padding: '12px', color: THEME.colors?.success || '#22c55e', fontWeight: 'bold', textAlign: 'right' }}>
                      {parseFloat(sale.total_amount).toLocaleString()} TSh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;