import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import type {ValidationResult, NarratorPreviewResponse, RoleListItem} from '../types/transport';
import {rolesApi} from '../api/roles';
import {extractApiErrorMessages} from '../api/errors';
import {createEmptyDraft, RoleDraft} from '../domain/roleDraft';
import {adaptDraftToEngine} from '../adapters/role_adapters';
import {buildPreview} from '../engine/narration';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';
import {useRepositories} from '../context/repository_context';
import {useRoles} from '../hooks/useRoles';
import {useNameCheck, NameStatus} from '../hooks/useNameCheck';
import {createCustomRole} from '../data/conversion';

function hasRoleNameCollision(roles: ReadonlyArray<Pick<RoleListItem, 'name'>>, name: string): boolean {
  const normalizedName = name.trim().toLocaleLowerCase();
  return normalizedName.length > 0 && roles.some(
    (role) => role.name.trim().toLocaleLowerCase() === normalizedName,
  );
}

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
  const localRolesReadyRef = useRef(false);
  const {repositories} = useRepositories();
  const {roles, loading: rolesLoading, error: rolesError} = useRoles();
  const isLocalNameTaken = hasRoleNameCollision(roles, draft.name);
  const localRolesReady = !rolesLoading && rolesError === null;
  const serverNameStatus = useNameCheck(draft.name, localRolesReady && !isLocalNameTaken);
  const nameStatus: NameStatus = isLocalNameTaken ? 'taken' : serverNameStatus;

  const handleDraftChange = useCallback((updatedDraft: RoleDraft) => {
    setDraft(updatedDraft);
    setValidation(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const requestId = ++validateIdRef.current;

    setPreviewLoading(true);

    debounceRef.current = setTimeout(async () => {
      const localPreview: NarratorPreviewResponse = {
        actions: buildPreview(adaptDraftToEngine(updatedDraft)),
      };

      if (requestId === validateIdRef.current) {
        setPreview(localPreview);
        setPreviewLoading(false);
      }

      const localCollision = hasRoleNameCollision(roles, updatedDraft.name);
      if (!localRolesReady || localCollision) {
        if (requestId === validateIdRef.current && localCollision) {
          setValidation({is_valid: false, errors: ['Name is already taken'], warnings: []});
        }
        return;
      }

      const validationPromise = rolesApi.validate(updatedDraft);

      const [validationSettled] = await Promise.allSettled([validationPromise]);

      if (requestId === validateIdRef.current) {
        if (validationSettled.status === 'fulfilled') {
          setValidation(validationSettled.value);
        } else {
          // A rejection is not necessarily an outage: the server rejects a draft that
          // breaks its schema (a too-short name, say) with a 422 describing the field.
          // Show that where we have it, and keep the generic message for real failures.
          const serverErrors = extractApiErrorMessages(validationSettled.reason);
          setValidation({
            is_valid: false,
            errors: serverErrors ?? ['Validation service unavailable'],
            warnings: [],
          });
        }
      }
    }, 1000);
  }, [localRolesReady, roles]);

  useEffect(() => {
    const becameReady = !localRolesReadyRef.current && localRolesReady;
    localRolesReadyRef.current = localRolesReady;
    if (becameReady && draft.name.trim().length >= 2 && !isLocalNameTaken) {
      handleDraftChange(draft);
    }
  }, [draft, handleDraftChange, isLocalNameTaken, localRolesReady]);

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
