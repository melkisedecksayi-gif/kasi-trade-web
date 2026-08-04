import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

beforeEach(() => {
  jest.clearAllMocks();
});

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('test error');
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('catches error and shows fallback UI', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Sorry, an error occurred/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows swahili fallback when lang=sw', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary lang="sw">
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Hitilafu Imetokea/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows custom fallback via prop', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={({ error, retry }) => (
        <div>
          <span>Custom error: {error.message}</span>
          <button onClick={retry}>Retry</button>
        </div>
      )}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Custom error: test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('calls onError prop when an error is caught', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('renders Reload Page button', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Reload Page/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
