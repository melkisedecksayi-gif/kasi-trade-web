import { generateReportSMS } from './reportSmsFormatter';

const baseline = {
  shopName: 'MELCKY ELECTRONICS',
  startDate: new Date(2026, 9, 27),
  endDate: new Date(2026, 9, 27, 23, 59),
  totalRevenue: 850000,
  totalProfit: 120000,
  totalTransactions: 32,
  productsSold: 50,
  reportType: 'sales',
};

describe('reportSmsFormatter', () => {
  it('includes the actual shop name and sales data', () => {
    const sms = generateReportSMS(baseline, 'sw');
    expect(sms).toContain('MELCKY ELECTRONICS');
    expect(sms).toContain('RIPOTI YA MAUZO');
    expect(sms).toContain('Tarehe: 27/10/2026');
    expect(sms).toContain('Mauzo: TSh 850,000');
    expect(sms).toContain('Faida: TSh 120,000');
    expect(sms).toContain('Miamala: 32');
  });

  it('shows the correct date range for multi-day reports', () => {
    const sms = generateReportSMS({ ...baseline, startDate: new Date(2026, 9, 1) }, 'sw');
    expect(sms).toContain('Kipindi: 01/10/2026-27/10/2026');
  });

  it('generates an English end-of-day message', () => {
    const sms = generateReportSMS({ ...baseline, reportType: 'eod' }, 'en');
    expect(sms).toContain('END OF DAY REPORT');
    expect(sms).toContain('Sales: TSh 850,000');
  });

  it('removes unsupported characters and keeps report in ASCII', () => {
    const sms = generateReportSMS({ ...baseline, shopName: 'Duka Café 🛒 ???' }, 'sw');
    expect(sms).toContain('Duka Cafe');
    expect(sms).not.toContain('???');
    expect(/[^\x00-\x7F]/.test(sms)).toBe(false);
  });

  it('never includes undefined, null or NaN in the message', () => {
    const sms = generateReportSMS({ shopName: 'DUKA A', totalRevenue: undefined, totalProfit: NaN }, 'sw');
    expect(sms).not.toMatch(/undefined|null|NaN/);
    expect(sms).toContain('Mauzo: TSh 0');
  });

  it('blocks sending when the shop name is missing', () => {
    expect(() => generateReportSMS({ shopName: '' }, 'sw')).toThrow('Jina la duka');
  });

  it('keeps long shop names within provider limits', () => {
    const sms = generateReportSMS({ ...baseline, shopName: 'A'.repeat(500) }, 'sw');
    expect(sms.length).toBeLessThanOrEqual(640);
  });
});
