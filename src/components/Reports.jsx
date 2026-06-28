import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const Reports = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTransactions(data);
        const total = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
        const profit = data.reduce((sum, t) => sum + (t.profit || 0), 0);
        setTotalSales(total);
        setTotalProfit(profit);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [currentShop, supabase]);

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const bgColor = isDarkMode ? '#1e293b' : '#fff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg = isDarkMode ? '#334155' : '#f8fafc';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: textColor, margin: '0 0 24px', fontSize: '24px', fontWeight: '700' }}>
        {lang === 'sw' ? 'Ripoti' : 'Reports'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: bgColor, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Icons.Sales size={24} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: subTextColor, marginBottom: '4px' }}>
            {lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div style={{ background: bgColor, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Icons.Profit size={24} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: subTextColor, marginBottom: '4px' }}>
            {lang === 'sw' ? 'Jumla ya Faida' : 'Total Profit'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>
            {formatCurrency(totalProfit)}
          </div>
        </div>

        <div style={{ background: bgColor, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Icons.ShoppingCart size={24} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: subTextColor, marginBottom: '4px' }}>
            {lang === 'sw' ? 'Idadi ya Mauzo' : 'Number of Sales'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {Array.isArray(transactions) ? transactions.length : 0}
          </div>
        </div>
      </div>

      <h3 style={{ color: textColor, margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
        {lang === 'sw' ? 'Mauzo ya Hivi Karibuni' : 'Recent Transactions'}
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: subTextColor }}>
          <p>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
        </div>
      ) : !Array.isArray(transactions) || transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: subTextColor }}>
          <Icons.BarChart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>{lang === 'sw' ? 'Hakuna mauzo bado' : 'No transactions yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.map(transaction => (
            <div key={transaction.id} style={{ background: bgColor, padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                  #{transaction.id?.slice(0, 8) || '---'}
                </div>
                <div style={{ fontSize: '13px', color: subTextColor }}>
                  {formatDate(transaction.created_at)}
                </div>
                {transaction.payment_method && (
                  <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>
                    💳 {transaction.payment_method}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                  {formatCurrency(transaction.total_amount || 0)}
                </div>
                {transaction.profit > 0 && (
                  <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '4px' }}>
                    {lang === 'sw' ? 'Faida' : 'Profit'}: {formatCurrency(transaction.profit)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;