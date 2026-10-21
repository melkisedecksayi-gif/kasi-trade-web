import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionPage from './Subscription';
import PAYMENT from '../config/payment';

const defaultProps = {
  lang: 'sw',
  isDarkMode: false,
  theme: {},
  subscription: { status: 'trial' },
  daysRemaining: 6,
  statusBadge: { bg: '#fef3c7', color: '#d97706' },
  startMobilePayment: jest.fn(),
  refresh: jest.fn(),
  MONTHLY_PRICE: 12000,
};

const renderPage = (props = {}) =>
  render(<SubscriptionPage {...defaultProps} {...props} />);

const typePhone = (value) => {
  fireEvent.change(screen.getByPlaceholderText(/0712345678/), {
    target: { value },
  });
};

const clickPay = () => {
  fireEvent.click(screen.getByRole('button', { name: /Lipa TSh/ }));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SubscriptionPage - kichwa na mpango', () => {
  it('huonyesha kichwa cha Kiswahili', () => {
    renderPage();
    expect(screen.getByText('Usajili wa Mfumo')).toBeInTheDocument();
    expect(
      screen.getByText('Lipia mwezi mmoja kuendelea kutumia KasiTRADE')
    ).toBeInTheDocument();
  });

  it('huonyesha kichwa cha Kiingereza', () => {
    renderPage({ lang: 'en' });
    expect(screen.getByText('System Subscription')).toBeInTheDocument();
  });

  it('huonyesha bei ya mpango na orodha ya vipengele', () => {
    renderPage();
    expect(screen.getByText('TSh 12,000')).toBeInTheDocument();
    expect(screen.getByText('Mauzo (POS)')).toBeInTheDocument();
    expect(screen.getByText('Usimamizi wa Bidhaa')).toBeInTheDocument();
    expect(screen.getByText('Ripoti Kamili')).toBeInTheDocument();
    expect(screen.getByText('Ujumbe wa SMS kwa Wateja')).toBeInTheDocument();
  });

  it('huonyesha vipengele kwa Kiingereza', () => {
    renderPage({ lang: 'en' });
    expect(screen.getByText('Point of Sale (POS)')).toBeInTheDocument();
    expect(screen.getByText('Full Reports')).toBeInTheDocument();
  });
});

describe('SubscriptionPage - bendi ya hali (status banner)', () => {
  it('huonyesha hali ya majaribio kwa Kiswahili', () => {
    renderPage({ subscription: { status: 'trial' }, daysRemaining: 6 });
    expect(screen.getByText('Majaribio - Siku 6 Zimebaki')).toBeInTheDocument();
    expect(screen.getByText('HALI YA AKAUNTI')).toBeInTheDocument();
  });

  it('huonyesha hali ya majaribio kwa Kiingereza', () => {
    renderPage({ lang: 'en', subscription: { status: 'trial' }, daysRemaining: 3 });
    expect(screen.getByText('Trial - 3 Days Left')).toBeInTheDocument();
    expect(screen.getByText('ACCOUNT STATUS')).toBeInTheDocument();
  });

  it('huonyesha hali inayotumika kwa Kiswahili', () => {
    renderPage({ subscription: { status: 'active' }, daysRemaining: 20 });
    expect(screen.getByText('Inatumika - Siku 20 Zimebaki')).toBeInTheDocument();
  });

  it('huonyesha hali inayotumika kwa Kiingereza', () => {
    renderPage({ lang: 'en', subscription: { status: 'active' }, daysRemaining: 20 });
    expect(screen.getByText('Active - 20 Days Left')).toBeInTheDocument();
  });

  it('huchukulia expired bila subscription (fail-closed)', () => {
    renderPage({ subscription: null });
    expect(screen.getByText('Imekwisha - Lipia Kuendelea')).toBeInTheDocument();
  });

  it('huchukulia cancelled kama expired', () => {
    renderPage({ subscription: { status: 'cancelled' } });
    expect(screen.getByText('Imekwisha - Lipia Kuendelea')).toBeInTheDocument();
  });

  it('huonyesha expired kwa Kiingereza', () => {
    renderPage({ lang: 'en', subscription: { status: 'expired' } });
    expect(screen.getByText('Expired - Pay to Continue')).toBeInTheDocument();
  });
});

describe('SubscriptionPage - njia za malipo', () => {
  it('huanza na njia ya simu na kuonyesha mitandao ya AzamPay', () => {
    renderPage();
    expect(screen.getByText('Lipa kupitia Simu:')).toBeInTheDocument();
    ['M-Pesa','Airtel Money','Tigo Pesa / Mixx','HaloPesa','AzamPesa'].forEach((n) =>
      expect(screen.getByRole('radio', { name: n })).toBeInTheDocument()
    );
    expect(screen.getByPlaceholderText(/0712345678/)).toBeInTheDocument();
  });

  it('hubadilisha kwenda benki na kuonyesha maelezo ya benki', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Benki/ }));
    expect(screen.getByText('Lipa kupitia Benki:')).toBeInTheDocument();
    expect(screen.getByText(PAYMENT.bank.bank)).toBeInTheDocument();
    expect(screen.getByText(PAYMENT.bank.account)).toBeInTheDocument();
    // Input ya simu huondolewa; badala yake kitufe cha kupiga msaada
    expect(screen.queryByPlaceholderText(/0712345678/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(`Piga Msaada: ${PAYMENT.support}`) })
    ).toBeInTheDocument();
  });

  it('hubadilisha kwenda taslimu na kuonyesha maelekezo ya ofisini', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Taslimu/ }));
    expect(screen.getByText('Lipa Taslimu Ofisini:')).toBeInTheDocument();
    expect(
      screen.getByText('Tembelea ofisi zetu Dar es Salaam kulipia.')
    ).toBeInTheDocument();
  });

  it('huonyesha maelekezo ya benki kwa Kiingereza', () => {
    renderPage({ lang: 'en' });
    fireEvent.click(screen.getByRole('button', { name: /Bank/ }));
    expect(screen.getByText('Pay via Bank:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(`Call Support: ${PAYMENT.support}`) })
    ).toBeInTheDocument();
  });

  it('huonyesha nambari ya msaada chini ya kadi', () => {
    renderPage();
    expect(
      screen.getByText(`Kwa msaada piga: ${PAYMENT.support}`)
    ).toBeInTheDocument();
  });
});

describe('SubscriptionPage - kaweka namba ya simu (normalizePhone)', () => {
  it('hukataa namba isiyo sahihi na kuonyesha makosa', async () => {
    const startMobilePayment = jest.fn();
    renderPage({ startMobilePayment });
    typePhone('123');
    clickPay();
    expect(
      await screen.findByText('Ingiza namba sahihi ya simu (mfano: 0712345678)')
    ).toBeInTheDocument();
    expect(startMobilePayment).not.toHaveBeenCalled();
  });

  it('hukataa namba tupu', async () => {
    const startMobilePayment = jest.fn();
    renderPage({ startMobilePayment });
    typePhone('');
    clickPay();
    expect(
      await screen.findByText('Ingiza namba sahihi ya simu (mfano: 0712345678)')
    ).toBeInTheDocument();
    expect(startMobilePayment).not.toHaveBeenCalled();
  });

  it('hukataa namba ndefu mno', async () => {
    const startMobilePayment = jest.fn();
    renderPage({ startMobilePayment });
    typePhone('071234567890123');
    clickPay();
    expect(
      await screen.findByText('Ingiza namba sahihi ya simu (mfano: 0712345678)')
    ).toBeInTheDocument();
    expect(startMobilePayment).not.toHaveBeenCalled();
  });

  it.each([
    ['0712345678', '255712345678'],
    ['712345678', '255712345678'],
    ['255712345678', '255712345678'],
    ['0712 345 678', '255712345678'],
    ['0712-345-678', '255712345678'],
    ['0712 (345) 678', '255712345678'],
    ['812345678', '255812345678'],
  ])('hubadilisha %s kuwa %s', async (input, expected) => {
    const startMobilePayment = jest.fn().mockResolvedValue({ success: true });
    renderPage({ startMobilePayment });
    typePhone(input);
    clickPay();
    await waitFor(() => expect(startMobilePayment).toHaveBeenCalledWith(expected, expect.any(String)));
  });

  it('hukataa namba isiyo ya Tanzania (haianzi na 0, 7, 8, au 255)', async () => {
    const startMobilePayment = jest.fn();
    renderPage({ startMobilePayment });
    typePhone('999999');
    clickPay();
    expect(
      await screen.findByText('Ingiza namba sahihi ya simu (mfano: 0712345678)')
    ).toBeInTheDocument();
    expect(startMobilePayment).not.toHaveBeenCalled();
  });

  it('hukataa namba ya Kiingereza kwa lugha ya Kiingereza', async () => {
    const startMobilePayment = jest.fn();
    renderPage({ lang: 'en', startMobilePayment });
    typePhone('abc');
    fireEvent.click(screen.getByRole('button', { name: /Pay TSh/ }));
    expect(
      await screen.findByText('Enter a valid phone number (e.g. 0712345678)')
    ).toBeInTheDocument();
    expect(startMobilePayment).not.toHaveBeenCalled();
  });
});

describe('SubscriptionPage - kutuma malipo ya simu', () => {
  it('huonyesha skrini ya mafanikio na kurefresh baada ya malipo', async () => {
    const startMobilePayment = jest.fn().mockResolvedValue({ success: true });
    const refresh = jest.fn();
    renderPage({ startMobilePayment, refresh });
    typePhone('0712345678');
    clickPay();

    expect(await screen.findByText('Malipo Yamepokelewa!')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(startMobilePayment).toHaveBeenCalledWith('255712345678', 'Tigo');
    // Kiashiria cha malipo huondoka
    expect(screen.queryByText(/Lipa TSh/)).not.toBeInTheDocument();
  });

  it('huonyesha skrini ya mafanikio kwa Kiingereza', async () => {
    const startMobilePayment = jest.fn().mockResolvedValue({ success: true });
    renderPage({ lang: 'en', startMobilePayment });
    typePhone('0712345678');
    fireEvent.click(screen.getByRole('button', { name: /Pay TSh/ }));
    expect(await screen.findByText('Payment Received!')).toBeInTheDocument();
  });

  it('hukataa mafanikio ikiwa result.success ni false', async () => {
    const startMobilePayment = jest.fn().mockResolvedValue({ success: false });
    const refresh = jest.fn();
    renderPage({ startMobilePayment, refresh });
    typePhone('0712345678');
    clickPay();

    await waitFor(() => expect(startMobilePayment).toHaveBeenCalled());
    expect(screen.queryByText('Malipo Yamepokelewa!')).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('huonyesha ujumbe wa makosa kutoka server', async () => {
    const startMobilePayment = jest
      .fn()
      .mockRejectedValue(new Error('Huna salio la kutosha'));
    renderPage({ startMobilePayment });
    typePhone('0712345678');
    clickPay();

    expect(await screen.findByText('Huna salio la kutosha')).toBeInTheDocument();
    expect(screen.queryByText('Malipo Yamepokelewa!')).not.toBeInTheDocument();
  });

  it('huonyesha ujumbe chaguomsingi makosa yakiwa bila ujumbe', async () => {
    const startMobilePayment = jest.fn().mockRejectedValue({});
    renderPage({ startMobilePayment });
    typePhone('0712345678');
    clickPay();

    expect(
      await screen.findByText('Imeshindwa kutuma ombi la malipo. Jaribu tena.')
    ).toBeInTheDocument();
  });

  it('huonyesha ujumbe wa makosa kwa Kiingereza', async () => {
    const startMobilePayment = jest.fn().mockRejectedValue({});
    renderPage({ lang: 'en', startMobilePayment });
    typePhone('0712345678');
    fireEvent.click(screen.getByRole('button', { name: /Pay TSh/ }));

    expect(
      await screen.findByText('Failed to initiate payment. Try again.')
    ).toBeInTheDocument();
  });

  it('huonyesha makosa ikiwa malipo ya simu hayapatikani (startMobilePayment si function)', async () => {
    renderPage({ startMobilePayment: undefined });
    typePhone('0712345678');
    clickPay();

    expect(
      await screen.findByText(
        'Malipo ya simu hayapatikani kwa sasa. Wasiliana na msaada.'
      )
    ).toBeInTheDocument();
  });

  it('huonyesha hali ya kusubiri na kuzima input wakati wa malipo', async () => {
    let resolvePayment;
    const startMobilePayment = jest.fn(
      () => new Promise((resolve) => { resolvePayment = resolve; })
    );
    renderPage({ startMobilePayment });
    typePhone('0712345678');
    clickPay();

    expect(await screen.findByText('Inasubiri Tigo Pesa / Mixx...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0712345678/)).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Inasubiri Tigo Pesa/ })
    ).toBeDisabled();

    resolvePayment({ success: true });
    expect(await screen.findByText('Malipo Yamepokelewa!')).toBeInTheDocument();
  });

  it('huonyesha hali ya kusubiri kwa Kiingereza', async () => {
    let resolvePayment;
    const startMobilePayment = jest.fn(
      () => new Promise((resolve) => { resolvePayment = resolve; })
    );
    renderPage({ lang: 'en', startMobilePayment });
    typePhone('0712345678');
    fireEvent.click(screen.getByRole('button', { name: /Pay TSh/ }));

    expect(await screen.findByText('Waiting for Tigo Pesa / Mixx...')).toBeInTheDocument();
    resolvePayment({ success: true });
    expect(await screen.findByText('Payment Received!')).toBeInTheDocument();
  });

  it('huondoa makosa ya awali malipo yanapofanikiwa', async () => {
    const startMobilePayment = jest
      .fn()
      .mockRejectedValueOnce(new Error('Jaribu tena'))
      .mockResolvedValueOnce({ success: true });
    renderPage({ startMobilePayment });
    typePhone('0712345678');
    clickPay();
    expect(await screen.findByText('Jaribu tena')).toBeInTheDocument();

    clickPay();
    expect(await screen.findByText('Malipo Yamepokelewa!')).toBeInTheDocument();
    expect(screen.queryByText('Jaribu tena')).not.toBeInTheDocument();
  });
});

describe('SubscriptionPage - uchaguzi wa mtandao (AzamPay)', () => {
  const radio = (name) => screen.getByRole('radio', { name });

  it('huchagua mtandao kutokana na namba ya simu', () => {
    renderPage();
    expect(radio('M-Pesa')).toHaveAttribute('aria-checked', 'true');
    typePhone('0754123456');
    expect(radio('M-Pesa')).toHaveAttribute('aria-checked', 'true');
    typePhone('0682123456');
    expect(radio('Airtel Money')).toHaveAttribute('aria-checked', 'true');
    typePhone('0652123456');
    expect(radio('Tigo Pesa / Mixx')).toHaveAttribute('aria-checked', 'true');
    typePhone('0622123456');
    expect(radio('HaloPesa')).toHaveAttribute('aria-checked', 'true');
  });

  it('uchaguzi wa mteja hauandikwi juu na utambuzi wa kiotomatiki', () => {
    renderPage();
    fireEvent.click(radio('AzamPesa'));
    typePhone('0754123456');
    expect(radio('AzamPesa')).toHaveAttribute('aria-checked', 'true');
    expect(radio('M-Pesa')).toHaveAttribute('aria-checked', 'false');
  });

  it.each([
    ['M-Pesa', 'Mpesa'],
    ['Airtel Money', 'Airtel'],
    ['Tigo Pesa / Mixx', 'Tigo'],
    ['HaloPesa', 'Halopesa'],
    ['AzamPesa', 'Azampesa'],
  ])('hutuma mtandao %s kama provider "%s"', async (label, provider) => {
    const startMobilePayment = jest.fn().mockResolvedValue({ success: true });
    renderPage({ startMobilePayment });
    fireEvent.click(radio(label));
    typePhone('0754123456');
    clickPay();
    await waitFor(() =>
      expect(startMobilePayment).toHaveBeenCalledWith('255754123456', provider)
    );
  });
});
