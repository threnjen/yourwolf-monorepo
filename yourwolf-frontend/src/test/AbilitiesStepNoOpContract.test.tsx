import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render} from '@testing-library/react';
import {AbilitiesStep} from '../components/RoleBuilder/steps/AbilitiesStep';
import {useAbilities} from '../hooks/useAbilities';
import {createMockDraft, createMockAbility} from './mocks';
import type {StepListProps} from '../components/RoleBuilder/steps/StepList';
import {AbilityStepDraft} from '../domain/roleDraft';

vi.mock('../hooks/useAbilities', () => ({
  useAbilities: vi.fn(),
}));

/**
 * Captures the props the container hands to StepList so the no-op intents can be
 * invoked directly. The real list disables the move buttons at the ends, so the
 * container's own guard is unreachable through the DOM — but it is the thing that
 * actually enforces the contract, so it is exercised here at the seam.
 */
let capturedProps: StepListProps | null = null;

vi.mock('../components/RoleBuilder/steps/StepList', () => ({
  StepList: (props: StepListProps) => {
    capturedProps = props;
    return <div data-testid="step-list-stub" />;
  },
  ReadOnlyStepList: () => <div data-testid="readonly-step-list-stub" />,
}));

const mockUseAbilities = useAbilities as ReturnType<typeof vi.fn>;

/**
 * The container relies on `domain/abilitySteps` signalling a no-op by returning the
 * *same array reference*, and skips `onChange` when it sees one. That contract is
 * invisible to type checking and easy to break during refactors (a stray `useMemo`,
 * a spread, or a dropped identity check would all silently start firing spurious
 * `onChange` calls and dirty the draft).
 */
describe('AbilitiesStep no-op reference-identity contract', () => {
  const onChange = vi.fn();

  const steps: AbilityStepDraft[] = [
    {
      id: 'step-1', ability_type: 'view_card', ability_name: 'View Card',
      order: 1, modifier: 'none', is_required: false, parameters: {},
    },
    {
      id: 'step-2', ability_type: 'swap_card', ability_name: 'Swap Card',
      order: 2, modifier: 'and', is_required: false, parameters: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = null;
    mockUseAbilities.mockReturnValue({
      abilities: [
        createMockAbility({id: 'a1', type: 'view_card', name: 'View Card'}),
        createMockAbility({id: 'a2', type: 'swap_card', name: 'Swap Card'}),
      ],
      loading: false,
      error: null,
    });
  });

  function renderStep() {
    render(
      <AbilitiesStep
        draft={createMockDraft({wake_order: 3, ability_steps: steps})}
        onChange={onChange}
      />,
    );
    if (!capturedProps) throw new Error('StepList was not rendered');
    return capturedProps;
  }

  it('does not fire onChange when moving the first step up', () => {
    const props = renderStep();
    props.onMoveUp(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not fire onChange when moving the last step down', () => {
    const props = renderStep();
    props.onMoveDown(steps.length - 1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('still fires onChange for a move that does reorder', () => {
    const props = renderStep();
    props.onMoveUp(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        ability_steps: [
          expect.objectContaining({ability_name: 'Swap Card', order: 1}),
          expect.objectContaining({ability_name: 'View Card', order: 2}),
        ],
      }),
    );
  });

  it('still fires onChange for a move down that does reorder', () => {
    const props = renderStep();
    props.onMoveDown(0);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        ability_steps: [
          expect.objectContaining({ability_name: 'Swap Card', order: 1}),
          expect.objectContaining({ability_name: 'View Card', order: 2}),
        ],
      }),
    );
  });
});
