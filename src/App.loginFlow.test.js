/** Regression tests: password login, subscription loading, and session refresh with optional OTP disabled. */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from './App';
import { supabase } from './supabaseClient';

const chain = () => {
  const c = {
    select: () => c, eq: () => c, gte: () => c, lt: () => c, gt: () => c, in: () => c, not: () => c,
    insert: () => c, update: () => c, upsert: () => c, delete: () => c, order: () => c, limit: () => c,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (ok, bad) => Promise.resolve({ data: null, error: null }).then(ok, bad),
  };
  return c;
};

const mockSubState = {
  subscription: null, loading: false, error: null, canAccess: false, daysRemaining: 0,
  statusBadge: { bg: '#f1f5f9', color: '#64748b' }, statusText: jest.fn(() => ''),
  activateSubscription: jest.fn(), startMobilePayment: jest.fn(), refresh: jest.fn(),
  MONTHLY_PRICE: 12000, TRIAL_DAYS: 14,
};

const mockAuthMounts = { count: 0 };

jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(), onAuthStateChange: jest.fn(), signOut: jest.fn(), signInWithOtp: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));
jest.mock('./hooks/useSubscription', () => ({ useSubscription: () => mockSubState }));
jest.mock('./hooks/useKeyboard', () => () => {});

// Simulated password login. OTP is intentionally disabled in KasiTrade.
// This mock tracks mounts to catch unexpected login remounts.
jest.mock('./components/Auth', () => {
  const React = require('react'); // eslint-disable-line global-require
  return {
    __esModule: true,
    default: function MockAuth() {
      React.useEffect(() => { mockAuthMounts.count += 1; }, []);
      return <div>FOMU-YA-LOGIN</div>;
    },
  };
});

// Kurasa za App hupakiwa kwa lazy(); chini ya mzigo wa suite nzima zinaweza kuchelewa.
jest.setTimeout(30000);

const SESSION = { user: { id: 'user-1', email: 'test@example.com' } };
let authCallback;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockAuthMounts.count = 0;
  Object.assign(mockSubState, { subscription: null, loading: false, canAccess: false });

  supabase.auth.getSession.mockImplementation(async () => ({ data: { session: null } }));
  supabase.auth.onAuthStateChange.mockImplementation((cb) => {
    authCallback = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  supabase.auth.signOut.mockImplementation(async () => ({}));
  supabase.auth.signInWithOtp.mockImplementation(async () => ({ error: null }));
  supabase.from.mockImplementation(() => chain());
  supabase.rpc.mockImplementation(async () => ({ data: null, error: null }));
});

const goToLogin = async () => {
  let view;
  await act(async () => { view = render(<App />); });
  fireEvent.click((await screen.findAllByText(/Anza Bure Sasa/i, {}, { timeout: 15000 }))[0]);
  await screen.findByText('FOMU-YA-LOGIN', {}, { timeout: 15000 });
  return view;
};

describe('App - login bila OTP na bila redirect loop', () => {
  it('baada ya SIGNED_IN huonyesha loader wakati subscription inapakia, si fomu ya Login', async () => {
    await goToLogin();
    expect(mockAuthMounts.count).toBe(1);

    mockSubState.loading = true;
    await act(async () => { authCallback('SIGNED_IN', SESSION); });

    expect(await screen.findByText('Inapakia KasiTRADE...')).toBeInTheDocument();
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('baada ya SIGNED_IN na subscription halali huingia Dashboard bila OTP', async () => {
    const view = await goToLogin();
    mockSubState.loading = true;
    await act(async () => { authCallback('SIGNED_IN', SESSION); });

    expect(await screen.findByText('Inapakia KasiTRADE...')).toBeInTheDocument();
    Object.assign(mockSubState, {
      loading: false, canAccess: true,
      subscription: { status: 'active' }, daysRemaining: 20,
    });
    await act(async () => { view.rerender(<App />); });

    expect(await screen.findAllByText('Dashibodi', {}, { timeout: 15000 })).toHaveLength(2);
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('refresh yenye session halali hupakia Dashboard, si Login', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    Object.assign(mockSubState, {
      loading: false, canAccess: true,
      subscription: { status: 'active' }, daysRemaining: 20,
    });
    await act(async () => { render(<App />); });

    expect(await screen.findAllByText('Dashibodi', {}, { timeout: 15000 })).toHaveLength(2);
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
  });

  it('OTP flags za zamani hazisababishi logout baada ya refresh', async () => {
    localStorage.setItem('app_otpPending', 'true');
    localStorage.setItem('app_googleOtpPending', 'true');
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    Object.assign(mockSubState, {
      loading: false, canAccess: true,
      subscription: { status: 'active' }, daysRemaining: 20,
    });
    await act(async () => { render(<App />); });

    expect(await screen.findAllByText('Dashibodi', {}, { timeout: 15000 })).toHaveLength(2);
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
