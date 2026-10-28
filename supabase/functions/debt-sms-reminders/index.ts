
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  debtReminderCandidate,
  debtReminderMessage,
} from '../_shared/debtReminder.mjs';

const API_URL = 'https://meseji.co.tz/api/v1/sms/send';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const MAX_SMS_PER_RUN = 10;

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

  let difference = 0;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);

  for (let i = 0; i < x.length; i++) {
    difference |= x[i] ^ y[i];
  }

  return difference === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return reply({ error: 'Method not allowed' }, 405);
  }

  const supplied = req.headers.get('x-kasitrade-cron-secret') || '';
  const expected = Deno.env.get('DEBT_REMINDERS_CRON_SECRET') || '';

  if (!(await validSecret(supplied, expected))) {
    return reply({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    return reply({ error: 'Database not configured' }, 503);
  }

  // Live SMS zinahitaji flags MBILI kwa makusudi.
  const live =
    Deno.env.get('DEBT_REMINDERS_ENABLED') === 'true' &&
    Deno.env.get('DEBT_REMINDERS_LIVE_CONFIRMATION') ===
      'SEND_SMS_WITH_COSTS';

  const apiKey = Deno.env.get('MESEJI_API_KEY') || '';

  if (live && !apiKey) {
    return reply({ error: 'Meseji not configured' }, 503);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false },
  });

  const shopNames = new Map<string, string>();

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

      const candidate = debtReminderCandidate(customer, new Date());
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

      let message: string;

      try {
        message = debtReminderMessage({
          ...candidate,
          shopName,
          customerName: customer.name,
        });
      } catch {
        skipped++;
        continue;
      }

      ready++;

      // Dry-run haisababishi gharama wala database writes.
      if (!live) continue;

      if (attempts >= MAX_SMS_PER_RUN) {
        truncated = true;
        break;
      }

      // RPC inakagua deni, consent, tarehe na daily limit.
      // Pia inazuia workers wawili kutuma SMS ileile.
      const { data: reservation, error: reserveError } =
        await admin.rpc('reserve_debt_sms_reminder', {
          p_customer_id: candidate.customerId,
          p_due_date: candidate.dueDate,
          p_stage: candidate.stage,
          p_recipient: candidate.recipient,
        });

      if (reserveError) {
        console.error('Reservation failed', reserveError);
        return reply({ error: 'SMS reservation failed' }, 503);
      }

      if (reservation === 'duplicate') {
        duplicates++;
        continue;
      }

      if (reservation === 'not_eligible') {
        skipped++;
        continue;
      }

      if (reservation === 'daily_limit') {
        truncated = true;
        break;
      }

      if (reservation !== 'reserved') {
        return reply({ error: 'Unexpected reservation' }, 503);
      }

      // Kagua tena baada ya reservation, kabla ya kutuma.
      const { data: fresh, error: freshError } = await admin
        .from('customers')
        .select(
          'id,shop_id,name,phone,balance,debt_due_date,debt_sms_enabled'
        )
        .eq('id', candidate.customerId)
        .maybeSingle();

      if (freshError) {
        console.error('Debt recheck failed', freshError);
        return reply({ error: 'Debt recheck failed' }, 503);
      }

      if (!fresh) {
        skipped++;
        continue;
      }

      const latest = debtReminderCandidate(fresh, new Date());

      if (
        !latest ||
        latest.customerId !== candidate.customerId ||
        latest.shopId !== candidate.shopId ||
        latest.dueDate !== candidate.dueDate ||
        latest.stage !== candidate.stage ||
        latest.recipient !== candidate.recipient ||
        latest.amount !== candidate.amount
      ) {
        // Deni likibadilika, usitume SMS ya taarifa za zamani.
        // Reservation inabaki kuzuia automatic retry.
        skipped++;
        continue;
      }

      try {
        message = debtReminderMessage({
          ...latest,
          shopName,
          customerName: fresh.name,
        });
      } catch {
        skipped++;
        continue;
      }

      attempts++;

      let status = 'unknown';
      let lastError: string | null = null;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            sender_id:
              Deno.env.get('MESEJI_SENDER_ID') || 'KasiTRADE',
            message,
            contacts: latest.recipient,
          }),
          signal: AbortSignal.timeout(15000),
        });

        const responseText = await response.text();
        let provider: Record<string, unknown> = {};

        try {
          provider = JSON.parse(responseText);
        } catch {
          // Response isiyoeleweka haithibitishi mafanikio.
        }

        const providerStatus = String(
          provider.status || ''
        ).toLowerCase();

        const rejected =
          provider.success === false ||
          ['failed', 'error', 'rejected'].includes(providerStatus);

        const confirmed =
          response.ok &&
          !rejected &&
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
        // Hakuna automatic retry.
        lastError = 'PROVIDER_TIMEOUT_OR_NETWORK_ERROR';
      }

      const { error: updateError } = await admin
        .from('customer_debt_sms_reminders')
        .update({
          status,
          last_error: lastError,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', candidate.customerId)
        .eq('due_date', candidate.dueDate)
        .eq('stage', candidate.stage)
        .eq('status', 'reserved');

      if (updateError) {
        console.error('Reminder status update failed', updateError);
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

  return reply({
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
  });
});
