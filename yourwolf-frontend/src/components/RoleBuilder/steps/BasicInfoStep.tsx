import {useState, useEffect} from 'react';
import {RoleDraft} from '../../../domain/roleDraft';
import {useNameCheck} from '../../../hooks/useNameCheck';
import type {NameStatus} from '../../../hooks/useNameCheck';
import {TEAMS, Team} from '../../../domain/teams';
import {theme, TEAM_COLORS} from '../../../styles/theme';
import {capitalize} from '../../../utils/format';

interface BasicInfoStepProps {
  draft: RoleDraft;
  onChange: (draft: RoleDraft) => void;
  nameStatus?: NameStatus;
}

const fieldGroupStyles: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.xs,
  color: theme.colors.text,
  fontWeight: 500,
  fontSize: '0.9rem',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: theme.spacing.sm,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.secondary}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const textareaStyles: React.CSSProperties = {
  ...inputStyles,
  minHeight: '80px',
  resize: 'vertical',
};

const smallInputStyles: React.CSSProperties = {
  ...inputStyles,
  width: '120px',
};

const teamRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.sm,
  flexWrap: 'wrap',
};

const nameStatusStyles: Record<NameStatus, React.CSSProperties> = {
  idle: {fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: theme.spacing.xs},
  checking: {fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: theme.spacing.xs},
  available: {fontSize: '0.8rem', color: theme.colors.success, marginTop: theme.spacing.xs},
  taken: {fontSize: '0.8rem', color: theme.colors.error, marginTop: theme.spacing.xs},
};

function getTeamButtonStyles(team: Team, isSelected: boolean): React.CSSProperties {
  return {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.sm,
    border: `2px solid ${isSelected ? TEAM_COLORS[team] : theme.colors.secondary}`,
    backgroundColor: isSelected ? `${TEAM_COLORS[team]}30` : 'transparent',
    color: isSelected ? TEAM_COLORS[team] : theme.colors.textMuted,
    cursor: 'pointer',
    fontWeight: isSelected ? 600 : 400,
    fontSize: '0.85rem',
    textTransform: 'capitalize',
  };
}

export function BasicInfoStep({draft, onChange, nameStatus: providedNameStatus}: BasicInfoStepProps) {
  const [localName, setLocalName] = useState(draft.name);
  const hookNameStatus = useNameCheck(localName, providedNameStatus === undefined);
  const nameStatus = providedNameStatus ?? hookNameStatus;

  // Sync localName when draft.name changes externally (e.g., draft restore)
  useEffect(() => {
    setLocalName(draft.name);
  }, [draft.name]);

  function handleNameChange(value: string) {
    setLocalName(value);
    onChange({...draft, name: value});
  }

  function handleTeamChange(team: Team) {
    if (team === 'village' || team === 'neutral') {
      onChange({...draft, team, is_primary_team_role: false});
    } else {
      onChange({...draft, team});
    }
  }

  function handlePrimaryTeamRoleChange(checked: boolean) {
    onChange({...draft, is_primary_team_role: checked});
  }

  function handleDescriptionChange(value: string) {
    onChange({...draft, description: value});
  }

  function handleWakeOrderChange(value: string) {
    const parsed = value === '' ? 0 : parseInt(value, 10);
    onChange({...draft, wake_order: isNaN(parsed) ? 0 : parsed});
  }

  function handleVotesChange(value: string) {
    const parsed = parseInt(value, 10);
    onChange({...draft, votes: isNaN(parsed) ? 1 : parsed});
  }

  const nameStatusText: Record<NameStatus, string> = {
    idle: '',
    checking: 'Checking...',
    available: 'Available ✓',
    taken: 'Taken ✗',
  };

  return (
    <div>
      <div style={fieldGroupStyles}>
        <label htmlFor="role-name" style={labelStyles}>Name</label>
        <input
          id="role-name"
          type="text"
          style={inputStyles}
          value={localName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter role name"
        />
        {nameStatus !== 'idle' && (
          <div style={nameStatusStyles[nameStatus]}>{nameStatusText[nameStatus]}</div>
        )}
      </div>

      <div style={fieldGroupStyles}>
        <span style={labelStyles}>Team</span>
        <div style={teamRowStyles}>
          {TEAMS.map((team) => (
            <button
              key={team}
              style={getTeamButtonStyles(team, draft.team === team)}
              onClick={() => handleTeamChange(team)}
              type="button"
            >
              {capitalize(team)}
            </button>
          ))}
        </div>
      </div>

      {draft.team !== 'village' && draft.team !== 'neutral' && (
        <div style={fieldGroupStyles}>
          <label style={labelStyles}>
            <input
              type="checkbox"
              aria-label="Primary team role"
              checked={draft.is_primary_team_role}
              onChange={(e) => handlePrimaryTeamRoleChange(e.target.checked)}
            />
            {' '}Primary team role
          </label>
          <div style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: theme.spacing.xs}}>
            At least 1 primary team role is required when any role of this team is included in a game.
          </div>
        </div>
      )}

      <div style={fieldGroupStyles}>
        <label htmlFor="role-description" style={labelStyles}>Description</label>
        <textarea
          id="role-description"
          style={textareaStyles}
          value={draft.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe this role's abilities and behavior"
        />
      </div>

      <div style={{display: 'flex', gap: theme.spacing.xl}}>
        <div style={fieldGroupStyles}>
          <label htmlFor="role-wake-order" style={labelStyles}>Wake Order (0–40)</label>
          <input
            id="role-wake-order"
            type="number"
            style={smallInputStyles}
            value={draft.wake_order ?? ''}
            onChange={(e) => handleWakeOrderChange(e.target.value)}
            min={0}
            max={40}
            step={1}
            placeholder="0–40"
          />
          {(draft.wake_order === 0 || draft.wake_order === null) && (
            <div style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: theme.spacing.xs}}>
              Does not wake up
            </div>
          )}
        </div>

        <div style={fieldGroupStyles}>
          <label htmlFor="role-votes" style={labelStyles}>Votes</label>
          <input
            id="role-votes"
            type="number"
            style={smallInputStyles}
            value={draft.votes}
            onChange={(e) => handleVotesChange(e.target.value)}
            min={0}
            max={10}
          />
        </div>
      </div>
    </div>
  );
}
