
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  subscriptionReminderStage,
  normalizedSmsPhone,
  subscriptionReminderMessage,
} from '../_shared/subscriptionReminder.mjs';

const PROVIDER_URL = 'https://meseji.co.tz/api/v1/sms/send';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const MAX_SMS_PER_RUN = 10;

function respond(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function validSecret(supplied: string, expected: string) {
  if (!supplied || expected.length < 32) return false;

  const encoder = new TextEncoder();

  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);

  const x = new Uint8Array(a);
  const y = new Uint8Array(b);

  let difference = 0;
  for (let i = 0; i < x.length; i++) {
    difference |= x[i] ^ y[i];
  }

  return difference === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return respond({ error: 'Method not allowed' }, 405);
  }

  const expected = Deno.env.get(
    'SUBSCRIPTION_REMINDERS_CRON_SECRET'
  ) || '';

  const supplied = req.headers.get(
    'x-kasitrade-cron-secret'
  ) || '';

  if (!(await validSecret(supplied, expected))) {
    return respond({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    return respond({ error: 'Database not configured' }, 503);
  }

  // Live inahitaji flags MBILI, zote ziwekwe kwa makusudi.
  const live =
    Deno.env.get('SUBSCRIPTION_REMINDERS_ENABLED') === 'true' &&
    Deno.env.get('SUBSCRIPTION_REMINDERS_LIVE_CONFIRMATION') ===
      'SEND_SMS_WITH_COSTS';

  const apiKey = Deno.env.get('MESEJI_API_KEY') || '';

  if (live && !apiKey) {
    return respond({ error: 'Meseji not configured' }, 503);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false },
  });

  const now = new Date();

  let scanned = 0;
  let eligible = 0;
  let ready = 0;
  let accepted = 0;
  let unknown = 0;
  let duplicates = 0;
  let skipped = 0;
  let attempts = 0;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;

    const { data: subs, error } = await admin
      .from('subscriptions')
      .select('user_id,status,subscription_end,trial_end')
      .in('status', ['active', 'trial', 'expired'])
      .order('user_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Subscription query failed', error);
      return respond({ error: 'Subscription query failed' }, 503);
    }

    const rows = subs || [];

    for (const sub of rows) {
      scanned++;

      // Trial reminders OFF.
      const stage = subscriptionReminderStage(sub, now, false);

      if (!stage) continue;

      // Usitume reminder ya kabla ya expiry kwa status expired.
      if (stage.stage !== 'expired' && sub.status !== 'active') {
        skipped++;
        continue;
      }

      eligible++;

      const [profileResult, shopResult] = await Promise.all([
        admin
          .from('profiles')
          .select('phone')
          .eq('id', sub.user_id)
          .maybeSingle(),

        admin
          .from('shops')
          .select('shop_name')
          .eq('owner_id', sub.user_id)
          .order('shop_name', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.error || shopResult.error) {
        skipped++;
        continue;
      }

      const phone = normalizedSmsPhone(
        profileResult.data?.phone
      );

      const shopName = shopResult.data?.shop_name;

      if (!phone || !shopName) {
        skipped++;
        continue;
      }

      let message: string;

      try {
        message = subscriptionReminderMessage({
          shopName,
          ...stage,
        });
      } catch {
        skipped++;
        continue;
      }

      ready++;

      // Dry-run: hakuna DB reservation, hakuna SMS, hakuna gharama.
      if (!live) continue;

      if (attempts >= MAX_SMS_PER_RUN) {
        truncated = true;
        break;
      }

      // Hakikisha subscription haijaongezewa muda.
      const { data: fresh, error: refreshError } = await admin
        .from('subscriptions')
        .select('user_id,status,subscription_end,trial_end')
        .eq('user_id', sub.user_id)
        .maybeSingle();

      if (refreshError) {
        return respond({ error: 'Subscription recheck failed' }, 503);
      }

      const freshStage = subscriptionReminderStage(
        fresh,
        new Date(),
        false
      );

      if (
        !freshStage ||
        freshStage.stage !== stage.stage ||
        freshStage.endAt !== stage.endAt ||
        (stage.stage !== 'expired' && fresh?.status !== 'active')
      ) {
        skipped++;
        continue;
      }

      // Reservation kabla ya provider request.
      // Unique constraint inazuia workers wawili kutuma mara mbili.
      const { data: reservation, error: reserveError } =
        await admin.rpc('reserve_subscription_sms_reminder', {
          p_user_id: sub.user_id,
          p_period_end: stage.endAt,
          p_stage: stage.stage,
          p_recipient: phone,
        });

      if (reserveError) {
        console.error('SMS reservation failed', reserveError);
        return respond({ error: 'SMS reservation failed' }, 503);
      }

      if (reservation === 'duplicate') {
        duplicates++;
        continue;
      }

      if (reservation === 'daily_limit') {
        truncated = true;
        break;
      }

      if (reservation !== 'reserved') {
        return respond({ error: 'Unexpected reservation' }, 503);
      }

      // Recheck nyingine baada ya kupata reservation.
      const { data: latest, error: latestError } = await admin
        .from('subscriptions')
        .select('user_id,status,subscription_end,trial_end')
        .eq('user_id', sub.user_id)
        .maybeSingle();

      const latestStage = latestError
        ? null
        : subscriptionReminderStage(latest, new Date(), false);

      if (
        !latestStage ||
        latestStage.stage !== stage.stage ||
        latestStage.endAt !== stage.endAt ||
        (stage.stage !== 'expired' && latest?.status !== 'active')
      ) {
        // Reservation inabaki. Usitume wala kujaribu tena
        // kiotomatiki kwa kipindi hiki.
        await admin
          .from('subscription_sms_reminders')
          .update({
            last_error: 'SUBSCRIPTION_CHANGED_BEFORE_SEND',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id)
          .eq('period_end', stage.endAt)
          .eq('stage', stage.stage);

        skipped++;
        continue;
      }

      attempts++;

      let status = 'unknown';
      let lastError: string | null = null;

      try {
        const response = await fetch(PROVIDER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            sender_id:
              Deno.env.get('MESEJI_SENDER_ID') || 'KasiTRADE',
            message,
            contacts: phone,
          }),
          signal: AbortSignal.timeout(15000),
        });

        const body = await response.text();

        let provider: Record<string, unknown> = {};

        try {
          provider = JSON.parse(body);
        } catch {
          // Response isiyoeleweka si delivery confirmation.
        }


        const providerStatus = String(
          provider.status || ''
        ).toLowerCase();

        const confirmed =
          response.ok &&
          (
            provider.success === true ||
            ['success', 'accepted', 'queued', 'sent']
              .includes(providerStatus)
          );

        if (confirmed) {
          status = 'accepted';
        } else {
          lastError = response.ok
            ? 'PROVIDER_RESPONSE_NOT_CONFIRMED'
            : `PROVIDER_HTTP_${response.status}`;
        }
      } catch {
        // Timeout inaweza kuwa imetuma SMS tayari.
        // Hivyo hatufanyi retry ya moja kwa moja.
        lastError = 'PROVIDER_TIMEOUT_OR_NETWORK_ERROR';
      }

      const { error: updateError } = await admin
        .from('subscription_sms_reminders')
        .update({
          status,
          last_error: lastError,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', sub.user_id)
        .eq('period_end', stage.endAt)
        .eq('stage', stage.stage)
        .eq('status', 'reserved');

      if (updateError) {
        console.error('SMS status update failed', updateError);
      }

      if (status === 'accepted') accepted++;
      else unknown++;
    }

    if (truncated) break;
    if (rows.length < PAGE_SIZE) break;

    if (page === MAX_PAGES - 1) {
      truncated = true;
    }
  }

  return respond({
    success: true,
    mode: live ? 'live' : 'dry_run',
    scanned,
    eligible,
    ready,
    accepted,
    unknown,
    duplicates,
    skipped,
    attempts,
    truncated,
    sms_sent_in_dry_run: 0,
  });
});
