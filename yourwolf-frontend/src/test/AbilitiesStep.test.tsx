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

    it('adding ability with integer params initializes defaults', () => {
      const viewCardSchema = {
        type: 'object',
        properties: {
          target: {type: 'string', description: 'Target card location'},
          count: {type: 'integer', default: 1, description: 'Number of cards'},
        },
        required: ['target'],
      };
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'view_card', name: 'View Card', parameters_schema: viewCardSchema})],
        loading: false,
        error: null,
      });
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByText('View Card'));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: [
            expect.objectContaining({ability_type: 'view_card', parameters: {count: 1}}),
          ],
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

    it('first step hides modifier dropdown', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      // First step should NOT have a modifier dropdown at all
      const modifierSelects = screen.getAllByRole('combobox');
      // Only the second step should have a modifier select
      expect(modifierSelects).toHaveLength(1);
    });

    it('subsequent steps show Then: label', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      expect(screen.getByText('Then:')).toBeInTheDocument();
    });

    it('modifier options show descriptive text', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      expect(screen.getByRole('option', {name: 'And then'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'Or instead'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'Only if'})).toBeInTheDocument();
    });

    it('modifier change still sends raw values', () => {
      render(<AbilitiesStep draft={draftWithSteps} onChange={mockOnChange} />);
      const modifierSelect = screen.getByRole('combobox');
      fireEvent.change(modifierSelect, {target: {value: 'or'}});
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: expect.arrayContaining([
            expect.objectContaining({modifier: 'or'}),
          ]),
        }),
      );
    });
  });

  describe('category switching', () => {
    it('shows information abilities when Information tab clicked', () => {
      render(<AbilitiesStep draft={createMockDraft()} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', {name: /information/i}));
      expect(screen.getByText('View Awake')).toBeInTheDocument();
    });
  });

  describe('parameter inputs', () => {
    const viewCardSchema = {
      type: 'object',
      properties: {
        target: {type: 'string', description: 'Target card location'},
        count: {type: 'integer', default: 1, description: 'Number of cards'},
      },
      required: ['target'],
    };

    const changeToTeamSchema = {
      type: 'object',
      properties: {
        team: {type: 'string', enum: ['village', 'werewolf', 'vampire', 'alien', 'neutral']},
      },
      required: ['team'],
    };

    const stopSchema = {
      type: 'object',
      properties: {},
    };

    const randomNumPlayersSchema = {
      type: 'object',
      properties: {
        options: {type: 'array', items: {type: 'integer'}},
      },
      required: ['options'],
    };

    it('test_renders_parameter_inputs_when_schema_has_properties', () => {
      // AC1: step with viewCard schema renders at least one input element
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'view_card', name: 'View Card', parameters_schema: viewCardSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'view_card', ability_name: 'View Card',
          order: 1, modifier: 'none', is_required: false, parameters: {count: 1},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
    });

    it('test_enum_string_renders_select_with_enum_options', () => {
      // AC2: change_to_team step renders select with enum values
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'change_to_team', name: 'Change To Team', parameters_schema: changeToTeamSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'change_to_team', ability_name: 'Change To Team',
          order: 1, modifier: 'none', is_required: false, parameters: {},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getByRole('option', {name: 'village'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'werewolf'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'vampire'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'alien'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'neutral'})).toBeInTheDocument();
    });

    it('test_free_string_renders_select_with_target_options', () => {
      // AC3: view_card step renders select for target with STRING_TARGET_OPTIONS
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'view_card', name: 'View Card', parameters_schema: viewCardSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'view_card', ability_name: 'View Card',
          order: 1, modifier: 'none', is_required: false, parameters: {count: 1},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getByRole('option', {name: 'player.self'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'player.other'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'center.main'})).toBeInTheDocument();
    });

    it('test_integer_renders_number_input_with_default_1', () => {
      // AC4: view_card step renders number input for count with value 1
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'view_card', name: 'View Card', parameters_schema: viewCardSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'view_card', ability_name: 'View Card',
          order: 1, modifier: 'none', is_required: false, parameters: {count: 1},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      const numberInput = screen.getByRole('spinbutton');
      expect(numberInput).toHaveValue(1);
    });

    it('test_array_renders_comma_separated_input', () => {
      // AC5: random_num_players step renders text input for options
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'random_num_players', name: 'Random Num Players', parameters_schema: randomNumPlayersSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'random_num_players', ability_name: 'Random Num Players',
          order: 1, modifier: 'none', is_required: false, parameters: {},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('test_changing_param_calls_onChange_with_updated_parameters', () => {
      // AC6: selecting werewolf in team dropdown fires onChange with correct parameters
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'change_to_team', name: 'Change To Team', parameters_schema: changeToTeamSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'change_to_team', ability_name: 'Change To Team',
          order: 1, modifier: 'none', is_required: false, parameters: {},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      const teamSelect = screen.getByRole('combobox', {name: /team \*/i});
      fireEvent.change(teamSelect, {target: {value: 'werewolf'}});
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ability_steps: [
            expect.objectContaining({parameters: {team: 'werewolf'}}),
          ],
        }),
      );
    });

    it('test_no_inputs_rendered_for_empty_schema', () => {
      // AC7: stop step renders no parameter inputs
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'stop', name: 'Stop', parameters_schema: stopSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'stop', ability_name: 'Stop',
          order: 1, modifier: 'none', is_required: false, parameters: {},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      // First step has no modifier select, so no comboboxes at all
      expect(screen.queryAllByRole('combobox')).toHaveLength(0);
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('test_required_param_has_asterisk_label', () => {
      // AC8: required params labelled with *, optional with (optional)
      mockUseAbilities.mockReturnValue({
        abilities: [createMockAbility({id: 'a1', type: 'view_card', name: 'View Card', parameters_schema: viewCardSchema})],
        loading: false,
        error: null,
      });
      const draft = createMockDraft({
        ability_steps: [{
          id: 'step-1', ability_type: 'view_card', ability_name: 'View Card',
          order: 1, modifier: 'none', is_required: false, parameters: {count: 1},
        }] as AbilityStepDraft[],
      });
      render(<AbilitiesStep draft={draft} onChange={mockOnChange} />);
      expect(screen.getByText(/target \*/i)).toBeInTheDocument();
      expect(screen.getByText(/count \(optional\)/i)).toBeInTheDocument();
    });
  });
});
