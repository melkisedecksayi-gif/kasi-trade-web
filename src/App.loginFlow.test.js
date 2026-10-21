/**
 * Regression: "Auth redirect loop".
 * Baada ya signInWithPassword kufanikiwa, Supabase hutuma SIGNED_IN -> App huweka `session`
 * -> useSubscription huanza kupakia. Hapo App ilibadilisha <Auth> na spinner (Auth ika-unmount,
 * ikapoteza hatua ya OTP) kisha ikaionyesha tena Auth mpya yenye fomu ya Login tupu.
 * Mtumiaji alirudishwa kwenye Login huku OTP tayari imetumwa.
 */
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

// Auth ya majaribio yenye hali ya ndani (kama hatua ya OTP) na kihesabu cha mounts
jest.mock('./components/Auth', () => {
  const React = require('react'); // eslint-disable-line global-require
  return {
    __esModule: true,
    default: function MockAuth({ onAuthSuccess }) {
      const [step, setStep] = React.useState('password');
      React.useEffect(() => { mockAuthMounts.count += 1; }, []);
      return (
        <div>
          <div>{step === 'otp' ? 'HATUA-YA-OTP' : 'FOMU-YA-LOGIN'}</div>
          <button onClick={() => setStep('otp')}>pitisha-nenosiri</button>
          <button onClick={() => onAuthSuccess()}>thibitisha-otp</button>
        </div>
      );
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
  await act(async () => { render(<App />); });
  fireEvent.click((await screen.findAllByText(/Anza Bure Sasa/i, {}, { timeout: 15000 }))[0]);
  await screen.findByText('FOMU-YA-LOGIN', {}, { timeout: 15000 });
};

describe('App - login haimrudishi mtumiaji kwenye Login (redirect loop)', () => {
  it('Auth haitolewi na spinner wakati subscription inapakia baada ya SIGNED_IN', async () => {
    await goToLogin();
    fireEvent.click(screen.getByText('pitisha-nenosiri'));
    expect(screen.getByText('HATUA-YA-OTP')).toBeInTheDocument();

    // signInWithPassword imefanikiwa: Supabase inatuma SIGNED_IN, na subscription inaanza kupakia
    mockSubState.loading = true;
    await act(async () => { authCallback('SIGNED_IN', SESSION); });

    // Hatua ya OTP lazima ibaki; Auth isiwe imeunmount wala kuanza upya
    expect(screen.queryByText('Inapakia KasiTRADE...')).not.toBeInTheDocument();
    expect(screen.getByText('HATUA-YA-OTP')).toBeInTheDocument();
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
    expect(mockAuthMounts.count).toBe(1);
  });

  it('baada ya OTP kuthibitishwa mtumiaji huenda kwenye Dashboard', async () => {
    await goToLogin();
    fireEvent.click(screen.getByText('pitisha-nenosiri'));

    mockSubState.loading = true;
    await act(async () => { authCallback('SIGNED_IN', SESSION); });

    // Subscription imemaliza kupakia na ni halali
    Object.assign(mockSubState, { loading: false, canAccess: true, subscription: { status: 'active' }, daysRemaining: 20 });
    await act(async () => { fireEvent.click(screen.getByText('thibitisha-otp')); });

    expect(await screen.findAllByText('Dashibodi', {}, { timeout: 15000 })).toHaveLength(2);
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
  });

  it('refresh ya ukurasa ukiwa na session halali hupakia spinner kisha app (si Login)', async () => {
    supabase.auth.getSession.mockImplementation(async () => ({ data: { session: SESSION } }));
    Object.assign(mockSubState, { loading: false, canAccess: true, subscription: { status: 'active' }, daysRemaining: 20 });
    await act(async () => { render(<App />); });

    expect(await screen.findAllByText('Dashibodi', {}, { timeout: 15000 })).toHaveLength(2);
    expect(screen.queryByText('FOMU-YA-LOGIN')).not.toBeInTheDocument();
  });

  it('refresh ya ukurasa wakati OTP inasubiriwa hurudi Login (usalama haubadiliki)', async () => {
    localStorage.setItem('app_otpPending', 'true');
    supabase.auth.getSession.mockImplementation(async () => ({ data: { session: SESSION } }));
    await act(async () => { render(<App />); });

    expect(await screen.findByText('FOMU-YA-LOGIN', {}, { timeout: 15000 })).toBeInTheDocument();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
