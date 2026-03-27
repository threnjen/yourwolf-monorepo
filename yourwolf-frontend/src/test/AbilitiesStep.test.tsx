import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {AbilitiesStep} from '../components/RoleBuilder/steps/AbilitiesStep';
import {useAbilities} from '../hooks/useAbilities';
import {createMockDraft, createMockAbility} from './mocks';
import {AbilityStepDraft} from '../types/role';

vi.mock('../hooks/useAbilities', () => ({
  useAbilities: vi.fn(),
}));

const mockUseAbilities = useAbilities as ReturnType<typeof vi.fn>;

const mockAbilities = [
  createMockAbility({id: 'a1', type: 'view_card', name: 'View Card'}),
  createMockAbility({id: 'a2', type: 'swap_card', name: 'Swap Card'}),
  createMockAbility({id: 'a3', type: 'view_awake', name: 'View Awake'}),
];

describe('AbilitiesStep', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAbilities.mockReturnValue({
      abilities: mockAbilities,
      loading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('renders category tabs', () => {
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByRole('button', {name: /card actions/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /information/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /physical/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /state changes/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /other/i})).toBeInTheDocument();
    });

    it('shows ability in palette when category matches', () => {
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      // Card Actions category is active by default, should show view_card and swap_card
      expect(screen.getByText('View Card')).toBeInTheDocument();
      expect(screen.getByText('Swap Card')).toBeInTheDocument();
    });

    it('shows loading state while abilities fetch', () => {
      mockUseAbilities.mockReturnValue({abilities: [], loading: true, error: null});
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      expect(screen.getByText(/loading abilities/i)).toBeInTheDocument();
    });

    it('shows empty message when no abilities in category', () => {
      // Switch to Physical tab which has no abilities in mockAbilities
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', {name: /physical/i}));
      expect(screen.getByText(/no abilities/i)).toBeInTheDocument();
    });
  });

  describe('adding abilities', () => {
    it('clicking ability adds it to draft steps', () => {
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('View Card'));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: [
            expect.objectContaining({ability_type: 'view_card', ability_name: 'View Card', order: 1}),
          ],
        }),
      );
    });

    it('second added ability gets order 2', () => {
      const draftWithOne = createMockDraft({
        ability_steps: [
          {id: 'step-1', ability_type: 'view_card', ability_name: 'View Card', order: 1, modifier: 'none', is_required: false, parameters: {}},
        ],
      });
      render(<AbilitiesStep draft={draftWithOne} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('Swap Card'));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: expect.arrayContaining([
            expect.objectContaining({order: 2, ability_type: 'swap_card'}),
          ]),
        }),
      );
    });
  });

  describe('step list management', () => {
    const draftWithSteps = createMockDraft({
      ability_steps: [
        {id: 'step-1', ability_type: 'view_card', ability_name: 'View Card', order: 1, modifier: 'none', is_required: false, parameters: {}},
        {id: 'step-2', ability_type: 'swap_card', ability_name: 'Swap Card', order: 2, modifier: 'and', is_required: false, parameters: {}},
      ] as AbilityStepDraft[],
    });

    it('renders added steps', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      expect(screen.getByText(/1\. View Card/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Swap Card/)).toBeInTheDocument();
    });

    it('remove button removes a step', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      const removeButtons = screen.getAllByRole('button', {name: /remove/i});
      fireEvent.click(removeButtons[0]);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: [expect.objectContaining({ability_type: 'swap_card', order: 1})],
        }),
      );
    });

    it('move up button reorders steps', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      // upButtons[0] = step 1's up (disabled), upButtons[1] = step 2's up
      const upButtons = screen.getAllByRole('button', {name: /move up|↑/i});
      fireEvent.click(upButtons[1]); // Move step 2 up
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: [
            expect.objectContaining({ability_type: 'swap_card', order: 1}),
            expect.objectContaining({ability_type: 'view_card', order: 2}),
          ],
        }),
      );
    });

    it('first step modifier is always none', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      // First step select should be disabled or show 'none'
      const modifierSelects = screen.getAllByRole('combobox');
      // First modifier should be locked (disabled)
      expect(modifierSelects[0]).toBeDisabled();
    });
  });

  describe('category switching', () => {
    it('shows information abilities when Information tab clicked', () => {
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', {name: /information/i}));
      expect(screen.getByText('View Awake')).toBeInTheDocument();
    });
  });
});
