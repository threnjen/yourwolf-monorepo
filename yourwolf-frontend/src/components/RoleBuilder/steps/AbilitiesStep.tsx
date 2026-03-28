import {useState} from 'react';
import {RoleDraft, AbilityStepDraft, StepModifier} from '../../../types/role';
import {useAbilities} from '../../../hooks/useAbilities';
import {theme} from '../../../styles/theme';
import {selectStyles} from '../../../styles/shared';

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

const MODIFIER_LABELS: Record<StepModifier, string> = {
  none: '—',
  and: 'And then',
  or: 'Or instead',
  if: 'Only if',
};

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

const paramRowStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  paddingTop: theme.spacing.sm,
  width: '100%',
};

const paramFieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.xs,
};

const paramLabelStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.75rem',
};

const modifierLabelStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.75rem',
  fontWeight: 600,
};

const STRING_TARGET_OPTIONS: string[] = [
  'player.self',
  'player.other',
  'center.main',
  'center.bonus',
  'previous',
  'viewed',
  'team.werewolf',
  'team.vampire',
  'team.alien',
  'team.village',
  'role.mason',
  'players.actions',
];

interface StepParameterInputsProps {
  stepIndex: number;
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

function StepParameterInputs({stepIndex, schema, values, onChange}: StepParameterInputsProps) {
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!properties || Object.keys(properties).length === 0) return null;

  const required = (schema.required as string[] | undefined) ?? [];

  return (
    <div style={paramRowStyles}>
      {Object.entries(properties).map(([key, prop]) => {
        const isRequired = required.includes(key);
        const label = `${key} ${isRequired ? '*' : '(optional)'}`;
        const inputId = `param-${stepIndex}-${key}`;
        const type = prop.type as string;

        let inputEl: React.ReactNode;
        if (type === 'string' && prop.enum) {
          const enumValues = prop.enum as string[];
          inputEl = (
            <select
              id={inputId}
              style={selectStyles}
              value={(values[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">—</option>
              {enumValues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          );
        } else if (type === 'string') {
          inputEl = (
            <select
              id={inputId}
              style={selectStyles}
              value={(values[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">—</option>
              {STRING_TARGET_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          );
        } else if (type === 'integer') {
          inputEl = (
            <input
              id={inputId}
              type="number"
              min={1}
              style={selectStyles}
              value={(values[key] as number) ?? (prop.default as number) ?? 1}
              onChange={(e) => onChange(key, e.target.value)}
            />
          );
        } else if (type === 'array') {
          const arrVal = values[key] as number[] | undefined;
          inputEl = (
            <input
              id={inputId}
              type="text"
              style={selectStyles}
              value={arrVal ? arrVal.join(', ') : ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          );
        } else {
          return null;
        }

        return (
          <div key={key} style={paramFieldStyles}>
            <label htmlFor={inputId} style={paramLabelStyles}>{label}</label>
            {inputEl}
          </div>
        );
      })}
    </div>
  );
}

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

  const isDisabled = draft.wake_order === 0 || draft.wake_order === null;

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

  if (isDisabled) {
    return (
      <div>
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surfaceLight,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.md,
          color: theme.colors.textMuted,
        }}>
          This role does not wake up. Set a Wake Order ≥ 1 in Basic Info to add abilities.
        </div>
        {draft.ability_steps.length > 0 && (
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.surfaceLight,
            borderRadius: theme.borderRadius.sm,
            marginBottom: theme.spacing.md,
            color: theme.colors.error,
          }}>
            This role has ability steps but is set to not wake up. These steps won't execute unless you set a Wake Order ≥ 1.
          </div>
        )}
        {draft.ability_steps.length > 0 && (
          <div style={{opacity: 0.5, pointerEvents: 'none'}}>
            <h4 style={{color: theme.colors.text, marginBottom: theme.spacing.sm}}>
              Ability Steps ({draft.ability_steps.length})
            </h4>
            <div style={stepListStyles}>
              {draft.ability_steps.map((step) => (
                <div key={step.id} style={stepItemStyles}>
                  <span style={stepNameStyles}>
                    {step.order}. {step.ability_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function handleAddAbility(abilityType: string, abilityName: string) {
    const nextOrder = draft.ability_steps.length + 1;
    const ability = abilities.find((a) => a.type === abilityType);
    const schema = ability?.parameters_schema as Record<string, unknown> | undefined;
    const properties = schema?.properties as Record<string, Record<string, unknown>> | undefined;
    const initialParameters: Record<string, unknown> = {};
    if (properties) {
      for (const [key, prop] of Object.entries(properties)) {
        if (prop.type === 'integer') {
          initialParameters[key] = (prop.default as number | undefined) ?? 1;
        }
      }
    }
    const newStep: AbilityStepDraft = {
      id: crypto.randomUUID(),
      ability_type: abilityType,
      ability_name: abilityName,
      order: nextOrder,
      modifier: nextOrder === 1 ? 'none' : 'and',
      is_required: false,
      parameters: initialParameters,
    };
    onChange({...draft, ability_steps: [...draft.ability_steps, newStep]});
  }

  function handleRemoveStep(index: number) {
    const updated = draft.ability_steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : (step.modifier === 'none' ? 'and' as StepModifier : step.modifier)}));
    onChange({...draft, ability_steps: updated});
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const steps = [...draft.ability_steps];
    [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
    const renumbered = steps.map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : (step.modifier === 'none' ? 'and' as StepModifier : step.modifier)}));
    onChange({...draft, ability_steps: renumbered});
  }

  function handleMoveDown(index: number) {
    if (index === draft.ability_steps.length - 1) return;
    const steps = [...draft.ability_steps];
    [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    const renumbered = steps.map((step, i) => ({...step, order: i + 1, modifier: i === 0 ? 'none' as StepModifier : (step.modifier === 'none' ? 'and' as StepModifier : step.modifier)}));
    onChange({...draft, ability_steps: renumbered});
  }

  function handleModifierChange(index: number, modifier: StepModifier) {
    const updated = draft.ability_steps.map((step, i) =>
      i === index ? {...step, modifier} : step,
    );
    onChange({...draft, ability_steps: updated});
  }

  function handleParameterChange(stepIndex: number, paramKey: string, value: unknown) {
    const step = draft.ability_steps[stepIndex];
    const ability = abilities.find((a) => a.type === step.ability_type);
    const schema = ability?.parameters_schema as Record<string, unknown> | undefined;
    const properties = schema?.properties as Record<string, Record<string, unknown>> | undefined;
    const propType = properties?.[paramKey]?.type as string | undefined;

    let parsedValue: unknown = value;
    if (propType === 'integer') {
      const num = parseInt(value as string, 10);
      parsedValue = isNaN(num) || num < 1 ? 1 : num;
    } else if (propType === 'array') {
      parsedValue = (value as string)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    }

    const updated = draft.ability_steps.map((s, i) =>
      i === stepIndex ? {...s, parameters: {...s.parameters, [paramKey]: parsedValue}} : s,
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
            {draft.ability_steps.map((step, index) => {
              const stepAbility = abilities.find((a) => a.type === step.ability_type);
              return (
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
                        onChange={(e) => handleModifierChange(index, e.target.value as StepModifier)}
                      >
                        {MODIFIERS.filter((m) => m !== 'none').map((m) => (
                          <option key={m} value={m}>{MODIFIER_LABELS[m]}</option>
                        ))}
                      </select>
                    </>
                  )}

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
                  <StepParameterInputs
                    stepIndex={index}
                    schema={stepAbility?.parameters_schema ?? {}}
                    values={step.parameters}
                    onChange={(key, val) => handleParameterChange(index, key, val)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

