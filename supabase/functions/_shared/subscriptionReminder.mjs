
const TZ = 'Africa/Dar_es_Salaam';
const DAY_MS = 86400000;

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dateParts(date) {
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value])
  );
}

function dayNumber(date) {
  const p = dateParts(date);
  return Math.floor(
    Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day))
    / DAY_MS
  );
}

export function localDate(date) {
  const p = dateParts(date);
  return `${p.day}/${p.month}/${p.year}`;
}

export function subscriptionReminderStage(
  sub,
  now = new Date(),
  includeTrial = false
) {
  if (!sub?.user_id ||
      !['active', 'trial', 'expired'].includes(sub.status)) {
    return null;
  }

  const isTrial = sub.status === 'trial' ||
    (sub.status === 'expired' &&
     !sub.subscription_end && !!sub.trial_end);

  if (isTrial && !includeTrial) return null;

  const rawEnd = isTrial ? sub.trial_end : sub.subscription_end;
  if (!rawEnd) return null;

  const end = new Date(rawEnd);
  const current = new Date(now);

  if (!Number.isFinite(end.getTime()) ||
      !Number.isFinite(current.getTime())) {
    return null;
  }

  if (current >= end) {
    if (current.getTime() - end.getTime() > 2 * DAY_MS) {
      return null;
    }

    return {
      stage: 'expired',
      endAt: end.toISOString(),
      daysLeft: 0,
      isTrial,
    };
  }

  const days = dayNumber(end) - dayNumber(current);
  if (![7, 3, 1].includes(days)) return null;

  return {
    stage: `${days}d`,
    endAt: end.toISOString(),
    daysLeft: days,
    isTrial,
  };
}

export function normalizedSmsPhone(phone) {
  const cleaned = String(phone || '').replace(/[\s()+-]/g, '');

  if (/^0[67]\d{8}$/.test(cleaned)) {
    return `255${cleaned.slice(1)}`;
  }

  if (/^255[67]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function asciiText(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function subscriptionReminderMessage({
  shopName, stage, endAt, daysLeft, isTrial
}) {
  const shop = asciiText(shopName).slice(0, 30);
  if (!shop) throw new Error('Jina la duka halipo');

  const end = new Date(endAt);
  if (!Number.isFinite(end.getTime())) {
    throw new Error('Tarehe ya mwisho si sahihi');
  }

  const sentence = stage === 'expired'
    ? (isTrial
      ? `Majaribio yako yameisha ${localDate(end)}.`
      : `Kifurushi chako kimeisha ${localDate(end)}.`)
    : (isTrial
      ? `Majaribio yako yanaisha ${localDate(end)}. Siku ${daysLeft} zimebaki.`
      : `Kifurushi chako kinaisha ${localDate(end)}. Siku ${daysLeft} zimebaki.`);

  const message =
    `KASITRADE POS\nDuka: ${shop}\n${sentence}\nLipia ili huduma iendelee.`;

  if (!/^[\x0a\x20-\x7e]*$/.test(message) ||
      message.length > 160) {
    throw new Error('SMS inazidi herufi 160 au ina alama zisizokubalika');
  }

  return message;
}