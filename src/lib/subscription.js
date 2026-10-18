import { useCallback, useEffect, useState } from 'react';

export const TRIAL_DAYS = 14;
export const PRO_PRICE_TSH = 12000;

const EDGE_BASE = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1`;

const daysBetween = (from, to) => Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

export function getSubscriptionState(sub) {
  if (!sub) {
    // Hakuna row = haina ruhusa (funga hadi malipo yafanyike)
    return { plan: 'trial', status: 'expired', locked: true, daysLeft: 0, isPro: false, expiresAt: null };
  }
  const now = new Date();
  const subEnd = sub.subscription_end ? new Date(sub.subscription_end) : null;
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;

  const isPro = sub.status === 'active' && !!subEnd && subEnd > now;
  const inTrial = !isPro && !!trialEnd && trialEnd > now;
  const locked = !isPro && !inTrial;
  const reference = isPro ? subEnd : trialEnd;

  return {
    plan: isPro ? 'pro' : 'trial',
    status: sub.status,
    isPro,
    locked,
    daysLeft: reference ? Math.max(0, daysBetween(now, reference)) : 0,
    expiresAt: reference || null,
  };
}

export function useSubscription(supabase, shopId) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setSubscription(null);
        return;
      }

      let { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (!data) {
        const { data: rpcData } = await supabase.rpc('ensure_subscription');
        data = Array.isArray(rpcData) ? rpcData[0] : rpcData || null;
      }
      setSubscription(data || null);
    } catch (e) {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const state = getSubscriptionState(subscription);

  const startMpesaPayment = useCallback(
    async (phone) => {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      if (!token) throw new Error('Huna ruhusa');

      const pushRes = await fetch(`${EDGE_BASE}/mpesa-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, amount: PRO_PRICE_TSH }),
      });
      const pushData = await pushRes.json();
      if (!pushRes.ok) throw new Error(pushData.error || 'Imeshindikana kuanzisha malipo');

      // Subiri M-PESA prompt kuthibitishwa kwenye simu, kisha angalia hali
      for (let i = 0; i < 24; i += 1) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(`${EDGE_BASE}/mpesa-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentId: pushData.paymentId }),
        });
        const statusData = await statusRes.json();
        if (statusData.status === 'completed') {
          setSubscription(statusData.subscription || null);
          return { success: true };
        }
        if (statusData.status === 'failed') {
          return { success: false, error: 'Malipo yamekataliwa' };
        }
      }
      return { success: false, error: 'Malipo hayajakamilika bado. Angalia M-Pesa uthibitisho wako.' };
    },
    [supabase],
  );

  return { ...state, subscription, loading, refresh, startMpesaPayment };
}
