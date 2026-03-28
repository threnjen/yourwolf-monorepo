import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {RoleDraft, ValidationResult} from '../types/role';
import {rolesApi} from '../api/roles';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';

function createEmptyDraft(): RoleDraft {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    team: 'village',
    wake_order: 0,
    wake_target: null,
    votes: 1,
    is_primary_team_role: false,
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
      await rolesApi.create(draft);
      setSaving(false);
      navigate('/roles');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create role');
      setSaving(false);
    }
  }, [draft, navigate]);

  return (
    <div style={pageContainerStyles}>
      <header style={pageHeaderStyles}>
        <h1 style={pageTitleStyles}>Create New Role</h1>
        <p style={pageSubtitleStyles}>Build a custom role by composing abilities and win conditions</p>
      </header>

      {saveError && (
        <ErrorBanner message={`Error creating role: ${saveError}`} />
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
