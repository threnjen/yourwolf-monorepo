import {useState, useEffect, useRef} from 'react';
import {RoleDraft, Team} from '../../../types/role';
import {rolesApi} from '../../../api/roles';
import {theme, TEAM_COLORS, capitalize} from '../../../styles/theme';

interface BasicInfoStepProps {
  draft: RoleDraft;
  onChange: (draft: RoleDraft) => void;
}

const TEAMS: Team[] = ['village', 'werewolf', 'vampire', 'alien', 'neutral'];

type NameStatus = 'idle' | 'checking' | 'available' | 'taken';

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

export function BasicInfoStep({draft, onChange}: BasicInfoStepProps) {
  const [nameStatus, setNameStatus] = useState<NameStatus>('idle');
  const [localName, setLocalName] = useState(draft.name);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameCheckIdRef = useRef(0);

  // Sync localName when draft.name changes externally (e.g., draft restore)
  useEffect(() => {
    setLocalName(draft.name);
  }, [draft.name]);

  useEffect(() => {
    if (!localName.trim() || localName.trim().length < 2) {
      setNameStatus('idle');
      return;
    }

    setNameStatus('checking');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const requestId = ++nameCheckIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await rolesApi.checkName(localName.trim());
        if (requestId === nameCheckIdRef.current) {
          setNameStatus(result.is_available ? 'available' : 'taken');
        }
      } catch {
        if (requestId === nameCheckIdRef.current) {
          setNameStatus('idle');
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localName]);

  function handleNameChange(value: string) {
    setLocalName(value);
    onChange({...draft, name: value});
  }

  function handleTeamChange(team: Team) {
    onChange({...draft, team});
  }

  function handleDescriptionChange(value: string) {
    onChange({...draft, description: value});
  }

  function handleWakeOrderChange(value: string) {
    const parsed = value === '' ? null : parseInt(value, 10);
    onChange({...draft, wake_order: isNaN(parsed as number) ? null : parsed});
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
          <label htmlFor="role-wake-order" style={labelStyles}>Wake Order</label>
          <input
            id="role-wake-order"
            type="number"
            style={smallInputStyles}
            value={draft.wake_order ?? ''}
            onChange={(e) => handleWakeOrderChange(e.target.value)}
            min={0}
            max={20}
            placeholder="0–20"
          />
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

