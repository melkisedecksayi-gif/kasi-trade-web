import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useSubscription', () => ({
  useSubscription: () => ({
    subscription: null,
    loading: false,
    daysRemaining: 0,
    statusBadge: { bg: '#f1f5f9', color: '#64748b' },
    activateSubscription: jest.fn(),
    refresh: jest.fn(),
    MONTHLY_PRICE: 12000,
  }),
}));

jest.mock('./hooks/useKeyboard', () => () => {});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('App', () => {
  it('renders the landing page when not authenticated', async () => {
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Anza Bure Sasa/i)).toBeInTheDocument();
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/KasiTRADE/i)).toBeInTheDocument();
  });
});
