import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {createMockDraft} from './mocks';
import {ValidationResult} from '../types/role';

const mockOnChange = vi.fn();
const mockOnSave = vi.fn();

const mockValidation: ValidationResult = {
  is_valid: true,
  errors: [],
  warnings: [],
};

function renderWizard(draftOverrides: object = {}, validation: ValidationResult | null = mockValidation) {
  const draft = createMockDraft({...draftOverrides});
  return render(
    <Wizard
      draft={draft}
      validation={validation}
      onChange={mockOnChange}
      onSave={mockOnSave}
      saving={false}
    />,
  );
}

describe('Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('shows Basic Info step first', () => {
      renderWizard({name: 'Test Role'});
      expect(screen.getByText(/Basic Info/i)).toBeInTheDocument();
    });

    it('shows step indicator with all 4 steps', () => {
      renderWizard({name: 'Test Role'});
      expect(screen.getByText(/Basic Info/i)).toBeInTheDocument();
      expect(screen.getByText(/Abilities/i)).toBeInTheDocument();
      expect(screen.getByText(/Win Conditions/i)).toBeInTheDocument();
      expect(screen.getByText(/Review/i)).toBeInTheDocument();
    });

    it('Back button is disabled on step 1', () => {
      renderWizard({name: 'Test Role'});
      const backButton = screen.getByRole('button', {name: /back/i});
      expect(backButton).toBeDisabled();
    });
  });

  describe('Next button', () => {
    it('Next is disabled when name is empty', () => {
      renderWizard({name: ''});
      const nextButton = screen.getByRole('button', {name: /next/i});
      expect(nextButton).toBeDisabled();
    });

    it('Next is disabled when name is only whitespace', () => {
      renderWizard({name: '   '});
      const nextButton = screen.getByRole('button', {name: /next/i});
      expect(nextButton).toBeDisabled();
    });

    it('Next is enabled when name has at least 2 chars', () => {
      renderWizard({name: 'AB'});
      const nextButton = screen.getByRole('button', {name: /next/i});
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('navigation', () => {
    it('advances to Abilities step on Next', () => {
      renderWizard({name: 'Test Role'});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      // Step indicator should now show Abilities as active
      const stepButtons = screen.getAllByText(/Abilities/i);
      expect(stepButtons.length).toBeGreaterThan(0);
    });

    it('navigates through all 4 steps', () => {
      renderWizard({name: 'Test Role'});
      // Step 1 → 2
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      // Step 2 → 3
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      // Step 3 → 4 (Review)
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      // Should now see Create Role button
      expect(screen.getByRole('button', {name: /create role/i})).toBeInTheDocument();
    });

    it('Back navigation returns to previous step', () => {
      renderWizard({name: 'Test Role'});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /back/i}));
      // Back at step 1 — Back should be disabled again
      expect(screen.getByRole('button', {name: /back/i})).toBeDisabled();
    });

    it('shows Create Role button on review step instead of Next', () => {
      renderWizard({name: 'Test Role'});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.queryByRole('button', {name: /^next$/i})).not.toBeInTheDocument();
      expect(screen.getByRole('button', {name: /create role/i})).toBeInTheDocument();
    });

    it('clicking Create Role calls onSave', () => {
      renderWizard({name: 'Test Role'});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('clicking step indicator navigates to that step (for completed steps)', () => {
      renderWizard({name: 'Test Role'});
      // Advance to step 2
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      // Click on step 1 in indicator
      const step1Buttons = screen.getAllByText(/Basic Info/i);
      fireEvent.click(step1Buttons[0]);
      // Back button should be disabled (we're back at step 1)
      expect(screen.getByRole('button', {name: /back/i})).toBeDisabled();
    });
  });

  describe('saving state', () => {
    it('Create Role button is disabled while saving', () => {
      const draft = createMockDraft({name: 'Test Role'});
      render(
        <Wizard
          draft={draft}
          validation={mockValidation}
          onChange={mockOnChange}
          onSave={mockOnSave}
          saving={true}
        />,
      );
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByRole('button', {name: /saving|create role/i})).toBeDisabled();
    });
  });

  describe('submit validation', () => {
    it('Create Role button is disabled when validation is invalid', () => {
      const draft = createMockDraft({name: 'Test Role'});
      const invalidValidation: ValidationResult = {is_valid: false, errors: ['Name taken'], warnings: []};
      render(
        <Wizard
          draft={draft}
          validation={invalidValidation}
          onChange={mockOnChange}
          onSave={mockOnSave}
          saving={false}
        />,
      );
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByRole('button', {name: /create role/i})).toBeDisabled();
    });

    it('Create Role button is disabled when validation is null', () => {
      const draft = createMockDraft({name: 'Test Role'});
      render(
        <Wizard
          draft={draft}
          validation={null}
          onChange={mockOnChange}
          onSave={mockOnSave}
          saving={false}
        />,
      );
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByRole('button', {name: /create role/i})).toBeDisabled();
    });
  });
});
