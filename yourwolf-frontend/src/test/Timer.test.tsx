import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, act, fireEvent} from '@testing-library/react';
import {Timer} from '../components/Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays initial time correctly', () => {
    render(<Timer seconds={300} onComplete={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('5:00');
  });

  it('displays single-digit seconds with leading zero', () => {
    render(<Timer seconds={65} onComplete={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:05');
  });

  it('counts down each second', () => {
    render(<Timer seconds={10} onComplete={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:05');
  });

  it('calls onComplete when timer reaches zero', () => {
    const onComplete = vi.fn();
    render(<Timer seconds={3} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can be paused and resumed', () => {
    render(<Timer seconds={60} onComplete={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:55');

    // Pause
    fireEvent.click(screen.getByText('Pause'));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be 55 seconds
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:55');

    // Resume
    fireEvent.click(screen.getByText('Resume'));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:50');
  });

  it('calls onComplete when Skip to Voting is clicked', () => {
    const onComplete = vi.fn();
    render(<Timer seconds={300} onComplete={onComplete} />);

    fireEvent.click(screen.getByText('Skip to Voting'));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not auto-start when autoStart is false', () => {
    render(<Timer seconds={10} onComplete={vi.fn()} autoStart={false} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:10');
  });
});
