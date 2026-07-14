import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import CI from './ColoredIcons';
import { SkeletonList } from './Skeleton';

const Reports = ({ lang, supabase, currentShop, isDarkMode }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);

  useEffect(() => {
    if (!currentShop?.id) return;
    fetchTransactions();
  }, [currentShop, supabase]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
        const sales = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
        const profit = data.reduce((sum, t) => sum + (t.profit || 0), 0);
        setTotalSales(sales);
        setTotalProfit(profit);

        // Today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayTrans = data.filter(t => t.created_at && t.created_at.startsWith(today));
        const todayTotal = todayTrans.reduce((sum, t) => sum + (t.total_amount || 0), 0);
        setTodaySales(todayTotal);
        setTodayTransactions(todayTrans.length);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    border: isDarkMode ? '#334155' : '#e2e8f0'
  };

  const stats = [
    {
      label: lang === 'sw' ? 'Jumla ya Mauzo' : 'Total Sales',
      value: formatCurrency(totalSales),
      icon: Icons.Sales,
      color: '#10b981',
      bgColor: '#10b98120'
    },
    {
      label: lang === 'sw' ? 'Jumla ya Faida' : 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: Icons.Profit,
      color: '#6366f1',
      bgColor: '#6366f120'
    },
    {
      label: lang === 'sw' ? 'Mauzo ya Leo' : "Today's Sales",
      value: formatCurrency(todaySales),
      icon: Icons.Clock,
      color: '#f59e0b',
      bgColor: '#f59e0b20'
    },
    {
      label: lang === 'sw' ? 'Idadi ya Mauzo' : 'Number of Sales',
      value: transactions.length,
      icon: Icons.ShoppingCart,
      color: '#ec4899',
      bgColor: '#ec489920'
    }
  ];

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: theme.bg }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          margin: '0 0 8px',
          fontSize: '28px',
          fontWeight: '800',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Icons.BarChart size={28} />
          {lang === 'sw' ? 'Ripoti za Mauzo' : 'Sales Reports'}
        </h2>
        <p style={{ margin: 0, color: theme.textMuted, fontSize: '14px' }}>
          {lang === 'sw' ? 'Tazama takwimu za mauzo yako' : 'View your sales statistics'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} style={{
              background: theme.cardBg,
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              transition: 'transform 0.2s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color
                }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.textMuted,
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <h3 style={{
        color: theme.text,
        margin: '0 0 16px',
        fontSize: '20px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Icons.List size={20} />
        {lang === 'sw' ? 'Mauzo ya Hivi Karibuni' : 'Recent Transactions'}
      </h3>

      {loading ? (
        <div style={{ padding: '20px 0' }}>
          <SkeletonList count={4} />
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: theme.textMuted
        }}>
          <Icons.BarChart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>{lang === 'sw' ? 'Hakuna mauzo bado' : 'No transactions yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.map((transaction) => (
            <div key={transaction.id} style={{
              background: theme.cardBg,
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'transform 0.2s'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  fontWeight: '600',
                  color: theme.text,
                  marginBottom: '4px',
                  fontSize: '15px'
                }}>
                  #{transaction.id ? transaction.id.slice(0, 8) : '---'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Icons.Clock size={14} />
                  {formatDate(transaction.created_at)}
                </div>
                {transaction.payment_method && (
                  <div style={{
                    fontSize: '12px',
                    color: theme.textMuted,
                    marginTop: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: theme.bg,
                    borderRadius: '6px'
                  }}>
                    <CI.CreditCard size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {transaction.payment_method}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  {formatCurrency(transaction.total_amount || 0)}
                </div>
                {transaction.profit > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6366f1',
                    marginTop: '4px',
                    fontWeight: '600'
                  }}>
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