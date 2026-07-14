import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { sendSMS, generateReportSMS } from '../services/smsService';

const Dashboard = ({ supabase, currentShop, isDarkMode, lang, setActivePage, theme }) => {
  const [stats, setStats] = useState({ todaySales: 0, todayProfit: 0, productsCount: 0, customersCount: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [showEodModal, setShowEodModal] = useState(false);
  const [eodPhone, setEodPhone] = useState(currentShop?.phone || '');
  const [eodSending, setEodSending] = useState(false);
  const [eodResult, setEodResult] = useState(null);
  const autoSentRef = useRef({});

  const isSw = lang === 'sw';
  const th = theme || {};

  const formatCurrency = (amount) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  useEffect(() => {
    if (!currentShop?.id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [prodRes, custRes, todayTxRes, lowStockRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
          supabase.from('transactions').select('total_amount, profit').eq('shop_id', currentShop.id).gte('created_at', today),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', currentShop.id).lt('stock', 5).gt('stock', -1),
        ]);
        const todaySales = (todayTxRes.data || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
        const todayProfit = (todayTxRes.data || []).reduce((s, tx) => s + (tx.profit || 0), 0);
        setStats({ todaySales, todayProfit, productsCount: prodRes.count || 0, customersCount: custRes.count || 0, lowStock: lowStockRes.count || 0 });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [currentShop, supabase]);

  useEffect(() => {
    if (!currentShop?.id) return;
    const checkAutoClose = async () => {
      try {
        const { data: settings } = await supabase.from('sms_settings').select('*').eq('shop_id', currentShop.id).maybeSingle();
        if (!settings || !settings.auto_close_enabled || !settings.is_enabled) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const closeTime = settings.auto_close_time || '22:00';
        if (currentTime < closeTime) return;

        const today = now.toISOString().split('T')[0];
        const sentKey = `${currentShop.id}_${today}`;
        if (autoSentRef.current[sentKey]) return;

        const { data: existingLog } = await supabase.from('sms_logs')
          .select('id').eq('shop_id', currentShop.id).eq('type', 'auto_close')
          .gte('created_at', today).maybeSingle();
        if (existingLog) { autoSentRef.current[sentKey] = true; return; }

        let phone = currentShop?.phone || '';
        if (!phone) {
          const { data: profile } = await supabase.from('profiles').select('phone').eq('id', currentShop.owner_id).maybeSingle();
          phone = profile?.phone || '';
        }
        if (!phone) return;

        const { data: todayTx } = await supabase.from('transactions')
          .select('total_amount, profit, items_count').eq('shop_id', currentShop.id).gte('created_at', today);
        const totalRevenue = (todayTx || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
        const totalProfit = (todayTx || []).reduce((s, tx) => s + (tx.profit || 0), 0);
        const totalTx = (todayTx || []).length;
        const productsSold = (todayTx || []).reduce((s, tx) => s + (tx.items_count || 0), 0);

        const reportData = { totalRevenue, totalProfit, totalTransactions: totalTx, avgOrderValue: totalTx > 0 ? totalRevenue / totalTx : 0, productsSold, topProducts: [] };
        const message = generateReportSMS(reportData, lang);
        const result = await sendSMS({ to: phone, message });

        await supabase.from('sms_logs').insert({
          shop_id: currentShop.id, recipient: phone, message, type: 'auto_close',
          status: result.success ? 'sent' : 'failed',
          provider_response: result.success ? JSON.stringify(result.data).slice(0, 500) : (result.error?.slice(0, 500) || '')
        });
        autoSentRef.current[sentKey] = true;
      } catch (e) { console.warn('Auto close SMS error:', e); }
    };

    checkAutoClose();
    const interval = setInterval(checkAutoClose, 60000);
    return () => clearInterval(interval);
  }, [currentShop?.id, currentShop?.phone, currentShop?.owner_id, supabase, lang]);

  if (loading) {
    return (
      <div className="flex flex-col gap-lg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '110px', borderRadius: '16px' }} />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: isSw ? 'Mauzo ya Leo' : 'Today Sales', value: formatCurrency(stats.todaySales), icon: <Icons.ShoppingCart size={22} />, gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    { label: isSw ? 'Faida ya Leo' : 'Today Profit', value: formatCurrency(stats.todayProfit), icon: <Icons.BarChart size={22} />, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
    { label: isSw ? 'Bidhaa Zote' : 'Total Products', value: stats.productsCount, icon: <Icons.Box size={22} />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    { label: isSw ? 'Wateja' : 'Customers', value: stats.customersCount, icon: <Icons.Users size={22} />, gradient: 'linear-gradient(135deg, #ec4899, #db2777)', bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  ];

  const quickActions = [
    { page: 'pos', label: isSw ? 'Mauzo Mapya' : 'New Sale', desc: isSw ? 'Anza kuuza sasa' : 'Start selling now', icon: <Icons.ShoppingCart size={20} />, color: '#10b981' },
    { page: 'products', label: isSw ? 'Ongeza Bidhaa' : 'Add Product', desc: isSw ? 'Ingiza bidhaa mpya' : 'Add new product', icon: <Icons.Plus size={20} />, color: '#f59e0b' },
    { page: 'customers', label: isSw ? 'Ongeza Mteja' : 'Add Customer', desc: isSw ? 'Sajili mteja mpya' : 'Register customer', icon: <Icons.Users size={20} />, color: '#ec4899' },
    { page: 'reports', label: isSw ? 'Tazama Ripoti' : 'View Reports', desc: isSw ? 'Angalia takwimu' : 'Check statistics', icon: <Icons.BarChart size={20} />, color: '#6366f1' },
  ];

  const handleSendEod = async () => {
    if (!eodPhone.trim()) return;
    setEodSending(true);
    setEodResult(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTx } = await supabase.from('transactions').select('total_amount, profit, items_count').eq('shop_id', currentShop.id).gte('created_at', today);
      const totalRevenue = (todayTx || []).reduce((s, tx) => s + (tx.total_amount || 0), 0);
      const totalProfit = (todayTx || []).reduce((s, tx) => s + (tx.profit || 0), 0);
      const totalTx = (todayTx || []).length;
      const productsSold = (todayTx || []).reduce((s, tx) => s + (tx.items_count || 0), 0);

      const { data: settings } = await supabase.from('sms_settings').select('api_key').eq('shop_id', currentShop.id).maybeSingle();
      const apiKey = settings?.api_key || undefined;

      const reportData = {
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        totalTransactions: totalTx,
        avgOrderValue: totalTx > 0 ? totalRevenue / totalTx : 0,
        productsSold: productsSold,
        topProducts: []
      };

      const message = generateReportSMS(reportData, lang);
      const result = await sendSMS({ to: eodPhone, message, apiKey });

      await supabase.from('sms_logs').insert({
        shop_id: currentShop.id,
        recipient: eodPhone,
        message,
        type: 'report',
        status: result.success ? 'sent' : 'failed',
        provider_response: result.success ? JSON.stringify(result.data).slice(0, 500) : (result.error?.slice(0, 500) || '')
      });

      if (result.success) {
        setEodResult({ success: true });
      } else {
        setEodResult({ success: false, error: result.error });
      }
    } catch (e) {
      setEodResult({ success: false, error: e.message });
    } finally {
      setEodSending(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: th.cardBg || '#1e293b',
            border: `1px solid ${th.border || '#334155'}`,
            borderRadius: '16px', padding: '20px 22px',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.25s ease', cursor: 'default'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${card.bg}`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: card.gradient, opacity: 0.06 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: th.textMuted || '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: th.text || '#f1f5f9', lineHeight: 1, letterSpacing: '-0.5px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Welcome Card */}
        <div style={{
          background: th.cardBg || '#1e293b',
          border: `1px solid ${th.border || '#334155'}`,
          borderRadius: '16px', padding: '24px 26px',
          display: 'flex', alignItems: 'center', gap: '18px'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 8px 24px rgba(99,102,241,0.25)'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: th.text || '#f1f5f9', marginBottom: '4px' }}>
              {currentShop?.shop_name || 'KasiTRADE'}
            </div>
            <div style={{ fontSize: '12px', color: th.textMuted || '#94a3b8' }}>
              {new Date().toLocaleDateString(isSw ? 'sw-TZ' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {stats.lowStock > 0 && (
              <div style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#ef4444' }}>
                <Icons.Alert size={14} /> {stats.lowStock} {isSw ? 'bidhaa zina hesabu chini' : 'products low on stock'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: th.cardBg || '#1e293b',
          border: `1px solid ${th.border || '#334155'}`,
          borderRadius: '16px', padding: '18px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
        }}>
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => setActivePage?.(action.page)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '14px 8px', borderRadius: '12px', border: 'none',
              background: 'transparent', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${action.color}10`; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ color: action.color }}>{action.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: th.text || '#f1f5f9' }}>{action.label}</div>
              <div style={{ fontSize: '10px', color: th.textMuted || '#94a3b8' }}>{action.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* End of Day Button */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => { setEodPhone(currentShop?.phone || ''); setEodResult(null); setShowEodModal(true); }}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)'
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="1" />
            <path d="M22 7 13.5 12.5a2 2 0 0 1-2.27.02L2 7" />
          </svg>
          {isSw ? 'Funga Duka - Tuma Ripoti ya Leo kwa SMS' : 'Close Day - Send Today Report via SMS'}
        </button>
      </div>

      {/* End of Day Modal */}
      {showEodModal && (
        <div className="modal-overlay" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{isSw ? 'Funga Duka - Tuma Ripoti' : 'Close Day - Send Report'}</h3>
              <button className="modal-close" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {eodResult ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                  background: eodResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `2px solid ${eodResult.success ? '#10b981' : '#ef4444'}`
                }}>
                  {eodResult.success ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: th.text || '#f1f5f9', margin: '0 0 8px' }}>
                  {eodResult.success ? (isSw ? 'Ripoti Imetumwa!' : 'Report Sent!') : (isSw ? 'Imeshindwa' : 'Failed')}
                </h4>
                {!eodResult.success && <p style={{ fontSize: '13px', color: '#ef4444' }}>{eodResult.error}</p>}
                <button onClick={() => { setShowEodModal(false); setEodResult(null); }}
                  style={{ marginTop: '16px', padding: '10px 32px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>OK</button>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: th.text || '#f1f5f9' }}>
                      {isSw ? 'Mauzo ya Leo' : 'Today Sales'}: <strong>{formatCurrency(stats.todaySales)}</strong> | {isSw ? 'Faida' : 'Profit'}: <strong>{formatCurrency(stats.todayProfit)}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col" style={{ gap: '4px' }}>
                    <label className="text-small" style={{ fontWeight: 600, color: th.text || '#f1f5f9' }}>
                      {isSw ? 'Namba ya Kupokea' : 'Recipient Phone'}
                    </label>
                    <input type="tel" value={eodPhone} onChange={e => setEodPhone(e.target.value)}
                      className="input input-lg" placeholder="255XXXXXXXXX" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => { setShowEodModal(false); setEodResult(null); }}>
                    {isSw ? 'Ghairi' : 'Cancel'}
                  </button>
                  <button className="btn btn-primary" onClick={handleSendEod} disabled={eodSending || !eodPhone.trim()}>
                    {eodSending ? (isSw ? 'Inatuma...' : 'Sending...') : (isSw ? 'Tuma Ripoti' : 'Send Report')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
