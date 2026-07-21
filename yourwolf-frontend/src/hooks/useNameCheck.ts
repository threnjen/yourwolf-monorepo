import {useState, useEffect, useRef} from 'react';
import {rolesApi} from '../api/roles';

/** Availability of a role name as reported by the server. */
export type NameStatus = 'idle' | 'checking' | 'available' | 'taken';

/** Names shorter than this are not worth a round trip. */
const MIN_CHECKABLE_LENGTH = 2;

/** How long typing must settle before a request is sent. */
const DEBOUNCE_MS = 500;

/**
 * Reports whether `name` is available as a role name.
 *
 * Typing is debounced by 500ms, and responses that arrive after the name has
 * moved on are discarded, so the status always reflects the latest name rather
 * than whichever request happened to finish last. A failed request degrades to
 * `idle` — name availability is advisory, and the server validates on save.
 */
export function useNameCheck(name: string): NameStatus {
  const [status, setStatus] = useState<NameStatus>('idle');
  const requestIdRef = useRef(0);

  const trimmedName = name.trim();

  useEffect(() => {
    if (trimmedName.length < MIN_CHECKABLE_LENGTH) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    // Invalidates any in-flight request: only the newest id may set status.
    const requestId = ++requestIdRef.current;

    const timeoutId = setTimeout(async () => {
      try {
        const result = await rolesApi.checkName(trimmedName);
        if (requestId === requestIdRef.current) {
          setStatus(result.is_available ? 'available' : 'taken');
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setStatus('idle');
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [trimmedName]);

  return status;
}
