import {useState, useEffect, useRef} from 'react';
import type {RoleListItem} from '../types/transport';
import {hasRoleNameCollision} from '../domain/roleValidation';

/** Availability of a role name in the local role catalog. */
export type NameStatus = 'idle' | 'checking' | 'available' | 'taken';

/** Names shorter than this are not worth a local check. */
const MIN_CHECKABLE_LENGTH = 2;

/** How long typing must settle before a local check runs. */
const DEBOUNCE_MS = 500;

/**
 * Reports whether `name` is available as a role name in `roles`.
 *
 * Typing is debounced by 500ms, and stale scheduled work is discarded so the
 * status always reflects the latest name. Disabled or unready catalogs remain idle.
 */
export function useNameCheck(
  name: string,
  roles: ReadonlyArray<Pick<RoleListItem, 'name'>>,
  enabled = true,
): NameStatus {
  const [status, setStatus] = useState<NameStatus>('idle');
  const requestIdRef = useRef(0);
  const rolesRef = useRef(roles);
  rolesRef.current = roles;

  const trimmedName = name.trim();
  const rolesKey = roles.map((role) => role.name).join('\u0000');

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setStatus('idle');
      return;
    }

    if (trimmedName.length < MIN_CHECKABLE_LENGTH) {
      requestIdRef.current += 1;
      setStatus('idle');
      return;
    }

    setStatus('checking');

    // Invalidates any pending work: only the newest id may set status.
    const requestId = ++requestIdRef.current;

    const timeoutId = setTimeout(() => {
      if (requestId === requestIdRef.current) {
        setStatus(hasRoleNameCollision(rolesRef.current, trimmedName) ? 'taken' : 'available');
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [enabled, rolesKey, trimmedName]);

  return status;
}
