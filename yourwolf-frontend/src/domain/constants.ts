import type {StepModifier} from '../types/role';

export interface AbilityCategory {
  readonly id: string;
  readonly label: string;
  readonly types: readonly string[];
}

/**
 * Groups ability types into the palette tabs shown by the role builder.
 *
 * Readonly because this is a shared singleton: every consumer receives the same
 * array (and the same nested `types` arrays), so an in-place mutation by one
 * component would silently corrupt every other.
 */
export const ABILITY_CATEGORIES: readonly AbilityCategory[] = [
  {id: 'card', label: 'Card Actions', types: ['view_card', 'swap_card', 'take_card', 'flip_card', 'copy_role']},
  {id: 'info', label: 'Information', types: ['view_awake', 'thumbs_up', 'explicit_no_view']},
  {id: 'physical', label: 'Physical', types: ['rotate_all', 'touch']},
  {id: 'state', label: 'State Changes', types: ['change_to_team', 'perform_as', 'perform_immediately', 'stop']},
  {id: 'other', label: 'Other', types: ['random_num_players']},
];

/** Selectable values for free-form string ability parameters (no enum in the schema). */
export const STRING_TARGET_OPTIONS: readonly string[] = [
  'player.self',
  'player.other',
  'center.main',
  'center.bonus',
  'previous',
  'viewed',
  'team.werewolf',
  'team.vampire',
  'team.alien',
  'team.village',
  'role.mason',
  'players.actions',
];

export const MODIFIERS: readonly StepModifier[] = ['none', 'and', 'or', 'if'];

export const MODIFIER_LABELS: Record<StepModifier, string> = {
  none: '—',
  and: 'And then',
  or: 'Or instead',
  if: 'Only if',
};
