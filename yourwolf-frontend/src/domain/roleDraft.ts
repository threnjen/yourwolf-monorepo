import type {RoleDraft} from '../types/role';

/** Builds a blank role draft with the defaults the builder wizard starts from. */
export function createEmptyDraft(): RoleDraft {
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
