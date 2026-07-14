import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const MONTHLY_PRICE = 12000;
const TRIAL_DAYS = 14;

export function useSubscription(session) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (err) throw err;

      if (data) {
        const now = new Date();
        const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
        const subEnd = data.subscription_end ? new Date(data.subscription_end) : null;

        let status = data.status;
        if (status === 'trial' && trialEnd && now > trialEnd) {
          status = 'expired';
        } else if (status === 'active' && subEnd && now > subEnd) {
          status = 'expired';
        }

        if (status !== data.status) {
          await supabase
            .from('subscriptions')
            .update({ status })
            .eq('id', data.id);
          data.status = status;
        }

        setSubscription(data);
      } else {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

        const { data: newSub, error: insErr } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.user.id,
            plan: 'monthly',
            status: 'trial',
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            amount: MONTHLY_PRICE,
          })
          .select()
          .single();

        if (insErr) throw insErr;
        setSubscription(newSub);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canAccess = () => {
    if (!subscription) return false;
    return subscription.status === 'trial' || subscription.status === 'active';
  };

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

  const activateSubscription = async (paymentMethod, paymentReference) => {
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      if (subscription?.id) {
        const { error: err } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            subscription_start: now.toISOString(),
            subscription_end: endDate.toISOString(),
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            payment_status: 'paid',
            amount: MONTHLY_PRICE,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.user.id,
            plan: 'monthly',
            status: 'active',
            trial_start: null,
            trial_end: null,
            subscription_start: now.toISOString(),
            subscription_end: endDate.toISOString(),
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            payment_status: 'paid',
            amount: MONTHLY_PRICE,
          });
        if (err) throw err;
      }

      await fetchSubscription();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
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
    refresh: fetchSubscription,
    MONTHLY_PRICE,
    TRIAL_DAYS,
  };
}
