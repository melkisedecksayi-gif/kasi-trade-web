/**
 * Majaribio ya "subscription gate" kwenye App:
 * - inakataa mfumo wote (fail-closed) ikiwa canAccess ni false
 * - inaonyesha loader wakati subscription bado inapakia
 * - inaruhusu mfumo ikiwa canAccess ni true
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import App from './App';
import { supabase } from './supabaseClient';

const chain = () => {
  const c = {
    select: () => c,
    eq: () => c,
    gte: () => c,
    lt: () => c,
    gt: () => c,
    in: () => c,
    not: () => c,
    insert: () => c,
    update: () => c,
    upsert: () => c,
    delete: () => c,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected),
  };
  return c;
};

let mockSession = null;

const mockSubState = {
  subscription: null,
  loading: false,
  error: null,
  canAccess: false,
  daysRemaining: 0,
  statusBadge: { bg: '#f1f5f9', color: '#64748b' },
  statusText: jest.fn(() => ''),
  activateSubscription: jest.fn(),
  startMobilePayment: jest.fn(),
  refresh: jest.fn(),
  MONTHLY_PRICE: 12000,
  TRIAL_DAYS: 14,
};

jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
      signInWithOtp: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('./hooks/useSubscription', () => ({
  useSubscription: () => mockSubState,
}));

jest.mock('./hooks/useKeyboard', () => () => {});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockSession = null;
  mockSubState.subscription = null;
  mockSubState.loading = false;
  mockSubState.error = null;
  mockSubState.canAccess = false;
  mockSubState.daysRemaining = 0;
  mockSubState.statusText = jest.fn(() => '');

  supabase.auth.getSession.mockImplementation(async () => ({
    data: { session: mockSession },
  }));
  supabase.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  supabase.auth.signOut.mockImplementation(async () => ({}));
  supabase.auth.signInWithOtp.mockImplementation(async () => ({ error: null }));
  supabase.from.mockImplementation(() => chain());
  supabase.rpc.mockImplementation(async () => ({ data: null, error: null }));
});

describe('App - subscription gate', () => {
  it('huonyesha landing page bila session', async () => {
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Anza Bure Sasa/i)).toBeInTheDocument();
    });
  });

  it('huonyesha loader wakati subscription bado inapakia', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.loading = true;

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Inapakia KasiTRADE...')).toBeInTheDocument();
    expect(screen.queryByText('Usajili wa Mfumo')).not.toBeInTheDocument();
  });

  it('hukataa mfumo wote na kuonyesha ukurasa wa subscription (fail-closed)', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.canAccess = false;
    mockSubState.subscription = { status: 'expired' };

    await act(async () => {
      render(<App />);
    });

    expect(await screen.findByText('Usajili wa Mfumo')).toBeInTheDocument();
    expect(screen.getByText('Imekwisha - Lipia Kuendelea')).toBeInTheDocument();
    // Hakuna sehemu za mfumo zinazoonyeshwa
    expect(screen.queryByText('Dashibodi')).not.toBeInTheDocument();
  });

  it('huonyesha ukurasa wa subscription kwa status ya majaribio', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.canAccess = false;
    mockSubState.subscription = { status: 'trial' };
    mockSubState.daysRemaining = 5;

    await act(async () => {
      render(<App />);
    });

    expect(await screen.findByText('Usajili wa Mfumo')).toBeInTheDocument();
    expect(screen.getByText('Majaribio - Siku 5 Zimebaki')).toBeInTheDocument();
  });

  it('huruhusu mfumo ikikiwa subscription ni halali (canAccess=true)', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.canAccess = true;
    mockSubState.subscription = { status: 'active' };
    mockSubState.daysRemaining = 20;

    await act(async () => {
      render(<App />);
    });

    (expect(await screen.findAllByText('Dashibodi')).toHaveLength(2));
    expect(screen.queryByText('Usajili wa Mfumo')).not.toBeInTheDocument();
  });

  it('huruhusu mfumo kwa status ya majaribio halali', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.canAccess = true;
    mockSubState.subscription = { status: 'trial' };
    mockSubState.daysRemaining = 10;

    await act(async () => {
      render(<App />);
    });

    (expect(await screen.findAllByText('Dashibodi')).toHaveLength(2));
  });

  it('hukataa mfumo hata ikiwa subscription ni null (canAccess=false)', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockSubState.canAccess = false;
    mockSubState.subscription = null;

    await act(async () => {
      render(<App />);
    });

    expect(await screen.findByText('Usajili wa Mfumo')).toBeInTheDocument();
    expect(screen.queryByText('Dashibodi')).not.toBeInTheDocument();
  });
});

