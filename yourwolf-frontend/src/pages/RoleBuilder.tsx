import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {ValidationResult, NarratorPreviewResponse} from '../types/transport';
import {rolesApi} from '../api/roles';
import {extractApiErrorMessages} from '../api/errors';
import {createEmptyDraft, RoleDraft} from '../domain/roleDraft';
import {adaptDraftToEngine} from '../adapters/role_adapters';
import {buildPreview} from '../engine/narration';
import {Wizard} from '../components/RoleBuilder/Wizard';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles} from '../styles/shared';
import {ErrorBanner} from '../components/ErrorBanner';

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

  const handleDraftChange = useCallback((updatedDraft: RoleDraft) => {
    setDraft(updatedDraft);
    setValidation(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const requestId = ++validateIdRef.current;

    setPreviewLoading(true);

    debounceRef.current = setTimeout(async () => {
      const validationPromise = rolesApi.validate(updatedDraft);
      const localPreview: NarratorPreviewResponse = {
        actions: buildPreview(adaptDraftToEngine(updatedDraft)),
      };

      if (requestId === validateIdRef.current) {
        setPreview(localPreview);
        setPreviewLoading(false);
      }

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
        preview={preview}
        previewLoading={previewLoading}
        onChange={handleDraftChange}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
