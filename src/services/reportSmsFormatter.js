// SMS report formatter used by manual and end-of-day reports.
// ASCII-only output avoids emoji, special punctuation and accidental UCS-2 billing.
// Keep it short: the SMS provider is allowed a maximum of 640 characters.

const cleanText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7e]/g, ' ')
 .replace(/[\\^{}[\]~|?]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const money = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number(value));

const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

export const generateReportSMS = (report = {}, lang = 'sw') => {
  const english = lang === 'en';
  const shopName = cleanText(report.shopName).slice(0, 60);
  if (!shopName) {
    throw new Error(english ? 'Shop name is required to send the report' : 'Jina la duka linahitajika kutuma ripoti');
  }

  const first = formatDate(report.startDate);
  const last = formatDate(report.endDate);
  const dateLine = first && last
    ? (first === last
      ? `${english ? 'Date' : 'Tarehe'}: ${first}`
      : `${english ? 'Period' : 'Kipindi'}: ${first}-${last}`)
    : (first || last ? `${english ? 'Date' : 'Tarehe'}: ${first || last}` : '');

  const message = [
    shopName,
    report.reportType === 'eod'
      ? (english ? 'END OF DAY REPORT' : 'RIPOTI YA SIKU')
      : (english ? 'SALES REPORT' : 'RIPOTI YA MAUZO'),
    dateLine,
    `${english ? 'Sales' : 'Mauzo'}: TSh ${money(report.totalRevenue)}`,
    `${english ? 'Profit' : 'Faida'}: TSh ${money(report.totalProfit)}`,
    `${english ? 'Transactions' : 'Miamala'}: ${money(report.totalTransactions)}`,
    `${english ? 'Items' : 'Bidhaa'}: ${money(report.productsSold)}`,
    'KasiTrade POS',
  ].filter(Boolean).join('\n');

  if (message.length > 640) throw new Error('Ripoti ya SMS ni ndefu mno');
  return message;
};
