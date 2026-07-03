import React, { useState, useEffect } from 'react';

const Dashboard = ({ supabase, currentShop, isDarkMode, lang }) => {
  const [stats, setStats] = useState({
    sales: 0,
    products: 0,
    customers: 0,
    lowStock: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
  };

  useEffect(() => {
    if (!currentShop?.id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products count
        const { count: prodCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id);
        
        // Fetch customers count
        const { count: custCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id);
        
        // Fetch low stock count
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id)
          .lt('stock', 10);

        // Fetch today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTrans } = await supabase
          .from('transactions')
          .select('total_amount')
          .eq('shop_id', currentShop.id)
          .gte('created_at', today);
        const todaySales = todayTrans?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

        // Fetch recent transactions
        const { data: recent } = await supabase
          .from('transactions')
          .select('*')
          .eq('shop_id', currentShop.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          sales: todaySales,
          products: prodCount || 0,
          customers: custCount || 0,
          lowStock: lowStockCount || 0
        });
        setTransactions(recent || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentShop, supabase]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const statCards = [
    {
      label: lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales',
      value: formatCurrency(stats.sales),
      icon: '💰',
      color: '#10b981'
    },
    {
      label: lang === 'sw' ? 'Bidhaa' : 'Products',
      value: stats.products,
      icon: '📦',
      color: '#3b82f6'
    },
    {
      label: lang === 'sw' ? 'Wateja' : 'Customers',
      value: stats.customers,
      icon: '👥',
      color: '#8b5cf6'
    },
    {
      label: lang === 'sw' ? 'Stock Ndogo' : 'Low Stock',
      value: stats.lowStock,
      icon: '⚠️',
      color: '#f59e0b'
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: theme.bg
      }}>
        <div style={{ textAlign: 'center', color: theme.text }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px' }}>{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: theme.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          color: theme.text, 
          margin: '0 0 8px' 
        }}>
          {lang === 'sw' ? 'Dashibodi' : 'Dashboard'}
        </h1>
        <p style={{ fontSize: '16px', color: theme.textMuted, margin: 0 }}>
          {currentShop?.shop_name || (lang === 'sw' ? 'Muhtasari wa biashara yako' : 'Business summary')}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: theme.cardBg, 
              padding: '24px', 
              borderRadius: '16px', 
              border: `1px solid ${theme.border}`,
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '12px', 
              background: `${stat.color}20`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '28px' 
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: theme.textMuted }}>
                {stat.label}
              </p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.text }}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Quick Actions */}
        <div style={{ 
          background: theme.cardBg, 
          padding: '24px', 
          borderRadius: '16px', 
          border: `1px solid ${theme.border}` 
        }}>
          <h3 style={{ 
            margin: '0 0 20px', 
            fontSize: '18px', 
            fontWeight: '700', 
            color: theme.text 
          }}>
            {lang === 'sw' ? '⚡ Vitendo vya Haraka' : '⚡ Quick Actions'}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px' 
          }}>
            {[
              { label: lang === 'sw' ? 'Anza Kuuza' : 'Start Sale', icon: '🛒', color: '#6366f1' },
              { label: lang === 'sw' ? 'Ongeza Bidhaa' : 'Add Product', icon: '📦', color: '#10b981' },
              { label: lang === 'sw' ? 'Ongeza Mteja' : 'Add Customer', icon: '👤', color: '#f59e0b' },
              { label: lang === 'sw' ? 'Tazama Ripoti' : 'View Reports', icon: '📊', color: '#ec4899' }
            ].map((action, idx) => (
              <button 
                key={idx} 
                style={{ 
                  padding: '16px', 
                  background: `${action.color}10`, 
                  border: `1px solid ${action.color}30`, 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = `${action.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = `${action.color}10`;
                }}
              >
                <span style={{ fontSize: '24px' }}>{action.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ 
          background: theme.cardBg, 
          padding: '24px', 
          borderRadius: '16px', 
          border: `1px solid ${theme.border}` 
        }}>
          <h3 style={{ 
            margin: '0 0 20px', 
            fontSize: '18px', 
            fontWeight: '700', 
            color: theme.text 
          }}>
            {lang === 'sw' ? '🕒 Mauzo ya Hivi Karibuni' : '🕒 Recent Transactions'}
          </h3>
          {transactions.length === 0 ? (
            <p style={{ 
              color: theme.textMuted, 
              textAlign: 'center', 
              padding: '20px',
              margin: 0
            }}>
              {lang === 'sw' ? 'Hakuna mauzo bado' : 'No transactions yet'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {transactions.map((t) => (
                <div 
                  key={t.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    background: theme.bg, 
                    borderRadius: '10px',
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div>
                    <p style={{ 
                      margin: '0 0 4px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: theme.text 
                    }}>
                      #{t.id ? t.id.slice(0, 8) : '---'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#10b981' 
                  }}>
                    {formatCurrency(t.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;