/**
 * `session` hupata object mpya kila SIGNED_IN (tab ikirudi mbele) / TOKEN_REFRESHED.
 * Hook isimrudishe mtumiaji kwenye loading=true (App huonyesha spinner na kuondoa kila kitu)
 * wala isimfungie nje kwa hitilafu ya muda mfupi ya mtandao.
 */
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from './useSubscription';

const mockRpc = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    from: jest.fn(),
    auth: { getSession: jest.fn() },
  },
}));

const activeSub = {
  user_id: 'user-1',
  status: 'active',
  subscription_start: '2026-10-01T00:00:00.000Z',
  subscription_end: '2099-11-10T00:00:00.000Z',
};

const flush = () => act(async () => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockResolvedValue({ data: activeSub, error: null });
});

describe('useSubscription - refresh ya kimya', () => {
  it('session mpya ya mtumiaji yule yule HAIRUDISHI loading=true wala kuita RPC tena', async () => {
    const { result, rerender } = renderHook(({ s }) => useSubscription(s), {
      initialProps: { s: { user: { id: 'user-1' }, access_token: 'a' } },
    });
    await flush();
    expect(result.current.loading).toBe(false);
    expect(mockRpc).toHaveBeenCalledTimes(1);

    // TOKEN_REFRESHED / SIGNED_IN ya tab focus: object mpya, mtumiaji yule yule
    rerender({ s: { user: { id: 'user-1' }, access_token: 'b' } });
    expect(result.current.loading).toBe(false);
    await flush();
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(result.current.canAccess).toBe(true);
  });

  it('mtumiaji tofauti hupata loading=true na kupakia upya', async () => {
    const { result, rerender } = renderHook(({ s }) => useSubscription(s), {
      initialProps: { s: { user: { id: 'user-1' } } },
    });
    await flush();
    mockRpc.mockReturnValue(new Promise(() => {}));
    rerender({ s: { user: { id: 'user-2' } } });
    expect(result.current.loading).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it('refresh() ya kimya ikishindwa haimfungii mtumiaji nje (inabaki na hali ya awali)', async () => {
    const { result } = renderHook(() => useSubscription({ user: { id: 'user-1' } }));
    await flush();
    expect(result.current.canAccess).toBe(true);

    mockRpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'network' } });
    jest.useFakeTimers();
    let p;
    act(() => { p = result.current.refresh(); });
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { jest.advanceTimersByTime(1000); });
    }
    await act(async () => { await p; });
    jest.useRealTimers();

    expect(result.current.loading).toBe(false);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('kupakia kwa mara ya kwanza kukishindwa bado ni fail-closed', async () => {
    jest.useFakeTimers();
    mockRpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });
    const { result } = renderHook(() => useSubscription({ user: { id: 'user-1' } }));
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { jest.advanceTimersByTime(1000); });
    }
    jest.useRealTimers();

    expect(result.current.loading).toBe(false);
    expect(result.current.canAccess).toBe(false);
    expect(result.current.error).toBe('boom');
  });
});
