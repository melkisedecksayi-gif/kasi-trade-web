import React, { useState } from 'react';
import { PRO_PRICE_TSH } from '../lib/subscription';
import { THEME } from '../theme';

const Billing = ({ subState, lang, theme, isMobile, onPaid }) => {
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState(null);

  const colors = {
    bg: theme === 'dark' ? '#0f172a' : '#f8fafc',
    surface: theme === 'dark' ? '#1e293b' : '#ffffff',
    text: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    textSec: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? '#334155' : '#e2e8f0',
  };

  const isSw = lang === 'sw';
  const title = isSw ? 'Usajili & Malipo' : 'Subscription & Billing';
  const planLabel = isSw ? 'Mkakati Wako' : 'Your Plan';
  const trialLabel = isSw ? 'Jaribio Bure' : 'Free Trial';
  const daysLeftLabel = isSw ? 'siku zilizobaki' : 'days remaining';
  const expiresLabel = isSw ? 'Inaisha' : 'Expires';
  const upgradeTitle = isSw ? 'Panua hadi PRO' : 'Upgrade to PRO';
  const upgradeText = isSw
    ? `Lipa TSh ${PRO_PRICE_TSH.toLocaleString()} kwa mwezi kwa M-Pesa. Utapata kila kitu bila kikomo.`
    : `Pay TSh ${PRO_PRICE_TSH.toLocaleString()} per month via M-Pesa for unlimited access.`;
  const phoneLabel = isSw ? 'Namba ya M-Pesa' : 'M-Pesa number';
  const payBtn = isSw ? `Lipa TSh ${PRO_PRICE_TSH.toLocaleString()}` : `Pay TSh ${PRO_PRICE_TSH.toLocaleString()}`;
  const waiting = isSw ? 'Inasubiri uthibitisho kwenye simu yako...' : 'Waiting for confirmation on your phone...';
  const successMsg = isSw ? 'Malipo yamekamilika! Karibu PRO 🎉' : 'Payment complete! Welcome to PRO 🎉';
  const failedMsg = isSw ? 'Malipo hayajakamilika. Jaribu tena.' : 'Payment not completed. Try again.';
  const activeLabel = isSw ? 'Hali: Hai' : 'Status: Active';
  const invalidPhone = isSw ? 'Weka namba sahihi (mfano: 0712345678)' : 'Enter a valid number (e.g. 0712345678)';

  const handlePay = async () => {
    setPayMsg(null);
    const digits = phone.replace(/\D/g, '');
    if (!/^(255|0)\d{9}$/.test(digits)) {
      setPayMsg({ type: 'error', text: invalidPhone });
      return;
    }
    setPaying(true);
    try {
      const result = await subState.startMpesaPayment(phone);
      if (result.success) {
        setPayMsg({ type: 'success', text: successMsg });
        if (onPaid) onPaid();
      } else {
        setPayMsg({ type: 'error', text: result.error || failedMsg });
      }
    } catch (e) {
      setPayMsg({ type: 'error', text: e.message || failedMsg });
    } finally {
      setPaying(false);
    }
  };

  let upgradeSection = null;
  if (!subState.isPro) {
    upgradeSection = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ margin: '0 0 4px', color: colors.text, fontWeight: 700, fontSize: '15px' }}>{upgradeTitle}</p>
            <p style={{ margin: 0, color: colors.textSec, fontSize: '13px', lineHeight: 1.5 }}>{upgradeText}</p>
          </div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textSec }}>
            {phoneLabel}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              disabled={paying}
              style={{ width: '100%', marginTop: '6px', padding: '12px 14px', borderRadius: THEME.radius?.md || '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '15px', boxSizing: 'border-box' }}
            />
          </label>
          <button
            onClick={handlePay}
            disabled={paying}
            className="btn-micro"
            style={{
              padding: '14px 20px',
              background: paying ? '#94a3b8' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: THEME.radius?.md || '8px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: paying ? 'not-allowed' : 'pointer',
            }}
          >
            {paying ? `⏳ ${waiting}` : `📱 ${payBtn}`}
          </button>
          {payMsg && (
            <p style={{ margin: 0, padding: '10px 14px', borderRadius: THEME.radius?.md || '8px', fontSize: '13px', fontWeight: 600, background: payMsg.type === 'success' ? (theme === 'dark' ? '#14532d' : '#dcfce7') : (theme === 'dark' ? '#451a1a' : '#fee2e2'), color: payMsg.type === 'success' ? (theme === 'dark' ? '#4ade80' : '#166534') : (theme === 'dark' ? '#f87171' : '#991b1b') }}>
              {payMsg.text}
            </p>
          )}
        </div>
      );
  }

  const planBg = subState.isPro
    ? (theme === 'dark' ? '#14532d' : '#f0fdf4')
    : (theme === 'dark' ? '#1e3a5f' : '#eff6ff');
  const planAccent = subState.isPro
    ? (THEME.colors?.success || '#22c55e')
    : (THEME.colors?.primary || '#3b82f6');

  return (
    <div style={{ background: colors.surface, padding: isMobile ? '20px' : '24px', borderRadius: THEME.radius?.lg || '12px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '20px' }} className="card-micro">
      <h3 style={{ margin: 0, color: colors.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>💳 {title}</h3>

      <div style={{ padding: '20px', background: planBg, borderRadius: THEME.radius?.md || '8px', borderLeft: `4px solid ${planAccent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: colors.textSec, fontWeight: 600 }}>{planLabel}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: planAccent }}>
              {subState.isPro ? '⭐ PRO' : `🆓 ${trialLabel}`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: colors.text }}>{subState.daysLeft}</p>
            <p style={{ margin: 0, fontSize: '12px', color: colors.textSec }}>{daysLeftLabel}</p>
          </div>
        </div>
        {subState.expiresAt && (
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: colors.textSec }}>
            {expiresLabel}: {new Date(subState.expiresAt).toLocaleDateString(isSw ? 'sw-TZ' : 'en-GB')} • {activeLabel}
          </p>
        )}
      </div>

      {upgradeSection}
    </div>
  );
};

export default Billing;
