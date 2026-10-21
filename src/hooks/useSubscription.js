import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const MONTHLY_PRICE = 12000;
const TRIAL_DAYS = 14;

const EDGE_BASE = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1`;
// azampay-push hurudi mara moja; prompt ya malipo hufika kwenye simu muda mfupi baadaye.
// Poll azampay-status kwa muda wa ~2.5 dakika jumla (matokeo huandikwa na azampay-callback).
const PAYMENT_POLL_INTERVAL_MS = 5000;
const PAYMENT_POLL_MAX_ATTEMPTS = 30;

const normalize = (data) => (Array.isArray(data) ? data[0] : data) || null;

// Hali (status) huthibitishwa server-side kupitia RPC get_my_subscription(),
// inayotumia saa ya database. Client haihukumu expiry yenyewe.

// Kumbuka kama RPC ipo kwenye database (ikikosekana, tusirudie kila mara)
let rpcMissing = false;

const isMissingFunction = (e) =>
  !!e &&
  (e.code === 'PGRST202' ||
    e.code === '42883' ||
    /could not find the function/i.test(e.message || ''));

// Njia ya zamani (legacy) inayotumika TU kama RPC get_my_subscription
// haijaapply-iwa bado kwenye database. Inaonya onyo kwenye console.
const effectiveStatus = (sub) => {
  if (!sub) return null;
  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const subEnd = sub.subscription_end ? new Date(sub.subscription_end) : null;

  if (sub.status === 'trial' && (!trialEnd || now > trialEnd)) return 'expired';
  if (sub.status === 'active' && (!subEnd || now > subEnd)) return 'expired';
  return sub.status;
};

const fetchLegacy = async (userId) => {
  const { data, error: err } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (err) throw err;

  let sub = data;
  if (!sub) {
    const { data: created, error: cErr } = await supabase.rpc('ensure_subscription');
    if (cErr) throw cErr;
    sub = normalize(created);
  }
  return sub ? { ...sub, status: effectiveStatus(sub) } : null;
};

export function useSubscription(session) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // `session` hupata object mpya kila SIGNED_IN (pia tab ikirudi mbele) na TOKEN_REFRESHED.
  // Kutumia `session` kama dependency na kuweka loading=true kila mara kulifanya App nzima
  // ibadilishwe na spinner mara kwa mara. Tunafuatilia mtumiaji, si object ya session.
  const userId = session?.user?.id || null;
  const loadedForRef = useRef(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      loadedForRef.current = null;
      setSubscription(null);
      setLoading(false);
      return;
    }
    // Loader kwa mtumiaji mpya tu. Refresh za nyuma (token, tab focus, baada ya malipo) ni za kimya.
    const silent = loadedForRef.current === userId;
    if (!silent) setLoading(true);

    // Server-side function: huhakikisha rekodi ipo na huweka 'expired'
    // kwa kutumia saa ya database (haiwezi kuchezewa na client).
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        let sub = null;

        if (rpcMissing) {
          sub = await fetchLegacy(userId);
        } else {
          const { data, error: err } = await supabase.rpc('get_my_subscription');
          if (err) {
            if (isMissingFunction(err)) {
              // RPC haijaapply-iwa kwenye database bado: tumia njia ya
              // zamani ili app isifungwe, onyo likone kwenye console.
              rpcMissing = true;
              console.warn(
                '[subscription] RPC get_my_subscription haiipo kwenye database. ' +
                  'Endesha supabase/subscription_security.sql kwenye Supabase SQL Editor.'
              );
              sub = await fetchLegacy(userId);
            } else {
              throw err;
            }
          } else {
            sub = normalize(data) || null;
          }
        }

        loadedForRef.current = userId;
        setSubscription(sub);
        setError(null);
        setLoading(false);
        return;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }

    // Refresh ya kimya imeshindwa: hali ya awali ilishathibitishwa na seva, kwa hiyo usimfungie
    // mtumiaji nje kwa hitilafu ya muda mfupi ya mtandao.
    if (silent) return;

    // Fail-closed: bado hatujapata hali halisi -> hakuna access.
    setError(lastErr?.message || 'Imeshindwa kupata hali ya usajili');
    setSubscription(null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const now = new Date();
    let endDate = null;

    if (subscription.status === 'trial' && subscription.trial_end) {
      endDate = new Date(subscription.trial_end);
    } else if (subscription.status === 'active' && subscription.subscription_end) {
      endDate = new Date(subscription.subscription_end);
    }

    if (!endDate) return 0;
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusText = (lang = 'sw') => {
    if (!subscription) return '';
    const sw = lang === 'sw';
    const days = getDaysRemaining();

    switch (subscription.status) {
      case 'trial':
        return sw ? `Majaribio (siku ${days} zimebaki)` : `Trial (${days} days left)`;
      case 'active':
        return sw ? `Inatumika (siku ${days} zimebaki)` : `Active (${days} days left)`;
      case 'expired':
        return sw ? 'Imekwisha - Lipia sasa' : 'Expired - Pay now';
      case 'cancelled':
        return sw ? 'Imesitishwa' : 'Cancelled';
      default:
        return subscription.status;
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return { bg: '#f1f5f9', color: '#64748b' };
    switch (subscription.status) {
      case 'trial': return { bg: '#fef3c7', color: '#d97706' };
      case 'active': return { bg: '#d1fae5', color: '#059669' };
      case 'expired': return { bg: '#fee2e2', color: '#dc2626' };
      case 'cancelled': return { bg: '#f1f5f9', color: '#64748b' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  // Huvunja tu ikiwa code si sahihi (server-side function inahakiki)
  const activateSubscription = async (code) => {
    const { data, error: err } = await supabase.rpc('activate_subscription', {
      p_code: code,
    });
    if (err) throw err;
    const sub = normalize(data);
    if (sub) setSubscription(sub);
    await fetchSubscription();
    return true;
  };

  // Malipo ya simu kupitia AzamPay (Mpesa, Airtel, Tigo, Halopesa, Azampesa):
  // azampay-push (prompt kwenye simu) → polling azampay-status.
  // Ukikamilika, azampay-callback ndiyo huweka subscriptions='active' server-side
  // (complete_payment); hapa tunarefresh kupitia get_my_subscription ili gate ijisashe.
  const startMobilePayment = async (phone, provider) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Huna ruhusa');

    const pushRes = await fetch(`${EDGE_BASE}/azampay-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // Kiasi huamuliwa na server — client hutuma namba ya simu na mtandao pekee.
      body: JSON.stringify({ phone, provider }),
    });
    const pushData = await pushRes.json().catch(() => ({}));
    if (!pushRes.ok) {
      throw new Error(pushData.error || 'Imeshindikana kuanzisha malipo');
    }

    for (let attempt = 0; attempt < PAYMENT_POLL_MAX_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, PAYMENT_POLL_INTERVAL_MS));

      const statusRes = await fetch(`${EDGE_BASE}/azampay-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: pushData.paymentId }),
      });
      const statusData = await statusRes.json().catch(() => ({}));
      if (!statusRes.ok) continue;

      if (statusData.status === 'completed') {
        setSubscription(normalize(statusData.subscription));
        await fetchSubscription();
        return { success: true };
      }
      if (statusData.status === 'failed') {
        throw new Error(statusData.reason || 'Malipo yamekataliwa');
      }
    }

    throw new Error(
      'Malipo hayajakamilika bado. Thibitisha kwenye simu yako au jaribu tena.'
    );
  };

  const canAccess = () => {
    if (!subscription) return false;
    return subscription.status === 'trial' || subscription.status === 'active';
  };

  return {
    subscription,
    loading,
    error,
    canAccess: canAccess(),
    daysRemaining: getDaysRemaining(),
    statusText: getStatusText,
    statusBadge: getStatusBadge(),
    activateSubscription,
    startMobilePayment,
    refresh: fetchSubscription,
    MONTHLY_PRICE,
    TRIAL_DAYS,
  };
}
