import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import type {ValidationResult, NarratorPreviewResponse} from '../types/transport';
import {createEmptyDraft, RoleDraft} from '../domain/roleDraft';
import {hasRoleNameCollision, validateRoleDraft} from '../domain/roleValidation';
import {adaptDraftToEngine} from '../adapters/role_adapters';
import {buildPreview} from '../engine/narration';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';
import {useRepositories} from '../context/repository_context';
import {useRoles} from '../hooks/useRoles';
import {useNameCheck} from '../hooks/useNameCheck';
import type {NameStatus} from '../hooks/useNameCheck';
import {useAbilities} from '../hooks/useAbilities';
import {createCustomRole} from '../data/conversion';

export function RoleBuilderPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<RoleDraft>(createEmptyDraft);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<NarratorPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateIdRef = useRef(0);
  const catalogsReadyRef = useRef(false);
  const {repositories} = useRepositories();
  const {roles, loading: rolesLoading, error: rolesError} = useRoles();
  const {abilities, loading: abilitiesLoading, error: abilitiesError} = useAbilities();
  const localRolesReady = !rolesLoading && rolesError === null;
  const abilitiesReady = !abilitiesLoading && abilitiesError === null;
  const catalogsReady = localRolesReady && abilitiesReady;
  const nameStatus: NameStatus = useNameCheck(draft.name, roles, localRolesReady);

  const handleDraftChange = useCallback((updatedDraft: RoleDraft) => {
    setDraft(updatedDraft);
    setValidation(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const requestId = ++validateIdRef.current;

    setPreviewLoading(true);

    debounceRef.current = setTimeout(() => {
      const localPreview: NarratorPreviewResponse = {
        actions: buildPreview(adaptDraftToEngine(updatedDraft)),
      };

      if (requestId === validateIdRef.current) {
        setPreview(localPreview);
        setPreviewLoading(false);
      }

      if (!catalogsReady) {
        return;
      }

      if (requestId === validateIdRef.current) {
        const result = validateRoleDraft(updatedDraft, abilities);
        const trimmedLength = updatedDraft.name.trim().length;
        const collision = hasRoleNameCollision(roles, updatedDraft.name);
        const collisionApplies = collision && trimmedLength >= 2 && trimmedLength <= 50;
        const errors = collisionApplies ? ['Name is already taken', ...result.errors] : result.errors;
        setValidation({...result, is_valid: errors.length === 0, errors});
      }
    }, 1000);
  }, [abilities, catalogsReady, roles]);

  useEffect(() => {
    const becameReady = !catalogsReadyRef.current && catalogsReady;
    catalogsReadyRef.current = catalogsReady;
    if (becameReady) {
      handleDraftChange(draft);
    }
  }, [catalogsReady, draft, handleDraftChange]);

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
      if (repositories === null) {
        throw new Error('Repositories are unavailable');
      }
      if (validation?.is_valid !== true || nameStatus !== 'available') {
        setSaving(false);
        return;
      }
      const currentRoles = await repositories.roles.list();
      if (hasRoleNameCollision(currentRoles, draft.name)) {
        setSaveError('Name is already taken');
        setSaving(false);
        return;
      }
      const role = createCustomRole({...draft, updated_at: new Date().toISOString()});
      await repositories.roles.put(role);
      setSaving(false);
      navigate('/roles');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create role');
      setSaving(false);
    }
  }, [draft, nameStatus, navigate, repositories, validation]);

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
        preview={preview}
        previewLoading={previewLoading}
        onChange={handleDraftChange}
        onSave={handleSave}
        saving={saving}
        nameStatus={nameStatus}
      />
    </div>
  );
}
