import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {StepList, ReadOnlyStepList} from '../components/RoleBuilder/steps/StepList';
import {AbilityStepDraft} from '../domain/roleDraft';

/**
 * Unit tests for the ability step list, exercised in isolation.
 *
 * The list is presentational: it reports index-based intents and leaves every rule
 * (renumbering, modifier normalization, coercion) to the container's domain calls.
 */
describe('StepList', () => {
  const onModifierChange = vi.fn();
  const onMoveUp = vi.fn();
  const onMoveDown = vi.fn();
  const onRemove = vi.fn();
  const onParameterChange = vi.fn();

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
  });

  function renderList(overrides: Partial<React.ComponentProps<typeof StepList>> = {}) {
    return render(
      <StepList
        steps={steps}
        schemaFor={() => undefined}
        onModifierChange={onModifierChange}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
        onParameterChange={onParameterChange}
        {...overrides}
      />,
    );
  }

  describe('rendering', () => {
    it('renders each step with its order and ability name', () => {
      renderList();
      expect(screen.getByText(/1\. View Card/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Swap Card/)).toBeInTheDocument();
    });

    it('renders nothing for an empty step list', () => {
      const {container} = renderList({steps: []});
      expect(container.querySelectorAll('button')).toHaveLength(0);
    });
  });

  describe('modifier control', () => {
    it('hides the modifier dropdown on the first step', () => {
      renderList();
      expect(screen.getAllByRole('combobox')).toHaveLength(1);
    });

    it('shows the Then: label on subsequent steps', () => {
      renderList();
      expect(screen.getByText('Then:')).toBeInTheDocument();
    });

    it('offers every modifier except none, with descriptive labels', () => {
      renderList();
      expect(screen.getByRole('option', {name: 'And then'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'Or instead'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'Only if'})).toBeInTheDocument();
      expect(screen.queryByRole('option', {name: '—'})).not.toBeInTheDocument();
    });

    it('reflects the step modifier as the select value', () => {
      renderList();
      expect(screen.getByRole('combobox', {name: /step modifier/i})).toHaveValue('and');
    });

    it('reports the step index and raw modifier value on change', () => {
      renderList();
      fireEvent.change(screen.getByRole('combobox', {name: /step modifier/i}), {
        target: {value: 'or'},
      });
      expect(onModifierChange).toHaveBeenCalledWith(1, 'or');
    });
  });

  describe('reordering and removal', () => {
    it('disables move up on the first step', () => {
      renderList();
      expect(screen.getAllByRole('button', {name: /move up/i})[0]).toBeDisabled();
    });

    it('disables move down on the last step', () => {
      renderList();
      const downButtons = screen.getAllByRole('button', {name: /move down/i});
      expect(downButtons[downButtons.length - 1]).toBeDisabled();
    });

    it('reports the index on move up', () => {
      renderList();
      fireEvent.click(screen.getAllByRole('button', {name: /move up/i})[1]);
      expect(onMoveUp).toHaveBeenCalledWith(1);
    });

    it('reports the index on move down', () => {
      renderList();
      fireEvent.click(screen.getAllByRole('button', {name: /move down/i})[0]);
      expect(onMoveDown).toHaveBeenCalledWith(0);
    });

    it('reports the index on remove', () => {
      renderList();
      fireEvent.click(screen.getAllByRole('button', {name: /remove/i})[0]);
      expect(onRemove).toHaveBeenCalledWith(0);
    });
  });

  describe('parameter inputs', () => {
    const viewCardSchema = {
      type: 'object',
      properties: {count: {type: 'integer', default: 1}},
    };

    it('renders parameter inputs using the schema resolved for the step ability type', () => {
      renderList({
        steps: [steps[0]],
        schemaFor: (abilityType: string) =>
          abilityType === 'view_card' ? viewCardSchema : undefined,
      });
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('renders no parameter inputs when the schema cannot be resolved', () => {
      renderList({steps: [steps[0]]});
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('reports the step index, key and raw value on parameter change', () => {
      renderList({
        steps: [steps[0]],
        schemaFor: () => viewCardSchema,
      });
      fireEvent.change(screen.getByRole('spinbutton'), {target: {value: '5'}});
      expect(onParameterChange).toHaveBeenCalledWith(0, 'count', '5');
    });
  });
});

describe('ReadOnlyStepList', () => {
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

  it('lists each step with its order and ability name', () => {
    render(<ReadOnlyStepList steps={steps} />);
    expect(screen.getByText(/1\. View Card/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Swap Card/)).toBeInTheDocument();
  });

  it('renders no interactive controls', () => {
    render(<ReadOnlyStepList steps={steps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
