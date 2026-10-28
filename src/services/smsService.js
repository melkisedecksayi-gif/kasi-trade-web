import logger from '../utils/logger';
import { supabase } from '../supabaseClient';
import { newCheckoutRequestId } from './posCheckout';
// SMS zote hupita kwenye Edge Function `send-sms`. API key ya mtoa huduma (MESEJI_API_KEY)
// ipo kwenye secrets za Supabase pekee — HAIPASWI kuwa kwenye code ya frontend.
const SEND_SMS_FUNCTION = 'send-sms';
const REQUEST_TIMEOUT_MS = 20000;

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

// Hutuma ombi kwenda Edge Function `send-sms`.
// payload: { kind: 'otp'|'password_reset'|'welcome'|'custom', to, ... } (angalia
// supabase/functions/send-sms). Inarudisha { success, data } au { success:false, error, retryable }.
const invokeSendSms = async (payload) => {
  const cleanTo = formatPhone(payload.to);
  if (!cleanTo) return { success: false, error: 'Invalid phone number', retryable: false };

  const phoneWithoutPlus = cleanTo.startsWith('+') ? cleanTo.slice(1) : cleanTo;

  if (!rateLimiter.canSend(phoneWithoutPlus)) {
    return { success: false, error: 'Too many messages sent - please wait', retryable: false };
  }

  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS);
    });
    const { data, error } = await Promise.race([
      supabase.functions.invoke(SEND_SMS_FUNCTION, { body: { ...payload, to: phoneWithoutPlus } }),
      timeout,
    ]);

    if (error) {
      // FunctionsHttpError: ina Response kwenye error.context (status + ujumbe wa seva)

      let message = error.message;
      try {
        const body = await error.context.json();
        if (body?.error) message = body.error;
      } catch (e) { /* si JSON */ }
          return { success: false, error: message, retryable: false };
  }
  if (data?.success !== true) {
      return { success: false, error: data.error || 'SMS failed', retryable: false };
    }
    return { success: true, data: data?.data ?? data };
  } catch (error) {
   if (error.message === 'Request timeout') {
  return { success: false, error: 'Request timeout', retryable: false };
    }
    logger.error('SMSService', 'SMS send error:', error);
    return { success: false, error: error.message, retryable: false };
  } finally {
    clearTimeout(timer);
  }
};

// `sender` na `apiKey` zilikuwepo zamani; sasa zinapuuzwa (key ipo kwenye seva pekee).
export const sendSMS = async ({ to, message, requestKey, shopId, purpose }) => {
  if (!shopId || !['report', 'stock_alert'].includes(purpose)) {
    return { success: false, error: 'SMS type/shop haijaruhusiwa', retryable: false };
  }
  return invokeSendSms({ kind: 'custom', to, message, purpose,
    shop_id: shopId, request_key: requestKey || newCheckoutRequestId() });
};

export const sendReceiptSMS = async ({ to, shopId, saleRequestId }) => {
  if (!shopId || !saleRequestId) return { success: false, error: 'Sale ID inahitajika', retryable: false };
  return invokeSendSms({ kind: 'receipt', shop_id: shopId, to, request_key: saleRequestId });
};
// Rudia tu kwa makosa ya mtandao/seva (5xx). Makosa ya 4xx (kikomo cha kasi, namba mbaya,
// huna ruhusa) hayarudiwi — kurudia kungeongeza tu matumizi ya kikomo.
const withRetry = async (send, maxRetries, delayMs) => {
  let last = { success: false, error: 'Failed after all retries' };
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    last = await send();
    if (last.success || last.retryable === false) return last;
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return last.error ? last : { success: false, error: 'Failed after all retries' };
};

export const sendSMSWithRetry = async (params, maxRetries = 3, delayMs = 1000) =>
  withRetry(() => sendSMS(params), maxRetries, delayMs);

// Ujumbe wa OTP / welcome / password reset hutengenezwa na SERVER (kutoka kwenye code na jina
// tu), kwa hiyo hizi zinafanya kazi hata kabla mtumiaji hajaingia.
// OTP and welcome are deliberately disabled while KasiTrade uses password-only login.
const off = async () => ({ success: false, error: 'SMS hii imezimwa kwa sasa', retryable: false });
export const sendWelcomeSMS = off;
export const sendOTPSMS = off;
export const sendPasswordResetOTPSMS = off;

// Marketing needs consent and server-side recipient verification before re-enabling.
export const sendBulkSMS = async ({ recipients = [] }) =>
  recipients.map(recipient => ({ recipient, success: false,
    error: 'Bulk/marketing SMS zimezimwa hadi consent itakapowekwa', retryable: false }));

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

  const totalProfit = data.totalProfit || 0;
  const totalExpenses = data.totalExpenses || 0;
  const netProfit = data.netProfit !== undefined ? data.netProfit : totalProfit - totalExpenses;

  let msg = `${data.shopName || 'KasiTRADE'}\n`;
  msg += isSw ? 'RIPOTI YA MAUZO\n\n' : 'SALES REPORT\n\n';
  msg += `${isSw ? '📊 Mauzo' : '📊 Sales'}: ${fmt(data.totalRevenue)}\n`;
  msg += `${isSw ? '💰 Faida' : '💰 Profit'}: ${fmt(netProfit)}\n`;
  msg += `${isSw ? '🧾 Idadi' : '🧾 Count'}: ${data.totalTransactions || 0}\n`;
  msg += `\nKasiTRADE POS`;

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
