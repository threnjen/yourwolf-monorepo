import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ScriptReader} from '../components/ScriptReader';
import {createMockNightScript} from './mocks';
import type {NightScript} from '../types/game';

const mockScript: NightScript = createMockNightScript({
  actions: [
    {
      order: 1,
      role_name: 'Narrator',
      instruction: 'Everyone, close your eyes.',
      duration_seconds: 5,
      requires_player_action: false,
    },
    {
      order: 2,
      role_name: 'Werewolf',
      instruction: 'Werewolf, wake up and look for other werewolves.',
      duration_seconds: 10,
      requires_player_action: true,
    },
    {
      order: 3,
      role_name: 'Narrator',
      instruction: 'Everyone, open your eyes. Discussion begins now.',
      duration_seconds: 5,
      requires_player_action: false,
    },
  ],
  total_duration_seconds: 20,
});

describe('ScriptReader', () => {
  it('shows first action initially', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);
    expect(
      screen.getByText('Everyone, close your eyes.'),
    ).toBeInTheDocument();
  });

  it('shows role name for current action', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);
    const roleLabels = screen.getAllByText('Narrator');
    expect(roleLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('advances to next action on Next click', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText('Next →'));

    expect(
      screen.getByText(
        'Werewolf, wake up and look for other werewolves.',
      ),
    ).toBeInTheDocument();
  });

  it('goes back on Previous click', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('← Previous'));

    expect(
      screen.getByText('Everyone, close your eyes.'),
    ).toBeInTheDocument();
  });

  it('disables Previous button on first action', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    const prevButton = screen.getByText('← Previous');
    expect(prevButton).toBeDisabled();
  });

  it('shows Start Discussion on last action', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('Start Discussion')).toBeInTheDocument();
  });

  it('calls onComplete on last action click', () => {
    const onComplete = vi.fn();
    render(<ScriptReader script={mockScript} onComplete={onComplete} />);

    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('Next →'));
    fireEvent.click(screen.getByText('Start Discussion'));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows progress indicator', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('updates progress indicator on navigation', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('shows upcoming roles in preview', () => {
    render(<ScriptReader script={mockScript} onComplete={vi.fn()} />);

    // On first action, coming up should show Werewolf and Narrator
    expect(screen.getByText('Werewolf')).toBeInTheDocument();
  });
});
