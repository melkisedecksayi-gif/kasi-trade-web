
const DAY_MS = 86400000;

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Dar_es_Salaam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dateNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;

  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  if (date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return Date.UTC(y, m - 1, d) / DAY_MS;
}

function todayTZ(now) {
  const date = new Date(now);

  if (!Number.isFinite(date.getTime())) return null;

  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function phoneNumber(value) {
  const phone = String(value || '').replace(/[\s()+-]/g, '');

  if (/^0[67]\d{8}$/.test(phone)) {
    return `255${phone.slice(1)}`;
  }

  return /^255[67]\d{8}$/.test(phone) ? phone : null;
}

export function debtReminderCandidate(
  customer,
  now = new Date()
) {
  if (!customer || customer.debt_sms_enabled !== true) {
    return null;
  }

  const amount = Number(customer.balance);
  const phone = phoneNumber(customer.phone);

  if (
    !customer.id ||
    !customer.shop_id ||
    !phone ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const due = dateNumber(customer.debt_due_date);
  const today = dateNumber(todayTZ(now));

  if (due === null || today === null) return null;

  const daysLeft = due - today;

  const stages = {
    3: '3d',
    1: '1d',
    0: 'due',
    '-1': 'overdue',
  };

  const stage = stages[daysLeft];

  if (!stage) return null;

  return {
    customerId: customer.id,
    shopId: customer.shop_id,
    recipient: phone,
    amount,
    dueDate: customer.debt_due_date,
    stage,
  };
}

function clean(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function debtReminderMessage({
  shopName,
  customerName,
  amount,
  dueDate,
  stage,
}) {
  if (
    !['3d', '1d', 'due', 'overdue'].includes(stage) ||
    dateNumber(dueDate) === null ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    throw new Error('Taarifa za deni si sahihi');
  }

  const shop = clean(shopName).slice(0, 25);
  const customer = clean(customerName).slice(0, 20);

  if (!shop || !customer) {
    throw new Error('Jina halipo');
  }

  const [y, m, d] = dueDate.split('-');
  const date = `${d}/${m}/${y}`;

  const money = Number(amount).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });

  const deadline = stage === 'overdue'
    ? `Tarehe ilipita ${date}.`
    : `Lipa ifikapo ${date}.`;

  const sms =
    `KASITRADE POS\n` +
    `Duka: ${shop}\n` +
    `${customer}, una deni TSh ${money}. ` +
    `${deadline} Asante.`;

  if (sms.length > 160) {
    throw new Error('SMS ni ndefu mno');
  }

  return sms;
}
