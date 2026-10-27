
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  debtReminderCandidate,
  debtReminderMessage,
} from '../_shared/debtReminder.mjs';

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
    return reply({ error: 'Method not allowed' }, 405);
  }

  const expected = Deno.env.get(
    'DEBT_REMINDERS_CRON_SECRET'
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
  const shopNames = new Map<string, string>();

  let scanned = 0;
  let eligible = 0;
  let ready = 0;
  let skipped = 0;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;

    const { data: customers, error } = await admin
      .from('customers')
      .select(
        'id,shop_id,name,phone,balance,debt_due_date,debt_sms_enabled'
      )
      .eq('debt_sms_enabled', true)
      .gt('balance', 0)
      .not('debt_due_date', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Customer query failed', error);
      return reply({ error: 'Database query failed' }, 503);
    }

    const rows = customers || [];

    for (const customer of rows) {
      scanned++;

      const candidate = debtReminderCandidate(
        customer,
        now
      );

      if (!candidate) continue;

      eligible++;

      let shopName = shopNames.get(candidate.shopId);

      if (!shopName) {
        const { data: shop, error: shopError } = await admin
          .from('shops')
          .select('shop_name')
          .eq('id', candidate.shopId)
          .maybeSingle();

        if (shopError || !shop?.shop_name) {
          skipped++;
          continue;
        }

        shopName = shop.shop_name;

shopNames.set(candidate.shopId, shop.shop_name);

      }

      try {
        debtReminderMessage({
          ...candidate,
          shopName,
          customerName: customer.name,
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
    database_writes: 0,
    message: 'Preview only. No SMS sent.',
  });
});
