import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubscription } from './useSubscription';

const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    from: (...args) => mockFrom(...args),
    auth: { getSession: (...args) => mockGetSession(...args) },
  },
}));

const session = { user: { id: 'user-1', email: 'test@example.com' } };
const NOW = new Date('2026-10-19T00:00:00.000Z');

const trialSub = {
  user_id: 'user-1',
  status: 'trial',
  trial_start: '2026-10-10T00:00:00.000Z',
  trial_end: '2026-10-25T00:00:00.000Z',
};

const activeSub = {
  user_id: 'user-1',
  status: 'active',
  subscription_start: '2026-10-01T00:00:00.000Z',
  subscription_end: '2026-11-10T00:00:00.000Z',
};

const flush = () => act(async () => {});

// Safu za majaribio 3 (attempts): jaribio la 1 mara moja, kisha delay
// ya 400ms, jaribio la 2, kisha delay ya 800ms, jaribio la 3.
const runRetryCycle = async () => {
  await flush();
  await act(async () => { jest.advanceTimersByTime(400); });
  await act(async () => { jest.advanceTimersByTime(800); });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  global.fetch = jest.fn();
  mockRpc.mockResolvedValue({ data: null, error: null });
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSubscription - kupakia hali (loading)', () => {
  it('huanza na loading=true bila subscription', () => {
    mockRpc.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSubscription(session));
    expect(result.current.loading).toBe(true);
    expect(result.current.subscription).toBeNull();
    expect(result.current.canAccess).toBe(false);
  });

  it('hupakia subscription ya majaribio na kutoa access', async () => {
    mockRpc.mockResolvedValue({ data: trialSub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.subscription).toEqual(trialSub);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.daysRemaining).toBe(6);
    expect(result.current.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('get_my_subscription');
  });

  it('hupakia subscription inayotumika (active) na kutoa access', async () => {
    mockRpc.mockResolvedValue({ data: activeSub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(result.current.subscription).toEqual(activeSub);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.daysRemaining).toBe(22);
  });

  it('hurekebisha data ya array kutoka RPC (data ya kwanza pekee)', async () => {
    mockRpc.mockResolvedValue({ data: [trialSub], error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(result.current.subscription).toEqual(trialSub);
  });

  it('subscription ya null inatoa canAccess=false', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(result.current.subscription).toBeNull();
    expect(result.current.canAccess).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('haisombii RPC kabisa bila session', async () => {
    const { result } = renderHook(() => useSubscription(null));
    await flush();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(result.current.subscription).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.canAccess).toBe(false);
  });

  it('session bila user id husombii RPC', async () => {
    const { result } = renderHook(() => useSubscription({}));
    await flush();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('hujaribu mara 3 kabla ya kushindwa (retries)', async () => {
    mockRpc
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ data: trialSub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();
    expect(mockRpc).toHaveBeenCalledTimes(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.subscription).toEqual(trialSub);
    expect(result.current.error).toBeNull();
  });

  it('hushindwa kimya kimya (fail-closed) baada ya majaribio 3', async () => {
    mockRpc.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();
    expect(mockRpc).toHaveBeenCalledTimes(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(result.current.canAccess).toBe(false);
    expect(result.current.error).toBe('boom');
  });

  it('hutumia ujumbe chaguomsingi ukikosekana ujumbe wa makosa', async () => {
    mockRpc.mockRejectedValue({});
    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();
    expect(result.current.error).toBe('Imeshindwa kupata hali ya usajili');
    expect(result.current.canAccess).toBe(false);
  });

  it('huonyesha ujumbe wa makosa kutoka kwa server', async () => {
    mockRpc.mockRejectedValue(new Error('JWT expired'));
    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();
    expect(result.current.error).toBe('JWT expired');
  });

  it('refresh() hurejesha hali mpya kutoka server', async () => {
    mockRpc.mockResolvedValue({ data: trialSub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(result.current.subscription).toEqual(trialSub);

    mockRpc.mockResolvedValue({ data: activeSub, error: null });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.subscription).toEqual(activeSub);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});

describe('useSubscription - siku zilizobaki', () => {
  const renderWithSub = async (sub) => {
    mockRpc.mockResolvedValue({ data: sub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    return result;
  };

  it('hujesabu siku za majaribio zilizobaki', async () => {
    const result = await renderWithSub(trialSub);
    expect(result.current.daysRemaining).toBe(6);
  });

  it('hujesabu siku za subscription inayotumika zilizobaki', async () => {
    const result = await renderWithSub(activeSub);
    expect(result.current.daysRemaining).toBe(22);
  });

  it('hurudisha 0 majaribio yakiisha (tarehe ya mwisho imepita)', async () => {
    const result = await renderWithSub({
      ...trialSub,
      trial_end: '2026-10-18T00:00:00.000Z',
    });
    expect(result.current.daysRemaining).toBe(0);
  });

  it('hurudisha 0 subscription ikiwa imeisha (subscription_end imepita)', async () => {
    const result = await renderWithSub({
      ...activeSub,
      subscription_end: '2026-10-01T00:00:00.000Z',
    });
    expect(result.current.daysRemaining).toBe(0);
  });

  it('hurudisha 0 kwa status ya expired (hakuna tarehe ya mwisho)', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'expired' });
    expect(result.current.daysRemaining).toBe(0);
  });

  it('hurudisha 0 kwa status ya cancelled', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'cancelled' });
    expect(result.current.daysRemaining).toBe(0);
  });

  it('hurudisha 0 trial bila trial_end', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'trial' });
    expect(result.current.daysRemaining).toBe(0);
  });

  it('hurudisha 0 bila subscription', async () => {
    const result = await renderWithSub(null);
    expect(result.current.daysRemaining).toBe(0);
  });
});

describe('useSubscription - statusText', () => {
  const renderWithSub = async (sub) => {
    mockRpc.mockResolvedValue({ data: sub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    return result;
  };

  it('hali ya majaribio kwa Kiswahili na Kiingereza', async () => {
    const result = await renderWithSub(trialSub);
    expect(result.current.statusText('sw')).toBe('Majaribio (siku 6 zimebaki)');
    expect(result.current.statusText('en')).toBe('Trial (6 days left)');
  });

  it('hali inayotumika kwa Kiswahili na Kiingereza', async () => {
    const result = await renderWithSub(activeSub);
    expect(result.current.statusText('sw')).toBe('Inatumika (siku 22 zimebaki)');
    expect(result.current.statusText('en')).toBe('Active (22 days left)');
  });

  it('hali imeisha kwa Kiswahili na Kiingereza', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'expired' });
    expect(result.current.statusText('sw')).toBe('Imekwisha - Lipia sasa');
    expect(result.current.statusText('en')).toBe('Expired - Pay now');
  });

  it('hali imesitishwa kwa Kiswahili na Kiingereza', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'cancelled' });
    expect(result.current.statusText('sw')).toBe('Imesitishwa');
    expect(result.current.statusText('en')).toBe('Cancelled');
  });

  it('kurudisha status ghafi kwa status isiyojulikana', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'grace' });
    expect(result.current.statusText('sw')).toBe('grace');
  });

  it('kurudisha ujumbe tupu bila subscription', async () => {
    const result = await renderWithSub(null);
    expect(result.current.statusText('sw')).toBe('');
  });

  it('lugha chaguomsingi ni Kiswahili', async () => {
    const result = await renderWithSub(trialSub);
    expect(result.current.statusText()).toBe('Majaribio (siku 6 zimebaki)');
  });
});

describe('useSubscription - statusBadge', () => {
  const renderWithSub = async (sub) => {
    mockRpc.mockResolvedValue({ data: sub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    return result;
  };

  it('rangi ya majaribio', async () => {
    const result = await renderWithSub(trialSub);
    expect(result.current.statusBadge).toEqual({ bg: '#fef3c7', color: '#d97706' });
  });

  it('rangi ya inayotumika', async () => {
    const result = await renderWithSub(activeSub);
    expect(result.current.statusBadge).toEqual({ bg: '#d1fae5', color: '#059669' });
  });

  it('rangi ya imeisha', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'expired' });
    expect(result.current.statusBadge).toEqual({ bg: '#fee2e2', color: '#dc2626' });
  });

  it('rangi ya imesitishwa', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'cancelled' });
    expect(result.current.statusBadge).toEqual({ bg: '#f1f5f9', color: '#64748b' });
  });

  it('rangi chaguomsingi bila subscription', async () => {
    const result = await renderWithSub(null);
    expect(result.current.statusBadge).toEqual({ bg: '#f1f5f9', color: '#64748b' });
  });

  it('rangi chaguomsingi kwa status isiyojulikana', async () => {
    const result = await renderWithSub({ user_id: 'user-1', status: 'weird' });
    expect(result.current.statusBadge).toEqual({ bg: '#f1f5f9', color: '#64748b' });
  });
});

describe('useSubscription - canAccess', () => {
  const renderWithSub = async (sub) => {
    mockRpc.mockResolvedValue({ data: sub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();
    return result;
  };

  it('majariibu na inayotumika huruhusu access', async () => {
    expect((await renderWithSub(trialSub)).current.canAccess).toBe(true);
    expect((await renderWithSub(activeSub)).current.canAccess).toBe(true);
  });

  it('imeisha, imesitishwa na isiyojulikana haziruhusu access', async () => {
    expect((await renderWithSub({ user_id: 'user-1', status: 'expired' })).current.canAccess).toBe(false);
    expect((await renderWithSub({ user_id: 'user-1', status: 'cancelled' })).current.canAccess).toBe(false);
    expect((await renderWithSub({ user_id: 'user-1', status: 'other' })).current.canAccess).toBe(false);
  });

  it('subscription ya null hairuhusu access (fail-closed)', async () => {
    expect((await renderWithSub(null)).current.canAccess).toBe(false);
  });
});

describe('useSubscription - activateSubscription', () => {
  it('huita RPC activate_subscription na kusasisha hali', async () => {
    mockRpc.mockImplementation((name) => {
      if (name === 'activate_subscription') {
        return Promise.resolve({ data: activeSub, error: null });
      }
      return Promise.resolve({ data: activeSub, error: null });
    });
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    await act(async () => {
      await result.current.activateSubscription('CODE123');
    });
    expect(mockRpc).toHaveBeenCalledWith('activate_subscription', { p_code: 'CODE123' });
    expect(result.current.subscription).toEqual(activeSub);
  });

  it('hurusha makosa ikiwa code si sahihi', async () => {
    mockRpc.mockImplementation((name) => {
      if (name === 'activate_subscription') {
        return Promise.resolve({ data: null, error: { message: 'Code si sahihi' } });
      }
      return Promise.resolve({ data: null, error: null });
    });
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    let thrown = null;
    try {
      await act(async () => { await result.current.activateSubscription('BAD'); });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeTruthy();
    expect(thrown.message).toBe('Code si sahihi');
  });

  it('hurudisha true akifanikiwa', async () => {
    mockRpc.mockResolvedValue({ data: trialSub, error: null });
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    let outcome = null;
    await act(async () => {
      outcome = await result.current.activateSubscription('CODE123');
    });
    expect(outcome).toBe(true);
  });
});

describe('useSubscription - startMobilePayment', () => {
  const okJson = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  const errJson = (body) => Promise.resolve({ ok: false, json: () => Promise.resolve(body) });

  const startPayment = (result, phone = '255712345678', provider = 'Mpesa') => {
    let promise;
    act(() => {
      promise = result.current.startMobilePayment(phone, provider);
    });
    return promise;
  };

  // Session + push zinahitaji microtask flush tu; kisha poll inasubiri timer.
  const flushToFirstPoll = async () => {
    await flush();
  };

  // Hussafisha timer na kisha kutekeleza mistari ya microtask (fetch/json)
  // ili loop ianzishe timer ifuatayo kabla ya advance inayofuata.
  const advance = async (ms) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      for (let i = 0; i < 20; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.resolve();
      }
    });
  };

  it('hurusha makosa bila ruhusa (token)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    let thrown = null;
    try {
      await act(async () => { await result.current.startMobilePayment('255712345678', 'Mpesa'); });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe('Huna ruhusa');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('hutuma ombi sahihi kwa azampay-push na kuchuja paymentId', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce(okJson({ status: 'failed' }));
    const { result } = renderHook(() => useSubscription(session));

    const promise = startPayment(result);
    await flushToFirstPoll();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/functions/v1/azampay-push');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    // Kiasi hakitumwi na client — server ndiyo huamua bei
    expect(JSON.parse(options.body)).toEqual({ phone: '255712345678', provider: 'Mpesa' });

    let thrown = null;
    try {
      await act(async () => {
        jest.advanceTimersByTime(5000);
        await promise;
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe('Malipo yamekataliwa');
  });

  it('hurusha ujumbe wa server ikiwa azampay-push imeshindwa', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(errJson({ error: 'Huna salio la kutosha' }));
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    let thrown = null;
    try {
      await act(async () => { await result.current.startMobilePayment('255712345678', 'Mpesa'); });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe('Huna salio la kutosha');
  });

  it('hurusha ujumbe chaguomsingi ikiwa azampay-push imeshindwa bila ujumbe', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
    });
    const { result } = renderHook(() => useSubscription(session));
    await flush();

    let thrown = null;
    try {
      await act(async () => { await result.current.startMobilePayment('255712345678', 'Mpesa'); });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe('Imeshindikana kuanzisha malipo');
  });

  it('hukamilika mara ya kwanza ya poll na kusasisha subscription', async () => {
    mockRpc.mockResolvedValue({ data: activeSub, error: null });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce(okJson({ status: 'completed', subscription: [activeSub] }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    await flushToFirstPoll();

    let outcome = null;
    await act(async () => {
      jest.advanceTimersByTime(5000);
      outcome = await promise;
    });

    expect(outcome).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [statusUrl, statusOptions] = global.fetch.mock.calls[1];
    expect(statusUrl).toContain('/functions/v1/azampay-status');
    expect(JSON.parse(statusOptions.body)).toEqual({ paymentId: 'pay-1' });
    expect(result.current.subscription).toEqual(activeSub);
  });

  it('huendelea kupoll mpaka malipo yakamilike', async () => {
    mockRpc.mockResolvedValue({ data: activeSub, error: null });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce(okJson({ status: 'pending' }))
      .mockResolvedValueOnce(okJson({ status: 'pending' }))
      .mockResolvedValueOnce(okJson({ status: 'completed', subscription: activeSub }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    await flushToFirstPoll();

    await advance(5000);
    await advance(5000);
    let outcome = null;
    await act(async () => {
      jest.advanceTimersByTime(5000);
      outcome = await promise;
    });

    expect(outcome).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('hurusha makosa status ikiwa malipo yamekataliwa', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce(okJson({ status: 'failed' }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    await flushToFirstPoll();

    let thrown = null;
    try {
      await act(async () => {
        jest.advanceTimersByTime(5000);
        await promise;
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe('Malipo yamekataliwa');
  });

  it('huendelea kupoll status endpoint ikishindwa (ok=false)', async () => {
    mockRpc.mockResolvedValue({ data: activeSub, error: null });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce(okJson({ status: 'completed', subscription: activeSub }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    await flushToFirstPoll();

    await advance(5000);
    let outcome = null;
    await act(async () => {
      jest.advanceTimersByTime(5000);
      outcome = await promise;
    });

    expect(outcome).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('hurusha makosa baada ya majaribio 30 ya kupoll (timeout)', async () => {
    global.fetch = jest.fn().mockImplementation(() => okJson({ status: 'pending' }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    // Zuia unhandled-rejection onyo: tutaisubiri promise baadaye ndani ya try/catch.
    promise.catch(() => {});
    await flushToFirstPoll();

    for (let i = 0; i < 30; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await advance(5000);
    }

    let thrown = null;
    try {
      await promise;
    } catch (e) {
      thrown = e;
    }
    expect(thrown.message).toBe(
      'Malipo hayajakamilika bado. Thibitisha kwenye simu yako au jaribu tena.'
    );
    expect(global.fetch).toHaveBeenCalledTimes(31);
  });

  it('hurudisha subscription kutoka kwenye status ya malipo', async () => {
    const paidSub = { ...activeSub, payment_reference: 'MP261019' };
    mockRpc.mockResolvedValue({ data: paidSub, error: null });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ paymentId: 'pay-1' }))
      .mockResolvedValueOnce(okJson({ status: 'completed', subscription: paidSub }));

    const { result } = renderHook(() => useSubscription(session));
    const promise = startPayment(result);
    await flushToFirstPoll();

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await promise;
    });

    expect(result.current.subscription).toEqual(paidSub);
    expect(result.current.canAccess).toBe(true);
    // Malipo yakamilika -> hook hurefresh kupitia get_my_subscription
    expect(mockRpc).toHaveBeenCalledWith('get_my_subscription');
  });
});
