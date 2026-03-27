import {useState} from 'react';
import {RoleDraft, AbilityStepDraft, StepModifier} from '../../../types/role';
import {useAbilities} from '../../../hooks/useAbilities';
import {theme} from '../../../styles/theme';

interface AbilitiesStepProps {
  draft: RoleDraft;
  onChange: (draft: RoleDraft) => void;
}

interface AbilityCategory {
  id: string;
  label: string;
  types: string[];
}

const ABILITY_CATEGORIES: AbilityCategory[] = [
  {id: 'card', label: 'Card Actions', types: ['view_card', 'swap_card', 'take_card', 'flip_card', 'copy_role']},
  {id: 'info', label: 'Information', types: ['view_awake', 'thumbs_up', 'explicit_no_view']},
  {id: 'physical', label: 'Physical', types: ['rotate_all', 'touch']},
  {id: 'state', label: 'State Changes', types: ['change_to_team', 'perform_as', 'perform_immediately', 'stop']},
  {id: 'other', label: 'Other', types: ['random_num_players']},
];

const MODIFIERS: StepModifier[] = ['none', 'and', 'or', 'if'];

const tabRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.xs,
  marginBottom: theme.spacing.md,
  borderBottom: `1px solid ${theme.colors.secondary}`,
  paddingBottom: theme.spacing.sm,
};

const paletteStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
};

const paletteGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
};

const abilityButtonStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.primaryLight}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  cursor: 'pointer',
  fontSize: '0.85rem',
};

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

const selectStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.secondary}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  fontSize: '0.85rem',
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

function getTabStyles(isActive: boolean): React.CSSProperties {
  return {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    border: 'none',
    borderBottom: isActive ? `2px solid ${theme.colors.primaryLight}` : '2px solid transparent',
    backgroundColor: 'transparent',
    color: isActive ? theme.colors.text : theme.colors.textMuted,
    cursor: 'pointer',
    fontWeight: isActive ? 600 : 400,
    fontSize: '0.85rem',
  };
}

export function AbilitiesStep({draft, onChange}: AbilitiesStepProps) {
  const {abilities, loading, error} = useAbilities();
  const [activeCategory, setActiveCategory] = useState<string>('card');

  const activeTypes = ABILITY_CATEGORIES.find((c) => c.id === activeCategory)?.types ?? [];
  const paletteAbilities = abilities.filter((a) => activeTypes.includes(a.type));

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

  function handleAddAbility(abilityType: string, abilityName: string) {
    const nextOrder = draft.ability_steps.length + 1;
    const newStep: AbilityStepDraft = {
      id: crypto.randomUUID(),
      ability_type: abilityType,
      ability_name: abilityName,
      order: nextOrder,
      modifier: nextOrder === 1 ? 'none' : 'and',
      is_required: false,
      parameters: {},
    };
    onChange({...draft, ability_steps: [...draft.ability_steps, newStep]});
  }

  function handleRemoveStep(index: number) {
    const updated = draft.ability_steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : step.modifier}));
    onChange({...draft, ability_steps: updated});
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const steps = [...draft.ability_steps];
    [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
    const renumbered = steps.map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : step.modifier}));
    onChange({...draft, ability_steps: renumbered});
  }

  function handleMoveDown(index: number) {
    if (index === draft.ability_steps.length - 1) return;
    const steps = [...draft.ability_steps];
    [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    const renumbered = steps.map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : step.modifier}));
    onChange({...draft, ability_steps: renumbered});
  }

  function handleModifierChange(index: number, modifier: StepModifier) {
    const updated = draft.ability_steps.map((step, i) =>
      i === index ? {...step, modifier} : step,
    );
    onChange({...draft, ability_steps: updated});
  }

  return (
    <div>
      <div style={paletteStyles}>
        <div style={tabRowStyles}>
          {ABILITY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              style={getTabStyles(activeCategory === cat.id)}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{color: theme.colors.textMuted}}>Loading abilities...</p>
        ) : paletteAbilities.length === 0 ? (
          <p style={{color: theme.colors.textMuted}}>No abilities available in this category</p>
        ) : (
          <div style={paletteGridStyles}>
            {paletteAbilities.map((ability) => (
              <button
                key={ability.id}
                style={abilityButtonStyles}
                onClick={() => handleAddAbility(ability.type, ability.name)}
              >
                {ability.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{color: theme.colors.text, marginBottom: theme.spacing.sm}}>
          Ability Steps ({draft.ability_steps.length})
        </h4>
        {draft.ability_steps.length === 0 ? (
          <p style={{color: theme.colors.textMuted, fontSize: '0.9rem'}}>
            Click an ability above to add it as a step
          </p>
        ) : (
          <div style={stepListStyles}>
            {draft.ability_steps.map((step, index) => (
              <div key={step.id} style={stepItemStyles}>
                <span style={stepNameStyles}>
                  {step.order}. {step.ability_name}
                </span>

                <select
                  style={selectStyles}
                  value={step.modifier}
                  onChange={(e) => handleModifierChange(index, e.target.value as StepModifier)}
                  disabled={index === 0}
                >
                  {MODIFIERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <button
                  style={iconButtonStyles}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  style={iconButtonStyles}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === draft.ability_steps.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  style={removeButtonStyles}
                  onClick={() => handleRemoveStep(index)}
                  aria-label="Remove"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

