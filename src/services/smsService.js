const DEFAULT_API_KEY = 'zs_4b512fd0330fe8a586617f5b89b41ff9300de57f7bb21c2b';
const DEFAULT_SENDER_ID = 'KasiTRADE';
const API_URL = 'https://meseji.co.tz/api/v1/sms/send';

const rateLimiter = {
  records: {},
  windowMs: 60000,
  maxPerWindow: 5,
  canSend(phone) {
    const now = Date.now();
    const key = String(phone).replace(/[\s\-()]/g, '');
    if (!this.records[key]) this.records[key] = [];
    this.records[key] = this.records[key].filter(t => now - t < this.windowMs);
    if (this.records[key].length >= this.maxPerWindow) return false;
    this.records[key].push(now);
    return true;
  },
};

const formatPhone = (phone) => {
  if (!phone) return '';
  let num = String(phone).replace(/[\s\-()]/g, '');
  if (num.startsWith('0')) num = '255' + num.slice(1);
  if (num.startsWith('+')) num = num.slice(1);
  if (!num.startsWith('255') && num.length === 9) num = '255' + num;
  return num.startsWith('+') ? num : '+' + num;
};

export const generateOTPCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
};

const SMS_TEMPLATES = {
  welcome: {
    sw: (name) =>
      `Hongera ${name}! Karibu kwenye familia ya KasiTRADE POS. Furahia siku 14 za majaribio BURE. Mfumo wetu utakusaidia kudhibiti biashara yako kwa ufanisi. Tuko pamoja!`,
    en: (name) =>
      `Congratulations ${name}! Welcome to KasiTRADE POS family. Enjoy 14 days FREE trial. Our system will help you manage your business efficiently. We are with you!`,
  },
  otp: {
    sw: (code) =>
      `Namba yako ya uhakiki (OTP) ni: ${code}. Usimpe mtu yeyote namba hii. Itaisha baada ya dakika 5. - KasiTRADE`,
    en: (code) =>
      `Your verification code (OTP) is: ${code}. Do not share this code with anyone. It expires in 5 minutes. - KasiTRADE`,
  },
  passwordResetOTP: {
    sw: (code) =>
      `Namba yako ya kubadilisha nenosiri ni: ${code}. Usimpe mtu yeyote. Itaisha baada ya dakika 5. - KasiTRADE`,
    en: (code) =>
      `Your password reset code is: ${code}. Do not share it. Expires in 5 minutes. - KasiTRADE`,
  },
};

export const generateWelcomeMessage = (businessName, lang = 'sw') => {
  const t = SMS_TEMPLATES.welcome[lang] || SMS_TEMPLATES.welcome.sw;
  return t(businessName || 'KasiTRADE');
};

export const generateOTPMessage = (code, lang = 'sw') => {
  const t = SMS_TEMPLATES.otp[lang] || SMS_TEMPLATES.otp.sw;
  return t(code);
};

export const generatePasswordResetOTPMessage = (code, lang = 'sw') => {
  const t = SMS_TEMPLATES.passwordResetOTP[lang] || SMS_TEMPLATES.passwordResetOTP.sw;
  return t(code);
};

export const sendSMS = async ({ to, message, sender, apiKey }) => {
  const cleanTo = formatPhone(to);
  if (!cleanTo) return { success: false, error: 'Invalid phone number' };

  const phoneWithoutPlus = cleanTo.startsWith('+') ? cleanTo.slice(1) : cleanTo;
  const key = apiKey || DEFAULT_API_KEY;
  const sid = sender || DEFAULT_SENDER_ID;

  if (!rateLimiter.canSend(phoneWithoutPlus)) {
    return { success: false, error: 'Too many messages sent - please wait' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({
        sender_id: sid,
        message: message,
        contacts: phoneWithoutPlus,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    return { success: true, data };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendSMSWithRetry = async (params, maxRetries = 3, delayMs = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await sendSMS(params);
    if (result.success) return result;
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return { success: false, error: 'Failed after all retries' };
};

export const sendWelcomeSMS = async ({ phone, businessName, lang = 'sw' }) => {
  if (!phone) return { success: false, error: 'No phone number provided' };
  const message = generateWelcomeMessage(businessName, lang);
  return sendSMSWithRetry({ to: phone, message });
};

export const sendOTPSMS = async ({ phone, code, lang = 'sw' }) => {
  if (!phone) return { success: false, error: 'No phone number provided' };
  const message = generateOTPMessage(code, lang);
  return sendSMSWithRetry({ to: phone, message });
};

export const sendPasswordResetOTPSMS = async ({ phone, code, lang = 'sw' }) => {
  if (!phone) return { success: false, error: 'No phone number provided' };
  const message = generatePasswordResetOTPMessage(code, lang);
  return sendSMSWithRetry({ to: phone, message });
};

export const sendBulkSMS = async ({ recipients, message, sender, apiKey }) => {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendSMSWithRetry({ to: recipient, message, sender, apiKey });
    results.push({ recipient, ...result });
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return results;
};

export const generateReceiptSMS = (transaction, shopName, lang = 'sw') => {
  const isSw = lang === 'sw';
  const fmt = (amount) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const date = new Date(transaction.created_at || Date.now()).toLocaleString(
    lang === 'sw' ? 'sw-TZ' : 'en-US'
  );

  let msg = `${shopName || 'KasiTRADE'}\n`;
  msg += `${isSw ? 'RISITI YA KIELEKTRONIKI' : 'E-RECEIPT'}\n`;
  msg += `${isSw ? 'Tarehe' : 'Date'}: ${date}\n`;
  msg += `${isSw ? 'Jumla' : 'Total'}: ${fmt(transaction.total_amount)}\n`;
  if (transaction.payment_method) {
    msg += `${isSw ? 'Malipo' : 'Payment'}: ${transaction.payment_method}\n`;
  }
  msg += `\n${isSw ? 'Asante kwa biashara yako!' : 'Thank you for your business!'}`;
  return msg;
};

export const generateReportSMS = (data, lang = 'sw') => {
  const isSw = lang === 'sw';
  const fmt = (amount) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const date = data.date || new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let msg = '';

  msg += isSw ? 'RIPOTI YA MAUZO\n' : 'SALES REPORT\n';
  if (data.shopName) msg += `${data.shopName}\n`;
  msg += `${isSw ? 'Tarehe' : 'Date'}: ${date}\n`;
  msg += `${'\u2500'.repeat(20)}\n\n`;

  msg += `${isSw ? 'MUHTASARI WA LEO' : 'DAILY SUMMARY'}\n`;
  msg += `${isSw ? '  Mauzo Yote' : '  Total Sales'}: ${fmt(data.totalRevenue)}\n`;
  msg += `${isSw ? '  Idadi ya Mauzo' : '  Transactions'}: ${data.totalTransactions || 0}\n`;
  msg += `${isSw ? '  Wastani kwa Mteja' : '  Avg per Customer'}: ${fmt(data.avgOrderValue || 0)}\n`;
  msg += `${isSw ? '  Bidhaa Zilizouzwa' : '  Items Sold'}: ${data.productsSold || 0}\n`;

  if (data.customerCount !== undefined) {
    msg += `${isSw ? '  Wateja Waliohudumiwa' : '  Customers Served'}: ${data.customerCount}\n`;
  }

  if (data.paymentBreakdown && Object.keys(data.paymentBreakdown).length > 0) {
    msg += `\n${isSw ? 'NJIA ZA MALIPO' : 'PAYMENT METHODS'}\n`;
    if (data.paymentBreakdown.cash) msg += `  ${isSw ? 'Taslimu' : 'Cash'}: ${fmt(data.paymentBreakdown.cash)}\n`;
    if (data.paymentBreakdown.mobile) msg += `  ${isSw ? 'Simu' : 'Mobile'}: ${fmt(data.paymentBreakdown.mobile)}\n`;
    if (data.paymentBreakdown.card) msg += `  ${isSw ? 'Kadi' : 'Card'}: ${fmt(data.paymentBreakdown.card)}\n`;
    if (data.paymentBreakdown.bank) msg += `  ${isSw ? 'Benki' : 'Bank'}: ${fmt(data.paymentBreakdown.bank)}\n`;
  }

  if (data.totalExpenses !== undefined) {
    msg += `\n${isSw ? 'MATUMIZI' : 'EXPENSES'}\n`;
    msg += `${isSw ? '  Jumla' : '  Total'}: ${fmt(data.totalExpenses)}\n`;
  }

  const totalProfit = data.totalProfit || 0;
  const totalExpenses = data.totalExpenses || 0;
  const netProfit = data.netProfit !== undefined ? data.netProfit : totalProfit - totalExpenses;

  msg += `\n${isSw ? 'FAIDA' : 'PROFIT'}\n`;
  if (data.totalProfit || data.totalExpenses) {
    msg += `${isSw ? '  Faida Ghafi' : '  Gross Profit'}: ${fmt(totalProfit)}\n`;
    if (data.totalExpenses !== undefined) {
      msg += `${isSw ? '  Toa Matumizi' : '  Less Expenses'}: ${fmt(-totalExpenses)}\n`;
    }
  }
  msg += `${isSw ? '  FAIDA HAI' : '  NET PROFIT'}: ${fmt(netProfit)}\n`;

  if (data.topProducts && data.topProducts.length > 0) {
    msg += `\n${isSw ? 'BIDHAA KUU ZA LEO' : 'TODAYS TOP PRODUCTS'}\n`;
    data.topProducts.slice(0, 10).forEach((p, i) => {
      const icon = i === 0 ? '\u{1F947} ' : i === 1 ? '\u{1F948} ' : i === 2 ? '\u{1F949} ' : `${i + 1}. `;
      const qty = p.quantity ? ` (${p.quantity})` : '';
      msg += `${icon}${p.name}${qty} - ${fmt(p.total)}\n`;
    });
  }

  if (data.salesSummary) {
    msg += `\n${isSw ? 'MUHTASARI' : 'SUMMARY'}\n`;
    msg += `${isSw ? '  Mauzo ya Juu' : '  Highest Sale'}: ${fmt(data.salesSummary.highest)}\n`;
    msg += `${isSw ? '  Mauzo ya Chini' : '  Lowest Sale'}: ${fmt(data.salesSummary.lowest)}\n`;
    if (data.salesSummary.totalDiscount) {
      msg += `${isSw ? '  Punguzo Zote' : '  Total Discounts'}: ${fmt(data.salesSummary.totalDiscount)}\n`;
    }
  }

  msg += `\n${'\u2500'.repeat(20)}\n`;
  msg += isSw ? 'Asante kwa kutumia KasiTRADE!' : 'Thank you for using KasiTRADE!';

  return msg;
};

export const generateCustomerSMS = (template, data, lang = 'sw') => {
  const isSw = lang === 'sw';
  switch (template) {
    case 'promotion':
      return isSw
        ? `${data.shopName || 'KasiTRADE'}\n\nOfa maalum! Punguzo la ${
            data.discount || '10'
          }% kwenye bidhaa zetu. Tembelea duka letu leo!`
        : `${data.shopName || 'KasiTRADE'}\n\nSpecial offer! ${
            data.discount || '10'
          }% off all products. Visit our shop today!`;
    case 'reminder':
      return isSw
        ? `${data.shopName || 'KasiTRADE'}\n\nHabari ${
            data.customerName || 'mteja'
          }, tunakukumbusha kuhusu bidhaa zetu mpya. Karibu tena!`
        : `${data.shopName || 'KasiTRADE'}\n\nHello ${
            data.customerName || 'customer'
          }, a reminder about our new products. Welcome back!`;
    case 'birthday':
      return isSw
        ? `${data.shopName || 'KasiTRADE'}\n\nHeri ya kuzaliwa ${
            data.customerName || 'mteja'
          }! Tunakutakia siku njema. Tembelea duka letu kwa ofa maalum ya siku yako.`
        : `${data.shopName || 'KasiTRADE'}\n\nHappy birthday ${
            data.customerName || 'customer'
          }! Wishing you a great day. Visit us for a special birthday offer.`;
    default:
      return data.message || '';
  }
};
