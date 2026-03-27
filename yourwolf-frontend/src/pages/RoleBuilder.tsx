import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {RoleDraft, ValidationResult} from '../types/role';
import {rolesApi} from '../api/roles';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {theme} from '../styles/theme';

const containerStyles: React.CSSProperties = {
  width: '100%',
};

const headerStyles: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
};

const titleStyles: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: theme.colors.textMuted,
};

const errorStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  color: theme.colors.error,
  marginBottom: theme.spacing.md,
};

function createEmptyDraft(): RoleDraft {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    team: 'village',
    wake_order: null,
    wake_target: null,
    votes: 1,
    ability_steps: [],
    win_conditions: [],
    created_at: now,
    updated_at: now,
  };
}

export function RoleBuilderPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<RoleDraft>(createEmptyDraft);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateIdRef = useRef(0);

  const handleDraftChange = useCallback((updatedDraft: RoleDraft) => {
    setDraft(updatedDraft);
    setValidation(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const requestId = ++validateIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await rolesApi.validate(updatedDraft);
        if (requestId === validateIdRef.current) {
          setValidation(result);
        }
      } catch {
        if (requestId === validateIdRef.current) {
          // Validation failure shouldn't block navigation
          setValidation({is_valid: false, errors: ['Validation service unavailable'], warnings: []});
        }
      }
    }, 1000);
  }, []);

  // Validate initial draft on mount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const role = await rolesApi.create(draft);
      setSaving(false);
      navigate(`/roles/${role.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create role');
      setSaving(false);
    }
  }, [draft, navigate]);

  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <h1 style={titleStyles}>Create New Role</h1>
        <p style={subtitleStyles}>Build a custom role by composing abilities and win conditions</p>
      </header>

      {saveError && (
        <div style={errorStyles}>
          <strong>Error creating role:</strong> {saveError}
        </div>
      )}

      <Wizard
        draft={draft}
        validation={validation}
        onChange={handleDraftChange}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
