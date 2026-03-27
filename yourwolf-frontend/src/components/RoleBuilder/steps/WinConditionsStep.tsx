import {RoleDraft, WinConditionDraft} from '../../../types/role';
import {theme} from '../../../styles/theme';
import {selectStyles} from '../../../styles/shared';

interface WinConditionsStepProps {
  draft: RoleDraft;
  onChange: (draft: RoleDraft) => void;
}

type ConditionType = 'team_wins' | 'special_win_dead' | 'most_votes' | 'no_votes';

const CONDITION_TYPES: {value: ConditionType; label: string}[] = [
  {value: 'team_wins', label: 'Team Wins'},
  {value: 'special_win_dead', label: 'Special Win (Dead)'},
  {value: 'most_votes', label: 'Most Votes'},
  {value: 'no_votes', label: 'No Votes'},
];

const conditionItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.md,
  padding: theme.spacing.sm,
  backgroundColor: theme.colors.surfaceLight,
  borderRadius: theme.borderRadius.sm,
  marginBottom: theme.spacing.sm,
  flexWrap: 'wrap',
};

const labelStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.xs,
  cursor: 'pointer',
};

const addButtonStyles: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  borderRadius: theme.borderRadius.md,
  border: `1px solid ${theme.colors.primaryLight}`,
  backgroundColor: 'transparent',
  color: theme.colors.primaryLight,
  cursor: 'pointer',
  fontSize: '0.9rem',
  marginTop: theme.spacing.md,
};

const removeButtonStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.error}`,
  backgroundColor: 'transparent',
  color: theme.colors.error,
  cursor: 'pointer',
  fontSize: '0.85rem',
  marginLeft: 'auto',
};

export function WinConditionsStep({draft, onChange}: WinConditionsStepProps) {
  function handleAddCondition() {
    const newCondition: WinConditionDraft = {
      id: crypto.randomUUID(),
      condition_type: 'team_wins',
      is_primary: false,
      overrides_team: false,
    };
    onChange({...draft, win_conditions: [...draft.win_conditions, newCondition]});
  }

  function handleRemoveCondition(index: number) {
    onChange({
      ...draft,
      win_conditions: draft.win_conditions.filter((_, i) => i !== index),
    });
  }

  function handleTypeChange(index: number, conditionType: string) {
    const updated = draft.win_conditions.map((wc, i) =>
      i === index ? {...wc, condition_type: conditionType} : wc,
    );
    onChange({...draft, win_conditions: updated});
  }

  function handlePrimaryChange(index: number, value: boolean) {
    const updated = draft.win_conditions.map((wc, i) => ({
      ...wc,
      is_primary: i === index ? value : value ? false : wc.is_primary,
    }));
    onChange({...draft, win_conditions: updated});
  }

  function handleOverridesTeamChange(index: number, value: boolean) {
    const updated = draft.win_conditions.map((wc, i) =>
      i === index ? {...wc, overrides_team: value} : wc,
    );
    onChange({...draft, win_conditions: updated});
  }

  return (
    <div>
      {draft.win_conditions.length === 0 ? (
        <p style={{color: theme.colors.textMuted, fontSize: '0.9rem'}}>
          No win conditions configured. Add a condition to define how this role wins.
        </p>
      ) : (
        <div>
          {draft.win_conditions.map((wc, index) => (
            <div key={wc.id} style={conditionItemStyles}>
              <select
                style={selectStyles}
                value={wc.condition_type}
                onChange={(e) => handleTypeChange(index, e.target.value)}
              >
                {CONDITION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>

              <label style={labelStyles}>
                <input
                  type="checkbox"
                  aria-label="Primary"
                  checked={wc.is_primary}
                  onChange={(e) => handlePrimaryChange(index, e.target.checked)}
                />
                Primary
              </label>

              <label style={labelStyles}>
                <input
                  type="checkbox"
                  aria-label="Overrides team"
                  checked={wc.overrides_team}
                  onChange={(e) => handleOverridesTeamChange(index, e.target.checked)}
                />
                Overrides team
              </label>

              <button
                style={removeButtonStyles}
                onClick={() => handleRemoveCondition(index)}
                aria-label="Remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button style={addButtonStyles} onClick={handleAddCondition}>
        + Add Condition
      </button>
    </div>
  );
}

