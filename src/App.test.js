import { render, screen } from '@testing-library/react';
import ErrorBoundary from './components/ErrorBoundary';

const Bomb = () => {
  throw new Error('boom');
};

test('renders fallback UI when child throws', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );
  expect(screen.getByText(/Hitilafu imetokea/i)).toBeInTheDocument();
  expect(screen.getByText(/Reload Page/i)).toBeInTheDocument();
  spy.mockRestore();
});

test('renders children when no error', () => {
  render(
    <ErrorBoundary>
      <div>Hello Duka</div>
    </ErrorBoundary>
  );
  expect(screen.getByText('Hello Duka')).toBeInTheDocument();
});
