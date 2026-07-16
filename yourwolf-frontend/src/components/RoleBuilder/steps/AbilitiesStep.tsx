import {useState} from 'react';
import {RoleDraft, AbilityStepDraft, StepModifier} from '../../../types/role';
import {
  appendAbilityStep,
  removeStepAt,
  moveStepUp,
  moveStepDown,
  setStepModifier,
  setStepParameter,
} from '../../../domain/abilitySteps';
import {useAbilities} from '../../../hooks/useAbilities';
import {AbilityPalette} from './AbilityPalette';
import {StepList, ReadOnlyStepList} from './StepList';
import {theme} from '../../../styles/theme';

interface AbilitiesStepProps {
  draft: RoleDraft;
  onChange: (draft: RoleDraft) => void;
}

const bannerStyles: React.CSSProperties = {
  padding: theme.spacing.md,
  backgroundColor: theme.colors.surfaceLight,
  borderRadius: theme.borderRadius.sm,
  marginBottom: theme.spacing.md,
};

const headingStyles: React.CSSProperties = {
  color: theme.colors.text,
  marginBottom: theme.spacing.sm,
};

/**
 * Composes the ability palette and step list, and turns their intents into
 * `domain/abilitySteps` calls.
 *
 * Owns the draft mutations and the palette tab state; the children are presentational.
 */
export function AbilitiesStep({draft, onChange}: AbilitiesStepProps) {
  const {abilities, loading, error} = useAbilities();
  const [activeCategory, setActiveCategory] = useState<string>('card');

  const isDisabled = draft.wake_order === 0 || draft.wake_order === null;

  if (error) {
    return (
      <div
        style={{
          padding: theme.spacing.md,
          color: theme.colors.error,
        }}
      >
        Failed to load abilities: {error}
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div>
        <div style={{...bannerStyles, color: theme.colors.textMuted}}>
          This role does not wake up. Set a Wake Order ≥ 1 in Basic Info to add abilities.
        </div>
        {draft.ability_steps.length > 0 && (
          <div style={{...bannerStyles, color: theme.colors.error}}>
            This role has ability steps but is set to not wake up. These steps won't execute unless you set a Wake Order ≥ 1.
          </div>
        )}
        {draft.ability_steps.length > 0 && (
          <div style={{opacity: 0.5, pointerEvents: 'none'}}>
            <h4 style={headingStyles}>Ability Steps ({draft.ability_steps.length})</h4>
            <ReadOnlyStepList steps={draft.ability_steps} />
          </div>
        )}
      </div>
    );
  }

  function schemaFor(abilityType: string): Record<string, unknown> | undefined {
    return abilities.find((a) => a.type === abilityType)?.parameters_schema;
  }

  function updateSteps(steps: AbilityStepDraft[]) {
    onChange({...draft, ability_steps: steps});
  }

  function handleAddAbility(abilityType: string, abilityName: string) {
    updateSteps(
      appendAbilityStep(draft.ability_steps, {
        abilityType,
        abilityName,
        parametersSchema: schemaFor(abilityType),
      }),
    );
  }

  function handleRemoveStep(index: number) {
    updateSteps(removeStepAt(draft.ability_steps, index));
  }

  function handleMoveUp(index: number) {
    const steps = moveStepUp(draft.ability_steps, index);
    if (steps === draft.ability_steps) return; // already first — no-op, as before
    updateSteps(steps);
  }

  function handleMoveDown(index: number) {
    const steps = moveStepDown(draft.ability_steps, index);
    if (steps === draft.ability_steps) return; // already last — no-op, as before
    updateSteps(steps);
  }

  function handleModifierChange(index: number, modifier: StepModifier) {
    updateSteps(setStepModifier(draft.ability_steps, index, modifier));
  }

  function handleParameterChange(stepIndex: number, paramKey: string, value: unknown) {
    const step = draft.ability_steps[stepIndex];
    updateSteps(
      setStepParameter(
        draft.ability_steps,
        stepIndex,
        paramKey,
        value,
        schemaFor(step.ability_type),
      ),
    );
  }

  return (
    <div>
      <AbilityPalette
        abilities={abilities}
        loading={loading}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onSelectAbility={handleAddAbility}
      />

      <div>
        <h4 style={headingStyles}>Ability Steps ({draft.ability_steps.length})</h4>
        {draft.ability_steps.length === 0 ? (
          <p style={{color: theme.colors.textMuted, fontSize: '0.9rem'}}>
            Click an ability above to add it as a step
          </p>
        ) : (
          <StepList
            steps={draft.ability_steps}
            schemaFor={schemaFor}
            onModifierChange={handleModifierChange}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onRemove={handleRemoveStep}
            onParameterChange={handleParameterChange}
          />
        )}
      </div>
    </div>
  );
}
