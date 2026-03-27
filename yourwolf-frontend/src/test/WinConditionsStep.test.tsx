import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {WinConditionsStep} from '../components/RoleBuilder/steps/WinConditionsStep';
import {createMockDraft} from './mocks';
import {WinConditionDraft} from '../types/role';

describe('WinConditionsStep', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Add Condition button', () => {
      render(<WinConditionsStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByRole('button', {name: /add condition/i})).toBeInTheDocument();
    });

    it('shows empty state when no win conditions', () => {
      render(<WinConditionsStep draft={createMockDraft({win_conditions: []})} onChange={mockOnChange} />);
      expect(screen.getByText(/no win conditions/i)).toBeInTheDocument();
    });

    it('renders existing win conditions', () => {
      const draft = createMockDraft({
        win_conditions: [
          {id: 'wc-1', condition_type: 'team_wins', is_primary: true, overrides_team: false},
        ] as WinConditionDraft[],
      });
      render(<WinConditionsStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });
  });

  describe('adding conditions', () => {
    it('clicking Add Condition increases the list', () => {
      render(<WinConditionsStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', {name: /add condition/i}));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          win_conditions: [
            expect.objectContaining({condition_type: 'team_wins', is_primary: false, overrides_team: false}),
          ],
        }),
      );
    });
  });

  describe('removing conditions', () => {
    it('remove button removes the condition', () => {
      const draft = createMockDraft({
        win_conditions: [
          {id: 'wc-1', condition_type: 'team_wins', is_primary: true, overrides_team: false},
          {id: 'wc-2', condition_type: 'most_votes', is_primary: false, overrides_team: false},
        ] as WinConditionDraft[],
      });
      render(<WinConditionsStep draft={draft} onChange={mockOnChange} />);
      const removeButtons = screen.getAllByRole('button', {name: /remove/i});
      fireEvent.click(removeButtons[0]);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          win_conditions: [expect.objectContaining({condition_type: 'most_votes'})],
        }),
      );
    });
  });

  describe('primary toggle', () => {
    it('setting primary on one unsets others', () => {
      const draft = createMockDraft({
        win_conditions: [
          {id: 'wc-1', condition_type: 'team_wins', is_primary: true, overrides_team: false},
          {id: 'wc-2', condition_type: 'most_votes', is_primary: false, overrides_team: false},
        ] as WinConditionDraft[],
      });
      render(<WinConditionsStep draft={draft} onChange={mockOnChange} />);
      const primaryCheckboxes = screen.getAllByRole('checkbox', {name: /primary/i});
      fireEvent.click(primaryCheckboxes[1]); // Set second as primary
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          win_conditions: [
            expect.objectContaining({is_primary: false}),
            expect.objectContaining({is_primary: true}),
          ],
        }),
      );
    });
  });

  describe('condition type dropdown', () => {
    it('changing condition type calls onChange', () => {
      const draft = createMockDraft({
        win_conditions: [
          {id: 'wc-1', condition_type: 'team_wins', is_primary: false, overrides_team: false},
        ] as WinConditionDraft[],
      });
      render(<WinConditionsStep draft={draft} onChange={mockOnChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, {target: {value: 'most_votes'}});
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          win_conditions: [expect.objectContaining({condition_type: 'most_votes'})],
        }),
      );
    });
  });
});
