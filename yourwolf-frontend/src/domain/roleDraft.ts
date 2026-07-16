import type {Team} from './teams';

/**
 * How a step chains onto the one before it.
 *
 * Lives in the domain rather than with the transport DTOs because the chaining
 * rules (see `normalizeModifier` in `./abilitySteps`) are game logic; the wire
 * format merely carries the chosen value.
 */
export type StepModifier = 'none' | 'and' | 'or' | 'if';

/**
 * One ability step as the builder wizard holds it while editing.
 *
 * Distinct from the transport `AbilityStep` DTO despite the shapes currently
 * lining up: `id` here is a client-generated key (`crypto.randomUUID`) used to
 * track the step across reorders, and `api/roles.ts` drops it when building the
 * create payload. The transport `id` is the server's identifier for a persisted
 * step. The two are free to drift as the API evolves.
 */
export interface AbilityStepDraft {
  id: string;
  order: number;
  modifier: StepModifier;
  is_required: boolean;
  parameters: Record<string, unknown>;
  condition_type?: string;
  condition_params?: Record<string, unknown>;
  ability_type: string;
  ability_name: string;
}

/**
 * One win condition as the builder wizard holds it while editing.
 *
 * Distinct from the transport `WinCondition` DTO for the same reason as
 * `AbilityStepDraft`: `id` is a client-side editing key that the create payload
 * drops, and the draft leaves `condition_params` optional where the payload
 * requires an explicit `null` (normalized at the meeting point in `api/roles.ts`).
 */
export interface WinConditionDraft {
  id: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  is_primary: boolean;
  overrides_team: boolean;
}

/**
 * A role under construction in the builder wizard.
 *
 * The domain's editing model, not a server shape: it carries none of the
 * server-assigned fields the transport `Role` has (`visibility`, `vote_score`,
 * `use_count`, `is_locked`), and it uses `null` rather than absence for the
 * not-yet-set wake fields so the form can bind to them directly.
 * `api/roles.ts` maps this to the create payload.
 */
export interface RoleDraft {
  id: string;
  name: string;
  description: string;
  team: Team;
  wake_order: number | null;
  wake_target: string | null;
  votes: number;
  is_primary_team_role: boolean;
  ability_steps: AbilityStepDraft[];
  win_conditions: WinConditionDraft[];
  created_at: string;
  updated_at: string;
}

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
