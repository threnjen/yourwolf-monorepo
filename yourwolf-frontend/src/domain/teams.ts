/**
 * Single source of truth for the game's teams.
 *
 * Order is semantic: it drives role sorting/grouping (see `utils/roleSort`).
 * The string values are transport-facing (they cross the API boundary), so they
 * must not be renamed or reordered without a coordinated backend change.
 */
export const TEAMS = ['village', 'werewolf', 'vampire', 'alien', 'neutral'] as const;

export type Team = (typeof TEAMS)[number];
