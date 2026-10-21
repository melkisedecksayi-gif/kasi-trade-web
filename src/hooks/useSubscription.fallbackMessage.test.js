/**
 * Kipimo kimoja: RPC get_my_subscription inaisha kwa ujumbe
 * "could not find the function" bila code maalum.
 * Faili ya pekee ili cache ya moduli `rpcMissing` ianze safi.
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useSubscription - fallback kwa ujumbe wa "function haipo"', () => {
  it('huanguka kwenye njia ya zamani kwa ujumbe "could not find the function" bila code', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: legacyTrial, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    mockRpc.mockImplementation((name) => {
      if (name === 'get_my_subscription') {
        return Promise.resolve({
          data: null,
          error: { message: 'Could not find the function public.get_my_subscription in the schema cache' },
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useSubscription(session));
    await act(async () => {});

    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(result.current.subscription).toEqual(legacyTrial);
    expect(result.current.canAccess).toBe(true);
  });
});
