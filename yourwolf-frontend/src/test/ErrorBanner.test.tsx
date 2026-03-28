import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ErrorBanner} from '../components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders the error message', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<ErrorBanner message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />);
    
    const dismissBtn = screen.getByLabelText('Dismiss error');
    expect(dismissBtn).toBeInTheDocument();
    
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner message="Error" />);
    expect(screen.queryByLabelText('Dismiss error')).not.toBeInTheDocument();
  });

  it('renders help text when provided', () => {
    render(<ErrorBanner message="Error" helpText="Try again later" />);
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });
});
