import emailjs from '@emailjs/browser';
import logger from '../utils/logger';

const DEFAULT_PUBLIC_KEY = 'ZxWOL0OzGhy06G6f5';
const DEFAULT_SERVICE_ID = 'service_wb6ens2';
const DEFAULT_TEMPLATES = {
  receipt: 'template_6pllxba',
  report: 'template_d9272ji',
  welcome: 'template_6pllxba',
  low_stock: 'template_d9272ji',
  birthday: 'template_d9272ji',
};

const rateLimiter = {
  records: {},
  windowMs: 60000,
  maxPerWindow: 10,
  canSend(email) {
    const now = Date.now();
    const key = String(email).toLowerCase().trim();
    if (!this.records[key]) this.records[key] = [];
    this.records[key] = this.records[key].filter(t => now - t < this.windowMs);
    if (this.records[key].length >= this.maxPerWindow) return false;
    this.records[key].push(now);
    return true;
  },
};

export const buildReceiptHTML = (transaction, shopName, lang = 'sw') => {
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

  const items = (transaction.items || []).map((item, i) => {
    const lineTotal = (item.sell_price || item.price || 0) * (item.quantity || 1);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i + 1}. ${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity || 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(item.sell_price || item.price || 0)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(lineTotal)}</td>
    </tr>`;
  }).join('');

  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#333">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">${shopName || 'KasiTRADE'}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${isSw ? 'RISITI YA KIELEKTRONIKI' : 'E-RECEIPT'}</p>
      </div>
      <div style="padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px">${isSw ? 'Tarehe' : 'Date'}: ${date}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280">${isSw ? 'Bidhaa' : 'Item'}</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280">${isSw ? 'Idadi' : 'Qty'}</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280">${isSw ? 'Bei' : 'Price'}</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280">${isSw ? 'Jumla' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <div style="border-top:2px solid #6366f1;padding-top:12px;text-align:right">
          <p style="margin:0;font-size:13px;color:#6b7280">${isSw ? 'Jumla Kuu' : 'Grand Total'}</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#6366f1">${fmt(transaction.total_amount || transaction.total || 0)}</p>
        </div>
        ${transaction.payment_method ? `<p style="margin:16px 0 0;font-size:12px;color:#6b7280">${isSw ? 'Njia ya Malipo' : 'Payment Method'}: ${transaction.payment_method}</p>` : ''}
        <p style="margin:20px 0 0;text-align:center;color:#9ca3af;font-size:12px">${isSw ? 'Asante kwa biashara yako!' : 'Thank you for your business!'}</p>
      </div>
    </div>
  `;
};

export const buildReportHTML = (data, lang = 'sw') => {
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

  const topProductsRows = (data.topProducts || []).slice(0, 10).map((p, i) =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${i + 1}. ${p.name}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${p.quantity || 0}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(p.total)}</td>
    </tr>`
  ).join('');

  const netProfit = data.netProfit !== undefined ? data.netProfit : (data.totalProfit || 0) - (data.totalExpenses || 0);

  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#333">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">${data.shopName || 'KasiTRADE'}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">${isSw ? 'RIPOTI YA MAUZO' : 'SALES REPORT'}</p>
      </div>
      <div style="padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <p style="margin:0 0 20px;color:#6b7280;font-size:14px">${isSw ? 'Tarehe' : 'Date'}: ${date}</p>
        <h3 style="margin:0 0 12px;color:#6366f1;font-size:16px">${isSw ? 'MUHTASARI' : 'SUMMARY'}</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Mauzo Yote' : 'Total Sales'}</td><td style="text-align:right;font-weight:600">${fmt(data.totalRevenue)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Idadi ya Mauzo' : 'Transactions'}</td><td style="text-align:right;font-weight:600">${data.totalTransactions || 0}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Wastani kwa Mteja' : 'Avg per Customer'}</td><td style="text-align:right;font-weight:600">${fmt(data.avgOrderValue || 0)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Bidhaa Zilizouzwa' : 'Items Sold'}</td><td style="text-align:right;font-weight:600">${data.productsSold || 0}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Wateja' : 'Customers'}</td><td style="text-align:right;font-weight:600">${data.customerCount || 0}</td></tr>
          ${data.totalExpenses !== undefined ? `<tr><td style="padding:6px 0;color:#6b7280">${isSw ? 'Matumizi' : 'Expenses'}</td><td style="text-align:right;font-weight:600">${fmt(data.totalExpenses)}</td></tr>` : ''}
          <tr style="border-top:2px solid #6366f1"><td style="padding:8px 0;font-weight:700;color:#6366f1">${isSw ? 'FAIDA HAI' : 'NET PROFIT'}</td><td style="text-align:right;font-weight:800;color:#6366f1;font-size:16px">${fmt(netProfit)}</td></tr>
        </table>
        ${topProductsRows ? `<h4 style="margin:20px 0 10px;color:#6366f1">${isSw ? 'BIDHAA KUU' : 'TOP PRODUCTS'}</h4><table style="width:100%;border-collapse:collapse">${topProductsRows}</table>` : ''}
        <p style="margin:24px 0 0;text-align:center;color:#9ca3af;font-size:12px">${isSw ? 'Asante kwa kutumia KasiTRADE!' : 'Thank you for using KasiTRADE!'}</p>
      </div>
    </div>
  `;
};

export const buildWelcomeHTML = (businessName, shopName, lang = 'sw') => {
  const isSw = lang === 'sw';
  const name = businessName || shopName || 'KasiTRADE';
  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#333">
      <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">${isSw ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!'}</h1>
      </div>
      <div style="padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <p style="font-size:15px;line-height:1.6;color:#4b5563">
          ${isSw
            ? `Hongera ${name}! Karibu kwenye familia ya KasiTRADE POS. Mfumo wetu utakusaidia kudhibiti biashara yako kwa ufanisi.`
            : `Congratulations ${name}! Welcome to KasiTRADE POS family. Our system will help you manage your business efficiently.`}
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#166534;font-weight:600">
            ${isSw ? 'Unayo siku 14 za majaribio BURE!' : 'You have 14 days FREE trial!'}
          </p>
        </div>
        <p style="margin:20px 0 0;text-align:center;color:#9ca3af;font-size:12px">${isSw ? 'Tuko pamoja!' : 'We are with you!'} - KasiTRADE</p>
      </div>
    </div>
  `;
};

export const buildLowStockHTML = (products, threshold, shopName, lang = 'sw') => {
  const isSw = lang === 'sw';
  const rows = products.map(p =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${p.name}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;color:#ef4444;font-weight:600">${p.stock}</td>
    </tr>`
  ).join('');

  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#333">
      <div style="background:#ef4444;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">${isSw ? 'TAHADHARI STOCK' : 'LOW STOCK ALERT'}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">${shopName || 'KasiTRADE'}</p>
      </div>
      <div style="padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <p style="margin:0 0 16px;color:#4b5563">
          ${isSw ? `Bidhaa zifuatazo ziko chini ya ${threshold}:` : `The following products are below ${threshold}:`}
        </p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="margin:20px 0 0;text-align:center;color:#9ca3af;font-size:12px">${isSw ? 'Tafadhali jaza hisa mapema.' : 'Please restock soon.'}</p>
      </div>
    </div>
  `;
};

export const buildBirthdayHTML = (customerName, shopName, lang = 'sw') => {
  const isSw = lang === 'sw';
  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#333">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">${isSw ? 'Heri ya Kuzaliwa!' : 'Happy Birthday!'}</h1>
      </div>
      <div style="padding:24px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;text-align:center">
        <p style="font-size:15px;line-height:1.6;color:#4b5563">
          ${isSw
            ? `Heri ya kuzaliwa ${customerName || 'Mteja'}! Tunakutakia siku njema yenye baraka. Tembelea ${shopName || 'duka letu'} kwa ofa maalum ya siku yako ya kuzaliwa.`
            : `Happy Birthday ${customerName || 'Customer'}! Wishing you a blessed day. Visit ${shopName || 'our shop'} for a special birthday offer.`}
        </p>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:12px">${isSw ? 'Karibu!' : 'Welcome!'} - ${shopName || 'KasiTRADE'}</p>
      </div>
    </div>
  `;
};

export const sendEmail = async ({ to, toName, subject, html, serviceId, templateId, publicKey }) => {
  if (!to) return { success: false, error: 'No recipient email provided' };

  const cleanEmail = String(to).toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!rateLimiter.canSend(cleanEmail)) {
    return { success: false, error: 'Too many emails - please wait' };
  }

  const sid = serviceId || DEFAULT_SERVICE_ID;
  const tid = templateId || DEFAULT_TEMPLATES.receipt;
  const pk = publicKey || DEFAULT_PUBLIC_KEY;

  if (!pk || !sid || !tid) {
    return { success: false, error: 'Email service not configured. Set public key, service ID, and template ID in settings.' };
  }

  try {
    const response = await emailjs.send(
      sid,
      tid,
      {
        to_email: cleanEmail,
        to_name: toName || cleanEmail,
        subject: subject || 'KasiTRADE',
        message: subject || '',
        html_content: html,
      },
      pk
    );

    if (response.status === 200) {
      return { success: true, data: response };
    }
    throw new Error(response.text || `HTTP ${response.status}`);
  } catch (error) {
    logger.error('EmailService', 'Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendEmailWithRetry = async (params, maxRetries = 3, delayMs = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await sendEmail(params);
    if (result.success) return result;
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return { success: false, error: 'Failed after all retries' };
};

export const sendWelcomeEmail = async ({ email, businessName, shopName, lang = 'sw', publicKey, serviceId, templateId }) => {
  if (!email) return { success: false, error: 'No email provided' };
  const name = businessName || shopName || '';
  const html = buildWelcomeHTML(name, shopName, lang);
  const subject = lang === 'sw' ? 'Karibu KasiTRADE!' : 'Welcome to KasiTRADE!';
  return sendEmailWithRetry({ to: email, toName: name, subject, html, publicKey, serviceId, templateId });
};

export const sendReceiptEmail = async ({ email, transaction, shopName, lang = 'sw', publicKey, serviceId, templateId }) => {
  if (!email) return { success: false, error: 'No email provided' };
  const html = buildReceiptHTML(transaction, shopName, lang);
  const subject = lang === 'sw'
    ? `Risiti - ${shopName || 'KasiTRADE'}`
    : `Receipt - ${shopName || 'KasiTRADE'}`;
  return sendEmailWithRetry({ to: email, toName: email, subject, html, publicKey, serviceId, templateId });
};

export const sendReportEmail = async ({ email, reportData, shopName, lang = 'sw', publicKey, serviceId, templateId }) => {
  if (!email) return { success: false, error: 'No email provided' };
  const html = buildReportHTML(reportData, lang);
  const date = reportData.date || new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US');
  const subject = lang === 'sw'
    ? `Ripoti ya Mauzo - ${date}`
    : `Sales Report - ${date}`;
  return sendEmailWithRetry({ to: email, toName: shopName, subject, html, publicKey, serviceId, templateId });
};

export const sendLowStockEmail = async ({ email, products, threshold, shopName, lang = 'sw', publicKey, serviceId, templateId }) => {
  if (!email) return { success: false, error: 'No email provided' };
  const html = buildLowStockHTML(products, threshold, shopName, lang);
  const subject = lang === 'sw'
    ? `Tahadhari Stock - ${shopName || 'KasiTRADE'}`
    : `Low Stock Alert - ${shopName || 'KasiTRADE'}`;
  return sendEmailWithRetry({ to: email, toName: shopName, subject, html, publicKey, serviceId, templateId });
};

export const sendBirthdayEmail = async ({ email, customerName, shopName, lang = 'sw', publicKey, serviceId, templateId }) => {
  if (!email) return { success: false, error: 'No email provided' };
  const html = buildBirthdayHTML(customerName, shopName, lang);
  const subject = lang === 'sw'
    ? `Heri ya Kuzaliwa! - ${shopName || 'KasiTRADE'}`
    : `Happy Birthday! - ${shopName || 'KasiTRADE'}`;
  return sendEmailWithRetry({ to: email, toName: customerName || email, subject, html, publicKey, serviceId, templateId });
};

export const sendBulkEmail = async ({ recipients, shopName, lang, publicKey, serviceId, templateId, type, templateData }) => {
  const results = [];
  for (const recipient of recipients) {
    let result;
    switch (type) {
      case 'birthday':
        result = await sendBirthdayEmail({
          email: recipient.email,
          customerName: recipient.name,
          shopName,
          lang,
          publicKey,
          serviceId,
          templateId,
        });
        break;
      default:
        result = { success: false, error: 'Unknown bulk email type' };
    }
    results.push({ recipient: recipient.email, ...result });
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return results;
};
