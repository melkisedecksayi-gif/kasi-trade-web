const DEFAULT_API_KEY = 'zs_4b512fd0330fe8a586617f5b89b41ff9300de57f7bb21c2b';
const DEFAULT_SENDER_ID = 'KasiTRADE';
const API_URL = 'https://meseji.co.tz/api/v1/sms/send';

const formatPhone = (phone) => {
  let num = phone.replace(/[\s\-()]/g, '');
  if (num.startsWith('0')) num = '255' + num.slice(1);
  if (num.startsWith('+')) num = num.slice(1);
  if (!num.startsWith('255') && num.length === 9) num = '255' + num;
  return num.startsWith('+') ? num : '+' + num;
};

export const sendSMS = async ({ to, message, sender, apiKey }) => {
  const cleanTo = formatPhone(to);
  const phoneWithoutPlus = cleanTo.startsWith('+') ? cleanTo.slice(1) : cleanTo;
  const key = apiKey || DEFAULT_API_KEY;
  const sid = sender || DEFAULT_SENDER_ID;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key
      },
      body: JSON.stringify({
        sender_id: sid,
        message: message,
        contacts: phoneWithoutPlus
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

export const generateReportSMS = (data, lang = 'sw') => {
  const isSw = lang === 'sw';
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount || 0);

  let msg = '';
  msg += isSw ? '*RIPOTI YA KASITRADE*\n\n' : '*KASITRADE REPORT*\n\n';
  msg += `${isSw ? 'Mapato' : 'Revenue'}: ${formatCurrency(data.totalRevenue)}\n`;
  msg += `${isSw ? 'Faida' : 'Profit'}: ${formatCurrency(data.totalProfit)}\n`;
  msg += `${isSw ? 'Mauzo' : 'Transactions'}: ${data.totalTransactions}\n`;
  msg += `${isSw ? 'Wastani' : 'Avg Order'}: ${formatCurrency(data.avgOrderValue)}\n`;
  msg += `${isSw ? 'Bidhaa Zilizouzwa' : 'Products Sold'}: ${data.productsSold}\n`;

  if (data.topProducts && data.topProducts.length > 0) {
    msg += `\n${isSw ? '*BIDHAA KUU*' : '*TOP PRODUCTS*'}\n`;
    data.topProducts.slice(0, 5).forEach((p, i) => {
      msg += `${i + 1}. ${p.name} - ${formatCurrency(p.total)}\n`;
    });
  }

  msg += `\n${isSw ? 'Imetumwa na KasiTRADE POS' : 'Sent by KasiTRADE POS'}`;
  return msg;
};
