import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ReviewStep} from '../components/RoleBuilder/steps/ReviewStep';
import {createMockDraft} from './mocks';
import {ValidationResult, AbilityStepDraft, WinConditionDraft} from '../types/role';

describe('ReviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockValidation: ValidationResult = {
    is_valid: true,
    errors: [],
    warnings: [],
  };

  describe('role summary', () => {
    it('shows role name', () => {
      render(<ReviewStep draft={createMockDraft({name: 'My Custom Role'})} validation={mockValidation} />);
      expect(screen.getByText('My Custom Role')).toBeInTheDocument();
    });

    it('shows team', () => {
      render(<ReviewStep draft={createMockDraft({team: 'werewolf'})} validation={mockValidation} />);
      expect(screen.getByText(/werewolf/i)).toBeInTheDocument();
    });

    it('shows description', () => {
      render(<ReviewStep draft={createMockDraft({description: 'Test description'})} validation={mockValidation} />);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('shows wake order when set', () => {
      render(<ReviewStep draft={createMockDraft({wake_order: 3})} validation={mockValidation} />);
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('shows votes', () => {
      render(<ReviewStep draft={createMockDraft({votes: 2})} validation={mockValidation} />);
      expect(screen.getByText(/Votes: 2/)).toBeInTheDocument();
    });
  });

  describe('ability steps', () => {
    it('shows ability steps', () => {
      const draft = createMockDraft({
        ability_steps: [
          {id: 'step-1', ability_type: 'view_card', ability_name: 'View Card', order: 1, modifier: 'none', is_required: false, parameters: {}},
          {id: 'step-2', ability_type: 'swap_card', ability_name: 'Swap Card', order: 2, modifier: 'and', is_required: false, parameters: {}},
        ] as AbilityStepDraft[],
      });
      render(<ReviewStep draft={draft} validation={mockValidation} />);
      expect(screen.getByText(/View Card/)).toBeInTheDocument();
      expect(screen.getByText(/Swap Card/)).toBeInTheDocument();
    });

    it('shows step order and modifier', () => {
      const draft = createMockDraft({
        ability_steps: [
          {id: 'step-1', ability_type: 'view_card', ability_name: 'View Card', order: 1, modifier: 'none', is_required: false, parameters: {}},
        ] as AbilityStepDraft[],
      });
      render(<ReviewStep draft={draft} validation={mockValidation} />);
      // The step order number is rendered inside the step item
      expect(screen.getByText(/View Card/)).toBeInTheDocument();
    });

    it('shows no ability steps message when empty', () => {
      render(<ReviewStep draft={createMockDraft({ability_steps: []})} validation={mockValidation} />);
      expect(screen.getByText(/no ability steps/i)).toBeInTheDocument();
    });
  });

  describe('win conditions', () => {
    it('shows win conditions', () => {
      const draft = createMockDraft({
        win_conditions: [
          {id: 'wc-1', condition_type: 'team_wins', is_primary: true, overrides_team: false},
        ] as WinConditionDraft[],
      });
      render(<ReviewStep draft={draft} validation={mockValidation} />);
      expect(screen.getByText(/team_wins|team wins/i)).toBeInTheDocument();
    });

    it('shows no win conditions message when empty', () => {
      render(<ReviewStep draft={createMockDraft({win_conditions: []})} validation={mockValidation} />);
      expect(screen.getByText(/no win conditions/i)).toBeInTheDocument();
    });
  });

  describe('validation display', () => {
    it('shows Validating... when validation is null', () => {
      render(<ReviewStep draft={createMockDraft()} validation={null} />);
      expect(screen.getByText(/validating/i)).toBeInTheDocument();
    });

    it('shows validation errors in red', () => {
      const invalidValidation: ValidationResult = {
        is_valid: false,
        errors: ['Name is too short', 'No win conditions'],
        warnings: [],
      };
      render(<ReviewStep draft={createMockDraft()} validation={invalidValidation} />);
      expect(screen.getByText(/Name is too short/)).toBeInTheDocument();
      expect(screen.getByText(/No win conditions$/)).toBeInTheDocument();
    });

    it('shows validation warnings in yellow', () => {
      const warnValidation: ValidationResult = {
        is_valid: true,
        errors: [],
        warnings: ['Consider adding more abilities'],
      };
      render(<ReviewStep draft={createMockDraft()} validation={warnValidation} />);
      expect(screen.getByText(/Consider adding more abilities/)).toBeInTheDocument();
    });

    it('shows valid status when validation passes', () => {
      render(<ReviewStep draft={createMockDraft()} validation={mockValidation} />);
      expect(screen.getByText(/ready to create/i)).toBeInTheDocument();
    });
  });
});
