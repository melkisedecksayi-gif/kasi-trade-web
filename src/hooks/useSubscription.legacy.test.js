/**
 * Majaribio ya njia ya zamani (legacy) inayotumika ikiwa RPC
 * get_my_subscription haijaapply-iwa kwenye database.
 *
 * Kumbuka: useSubscription ina cache ya kiwango cha moduli (`rpcMissing`)
 * inayobaki kati ya majaribio katika faili hii. Test ya kwanza huweka
 * cache; majaribio yaliyobaki hutumia njia ya zamani moja kwa moja.
 * Variant zingine za trigger (42883, ujumbe) zimetengwa kwenye faili
 * zao za pekee ili kila moja ianze na cache safi.
 */
import { renderHook, act } from '@testing-library/react';
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

const legacyTrial = {
  user_id: 'user-1',
  status: 'trial',
  trial_start: '2026-10-10T00:00:00.000Z',
  trial_end: '2026-10-25T00:00:00.000Z',
};

const flush = () => act(async () => {});

const runRetryCycle = async () => {
  await flush();
  await act(async () => { jest.advanceTimersByTime(400); });
  await act(async () => { jest.advanceTimersByTime(800); });
};

const mockLegacyTable = (data, error = null) => {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
  return { maybeSingle, eq, select };
};

const rpcMissingError = {
  code: 'PGRST202',
  message: 'Could not find the function get_my_subscription',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  global.fetch = jest.fn();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useSubscription - njia ya zamani (legacy fallback)', () => {
  // NB: test hii ndiyo huweka cache ya moduli `rpcMissing` kwa faili yote.
  it('huanguka kwenye njia ya zamani RPC ikiwa haiipo (PGRST202) na kuonya console', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockLegacyTable(legacyTrial);
    mockRpc.mockImplementation((name) => {
      if (name === 'get_my_subscription') {
        return Promise.resolve({ data: null, error: rpcMissingError });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('get_my_subscription')
    );
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(result.current.subscription).toEqual(legacyTrial);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('hukimbia cache ya rpcMissing: refresh haendi tena kwenye RPC hiyo', async () => {
    mockLegacyTable(legacyTrial);

    const { result } = renderHook(() => useSubscription(session));
    await flush();
    expect(mockRpc).not.toHaveBeenCalledWith('get_my_subscription');

    await act(async () => { await result.current.refresh(); });
    expect(mockRpc).not.toHaveBeenCalledWith('get_my_subscription');
    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(result.current.subscription).toEqual(legacyTrial);
  });

  it('huita ensure_subscription rekodi ikikosekana kwenye jedwali', async () => {
    const created = { ...legacyTrial, payment_reference: null };
    mockLegacyTable(null);
    mockRpc.mockResolvedValue({ data: [created], error: null });

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(mockRpc).toHaveBeenCalledWith('ensure_subscription');
    expect(result.current.subscription).toEqual(created);
    expect(result.current.canAccess).toBe(true);
  });

  it('huweka expired majaribio yakiisha (tarehe ya mwisho imepita)', async () => {
    mockLegacyTable({ ...legacyTrial, trial_end: '2026-10-18T00:00:00.000Z' });

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(result.current.subscription.status).toBe('expired');
    expect(result.current.canAccess).toBe(false);
    expect(result.current.daysRemaining).toBe(0);
  });

  it('huweka expired subscription inayotumika ikisha (subscription_end imepita)', async () => {
    mockLegacyTable({
      user_id: 'user-1',
      status: 'active',
      subscription_end: '2026-10-01T00:00:00.000Z',
    });

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(result.current.subscription.status).toBe('expired');
    expect(result.current.canAccess).toBe(false);
  });

  it('hachezi expiry yenyewe majaribio bado yakikuwa (fail-open ndani ya legacy)', async () => {
    mockLegacyTable(legacyTrial);

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(result.current.subscription.status).toBe('trial');
    expect(result.current.canAccess).toBe(true);
  });

  it('hushindwa kimya kimya (fail-closed) jedwali likishindwa mara 3', async () => {
    mockLegacyTable(null, { message: 'permission denied for table subscriptions' });

    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();

    expect(result.current.loading).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(result.current.canAccess).toBe(false);
    expect(result.current.error).toBe('permission denied for table subscriptions');
  });

  it('hupokea data ya array kutoka ensure_subscription', async () => {
    mockLegacyTable(null);
    mockRpc.mockResolvedValue({ data: [legacyTrial], error: null });

    const { result } = renderHook(() => useSubscription(session));
    await flush();

    expect(result.current.subscription).toEqual(legacyTrial);
  });

  it('makosa ya RPC yasiyo ya "haipo" hayanguki legacy kwenye hali mpya', async () => {
    // Baada ya cache kuwekwa njia ya zamani inatumika; hapa tunathibitisha
    // kwamba makosa ya kawaida ya jedwali bado yanaishia fail-closed.
    mockLegacyTable(null, { message: 'network unreachable' });

    const { result } = renderHook(() => useSubscription(session));
    await runRetryCycle();

    expect(mockFrom).toHaveBeenCalled();
    expect(result.current.error).toBe('network unreachable');
    expect(result.current.canAccess).toBe(false);
  });
});
