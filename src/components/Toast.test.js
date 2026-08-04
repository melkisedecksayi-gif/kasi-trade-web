import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Toast from './Toast';

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Item saved successfully" />);
    expect(screen.getByText('Item saved successfully')).toBeInTheDocument();
  });

  it('renders with green background for success type', () => {
    render(<Toast message="Done" type="success" />);
    const toast = screen.getByText('Done');
    expect(toast).toHaveStyle({ background: '#10b981' });
  });

  it('renders with red background for error type', () => {
    render(<Toast message="Failed" type="error" />);
    const toast = screen.getByText('Failed');
    expect(toast).toHaveStyle({ background: '#ef4444' });
  });

  it('renders with yellow background for warning type', () => {
    render(<Toast message="Warning" type="warning" />);
    const toast = screen.getByText('Warning');
    expect(toast).toHaveStyle({ background: '#f59e0b' });
  });

  it('calls onClose after 3 seconds', () => {
    const onClose = jest.fn();
    render(<Toast message="Auto close" onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('defaults type to success when not provided', () => {
    render(<Toast message="Default" />);
    const toast = screen.getByText('Default');
    expect(toast).toHaveStyle({ background: '#10b981' });
  });
});
