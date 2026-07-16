import {AbilityStepDraft, StepModifier} from '../../../domain/roleDraft';
import {MODIFIERS, MODIFIER_LABELS} from '../../../domain/constants';
import {theme} from '../../../styles/theme';
import {selectStyles} from '../../../styles/shared';
import {StepParameterInputs} from './StepParameterInputs';

const stepListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.sm,
};

const stepItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: theme.spacing.sm,
  backgroundColor: theme.colors.surfaceLight,
  borderRadius: theme.borderRadius.sm,
  flexWrap: 'wrap',
};

const stepNameStyles: React.CSSProperties = {
  flex: 1,
  color: theme.colors.text,
  fontSize: '0.9rem',
};

const iconButtonStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.secondary}`,
  backgroundColor: 'transparent',
  color: theme.colors.textMuted,
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const removeButtonStyles: React.CSSProperties = {
  ...iconButtonStyles,
  color: theme.colors.error,
  borderColor: theme.colors.error,
};

const modifierLabelStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.75rem',
  fontWeight: 600,
};

export interface StepListProps {
  steps: AbilityStepDraft[];
  /** Resolves the parameter schema for an ability type, so the list needs no ability list. */
  schemaFor: (abilityType: string) => Record<string, unknown> | undefined;
  onModifierChange: (index: number, modifier: StepModifier) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  /** Reports a raw, uncoerced parameter value; the container applies the domain rules. */
  onParameterChange: (index: number, key: string, value: unknown) => void;
}

/**
 * The editable list of ability steps: order, chaining modifier, reorder/remove
 * controls, and each step's parameter form.
 *
 * Presentational — every callback reports an index-based intent and the container
 * turns it into a `domain/abilitySteps` call.
 */
export function StepList({
  steps,
  schemaFor,
  onModifierChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onParameterChange,
}: StepListProps) {
  return (
    <div style={stepListStyles}>
      {steps.map((step, index) => (
        <div key={step.id} style={stepItemStyles}>
          <span style={stepNameStyles}>
            {step.order}. {step.ability_name}
          </span>

          {index > 0 && (
            <>
              <span style={modifierLabelStyles}>Then:</span>
              <select
                aria-label="Step modifier"
                style={selectStyles}
                value={step.modifier}
                onChange={(e) => onModifierChange(index, e.target.value as StepModifier)}
              >
                {MODIFIERS.filter((m) => m !== 'none').map((m) => (
                  <option key={m} value={m}>{MODIFIER_LABELS[m]}</option>
                ))}
              </select>
            </>
          )}

          <button
            style={iconButtonStyles}
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            style={iconButtonStyles}
            onClick={() => onMoveDown(index)}
            disabled={index === steps.length - 1}
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            style={removeButtonStyles}
            onClick={() => onRemove(index)}
            aria-label="Remove"
          >
            Remove
          </button>
          <StepParameterInputs
            stepIndex={index}
            schema={schemaFor(step.ability_type) ?? {}}
            values={step.parameters}
            onChange={(key, val) => onParameterChange(index, key, val)}
          />
        </div>
      ))}
    </div>
  );
}

export interface ReadOnlyStepListProps {
  steps: AbilityStepDraft[];
}

/**
 * Name-only rendering of the steps, used when the role does not wake up and the
 * list is shown for reference rather than editing.
 */
export function ReadOnlyStepList({steps}: ReadOnlyStepListProps) {
  return (
    <div style={stepListStyles}>
      {steps.map((step) => (
        <div key={step.id} style={stepItemStyles}>
          <span style={stepNameStyles}>
            {step.order}. {step.ability_name}
          </span>
        </div>
      ))}
    </div>
  );
}
