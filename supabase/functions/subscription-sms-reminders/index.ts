
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  subscriptionReminderStage,
  normalizedSmsPhone,
  subscriptionReminderMessage,
} from '../_shared/subscriptionReminder.mjs';

// DRY RUN ONLY: Hakuna SMS inayotumwa.
const PAGE_SIZE = 100;
const MAX_PAGES = 5;

function reply(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function validSecret(
  supplied: string,
  expected: string
): Promise<boolean> {
  if (expected.length < 32 || !supplied) return false;

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
    return reply({ error: 'Method not allowed' }, 405);
  }

  const expected = Deno.env.get(
    'SUBSCRIPTION_REMINDERS_CRON_SECRET'
  ) || '';

  const supplied = req.headers.get(
    'x-kasitrade-cron-secret'
  ) || '';

  if (!(await validSecret(supplied, expected))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    return reply({ error: 'Database not configured' }, 503);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false },
  });

  const now = new Date();

  let scanned = 0;
  let eligible = 0;
  let ready = 0;
  let skipped = 0;
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
      return reply({ error: 'Database query failed' }, 503);
    }

    const rows = subs || [];

    for (const sub of rows) {
      scanned++;

      // Trial reminders OFF kwa sasa.
      const stage = subscriptionReminderStage(sub, now, false);
      if (!stage) continue;

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

      try {
        // Tunathibitisha muundo tu.
        // Hatuonyeshi namba wala ujumbe wa mtu kwenye response.
        subscriptionReminderMessage({
          shopName,
          ...stage,
        });

        ready++;
      } catch {
        skipped++;
      }
    }

    if (rows.length < PAGE_SIZE) break;

    if (page === MAX_PAGES - 1) {
      truncated = true;
    }
  }

  return reply({
    success: true,
    mode: 'dry_run',
    scanned,
    eligible,
    ready,
    skipped,
    truncated,
    sms_sent: 0,
    message: 'Preview only. No SMS sent.',
  });
});
