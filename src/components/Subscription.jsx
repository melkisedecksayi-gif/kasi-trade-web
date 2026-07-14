import React, { useState } from 'react';

const SubscriptionPage = ({ lang, isDarkMode, theme, subscription, daysRemaining, statusBadge, activateSubscription, refresh, MONTHLY_PRICE }) => {
  const [paymentStep, setPaymentStep] = useState('select'); // select | confirm | done
  const [paymentMethod, setPaymentMethod] = useState('mobile');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSw = lang === 'sw';
  const th = theme || {};

  const status = subscription?.status || 'expired';
  const isExpired = status === 'expired' || status === 'cancelled';
  const isTrial = status === 'trial';
  const isActive = status === 'active';

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amt).replace(/\sTSh/i, 'TSh ');
  };

  const handleSubmitPayment = async () => {
    if (!paymentRef.trim()) {
      setError(isSw ? 'Ingiza namba ya kumbukumbu ya malipo' : 'Enter payment reference number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await activateSubscription(paymentMethod, paymentRef);
      if (success) {
        setPaymentStep('done');
        if (refresh) refresh();
      } else {
        setError(isSw ? 'Imeshindwa kusasisha. Jaribu tena.' : 'Update failed. Try again.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: th.cardBg || '#ffffff',
    border: `1px solid ${th.border || '#e2e8f0'}`,
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '520px',
    margin: '0 auto',
  };

  const btnPrimary = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  const btnSecondary = {
    width: '100%',
    padding: '14px',
    background: isDarkMode ? '#334155' : '#f1f5f9',
    color: th.text || '#0f172a',
    border: `1px solid ${th.border || '#e2e8f0'}`,
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    border: `2px solid ${th.border || '#e2e8f0'}`,
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    background: isDarkMode ? '#1e293b' : '#fff',
    color: th.text || '#0f172a',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '20px' }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/Logo.png" alt="KasiTRADE" style={{ width: '140px', height: 'auto', marginBottom: '16px' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: th.text || '#0f172a' }}>
            {isSw ? 'Usajili wa Mfumo' : 'System Subscription'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: th.textMuted || '#64748b' }}>
            {isSw ? 'Lipia mwezi mmoja kuendelea kutumia KasiTRADE' : 'Pay for one month to continue using KasiTRADE'}
          </p>
        </div>

        {paymentStep === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
              {isSw ? 'Malipo Yamepokelewa!' : 'Payment Received!'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: th.textMuted || '#64748b' }}>
              {isSw ? 'Asante. Akaunti yako imewashwa kwa mwezi mmoja.' : 'Thank you. Your account is now active for one month.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={btnPrimary}
            >
              {isSw ? 'Anza Kutumia KasiTRADE' : 'Start Using KasiTRADE'}
            </button>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div style={{
              background: isTrial ? '#fef3c7' : isActive ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${isTrial ? '#fcd34d' : isActive ? '#6ee7b7' : '#fca5a5'}`,
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: statusBadge?.color || '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isSw ? 'HALI YA AKAUNTI' : 'ACCOUNT STATUS'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: statusBadge?.color || '#0f172a' }}>
                {isTrial && (isSw ? `Majaribio - Siku ${daysRemaining} Zimebaki` : `Trial - ${daysRemaining} Days Left`)}
                {isActive && (isSw ? `Inatumika - Siku ${daysRemaining} Zimebaki` : `Active - ${daysRemaining} Days Left`)}
                {isExpired && (isSw ? 'Imekwisha - Lipia Kuendelea' : 'Expired - Pay to Continue')}
              </div>
            </div>

            {/* Plan Card */}
            <div style={{
              background: isDarkMode ? '#1e293b' : '#f8fafc',
              border: `2px solid #6366f1`,
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: th.text || '#0f172a' }}>
                    {isSw ? 'Mpango wa Kila Mwezi' : 'Monthly Plan'}
                  </div>
                  <div style={{ fontSize: '12px', color: th.textMuted || '#64748b', marginTop: '2px' }}>
                    {isSw ? 'Mfumo wote, huduma zote' : 'Full system, all features'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1' }}>
                    {formatCurrency(MONTHLY_PRICE)}
                  </div>
                  <div style={{ fontSize: '11px', color: th.textMuted || '#64748b' }}>
                    {isSw ? '/ kwa mwezi' : '/ month'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  isSw ? 'Mauzo (POS)' : 'Point of Sale (POS)',
                  isSw ? 'Usimamizi wa Bidhaa' : 'Product Management',
                  isSw ? 'Usimamizi wa Wateja' : 'Customer Management',
                  isSw ? 'Ripoti Kamili' : 'Full Reports',
                  isSw ? 'Usimamizi wa Matumizi' : 'Expense Management',
                  isSw ? 'Usimamizi wa Wasambazaji' : 'Supplier Management',
                  isSw ? 'Ujumbe wa SMS kwa Wateja' : 'Customer SMS Notifications',
                ].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: th.textMuted || '#64748b' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: th.text || '#0f172a', marginBottom: '10px' }}>
                {isSw ? 'NJIA YA MALIPO' : 'PAYMENT METHOD'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { id: 'mobile', label: 'M-Pesa / Tigo Pesa / Airtel', short: isSw ? 'Simu' : 'Mobile' },
                  { id: 'bank', label: isSw ? 'Benki' : 'Bank Transfer', short: isSw ? 'Benki' : 'Bank' },
                  { id: 'cash', label: isSw ? 'Taslimu (Ofisini)' : 'Cash (Office)', short: isSw ? 'Taslimu' : 'Cash' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: '12px 8px',
                      border: `2px solid ${paymentMethod === method.id ? '#6366f1' : (th.border || '#e2e8f0')}`,
                      borderRadius: '10px',
                      background: paymentMethod === method.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                      cursor: 'pointer',
                      color: paymentMethod === method.id ? '#6366f1' : (th.text || '#0f172a'),
                      fontWeight: paymentMethod === method.id ? '700' : '500',
                      fontSize: '12px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {method.short}
                  </button>
                ))}
              </div>

              {/* Payment Instructions */}
              <div style={{
                background: isDarkMode ? '#1e293b' : '#f0f7ff',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: th.text || '#0f172a',
                lineHeight: '1.6',
              }}>
                {paymentMethod === 'mobile' && (
                  <div>
                    <div style={{ fontWeight: '700', marginBottom: '6px', color: '#6366f1' }}>
                      {isSw ? 'Lipa kupitia Simu:' : 'Pay via Mobile Money:'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isSw ? 'Namba ya Malipo:' : 'Payment Number:'}</span>
                      <span style={{ fontWeight: '700' }}>0712 345 678</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isSw ? 'Jina:' : 'Name:'}</span>
                      <span style={{ fontWeight: '700' }}>KasiTRADE</span>
                    </div>
                  </div>
                )}
                {paymentMethod === 'bank' && (
                  <div>
                    <div style={{ fontWeight: '700', marginBottom: '6px', color: '#6366f1' }}>
                      {isSw ? 'Lipa kupitia Benki:' : 'Pay via Bank:'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isSw ? 'Benki:' : 'Bank:'}</span>
                      <span style={{ fontWeight: '700' }}>NMB / CRDB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isSw ? 'Akaunti:' : 'Account:'}</span>
                      <span style={{ fontWeight: '700' }}>0123456789</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isSw ? 'Jina:' : 'Name:'}</span>
                      <span style={{ fontWeight: '700' }}>KasiTRADE</span>
                    </div>
                  </div>
                )}
                {paymentMethod === 'cash' && (
                  <div>
                    <div style={{ fontWeight: '700', marginBottom: '6px', color: '#6366f1' }}>
                      {isSw ? 'Lipa Taslimu Ofisini:' : 'Pay Cash at Office:'}
                    </div>
                    <div>{isSw ? 'Tembelea ofisi zetu Dar es Salaam kulipia.' : 'Visit our office in Dar es Salaam to pay.'}</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: th.text || '#0f172a', marginBottom: '6px' }}>
                  {isSw ? 'Namba ya Kumbukumbu ya Malipo' : 'Payment Reference Number'}
                </div>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={isSw ? 'Mf: LVA7X9K2M3' : 'e.g. LVA7X9K2M3'}
                  style={inputStyle}
                />
                <div style={{ fontSize: '11px', color: th.textMuted || '#94a3b8', marginTop: '4px' }}>
                  {isSw ? 'Baada ya kulipa, ingiza namba ya muamala hapa' : 'After payment, enter the transaction ID here'}
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
                borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '14px'
              }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmitPayment} disabled={loading} style={btnPrimary}>
              {loading
                ? (isSw ? 'Inasubiri...' : 'Processing...')
                : (isSw ? `Thibitisha Malipo ya ${formatCurrency(MONTHLY_PRICE)}` : `Confirm ${formatCurrency(MONTHLY_PRICE)} Payment`)
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: th.textMuted || '#94a3b8', marginTop: '12px' }}>
              {isSw ? 'Kwa msaada piga: 0712 345 678' : 'For support call: 0712 345 678'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
