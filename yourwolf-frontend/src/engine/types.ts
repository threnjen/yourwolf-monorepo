import type {StepModifier} from '../domain/roleDraft';
import type {Team} from '../domain/teams';

/** One immutable ability step consumed by the client-side engine. */
export interface EngineAbilityStepInput {
  readonly ability_type: string;
  readonly order: number;
  readonly modifier: StepModifier;
  readonly is_required: boolean;
  readonly parameters: Readonly<Record<string, unknown>>;
}

/** Role metadata and steps consumed by the client-side engine. */
export interface EngineRoleInput {
  readonly name: string;
  readonly wake_target: string | null;
  readonly ability_steps: readonly EngineAbilityStepInput[];
  readonly id: string;
  readonly wake_order: number | null;
  readonly team: Team;
  readonly is_primary_team_role: boolean;
  readonly min_count: number;
  readonly max_count: number;
}

/** One narration action in a generated night script. */
export interface NarratorAction {
  readonly order: number;
  readonly role_name: string;
  readonly instruction: string;
  readonly duration_seconds: number;
  readonly requires_player_action: boolean;
}

/** One narration action in a generated preview. */
export interface NarratorPreviewAction {
  readonly order: number;
  readonly instruction: string;
  readonly is_section_header: boolean;
}
