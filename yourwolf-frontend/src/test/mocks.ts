import {RoleListItem, Team, Visibility, Ability, AbilityStepDraft, WinConditionDraft, RoleDraft, NarratorPreviewAction, NarratorPreviewResponse} from '../types/role';
import type {
  GameSession,
  GameSessionListItem,
  GamePhase,
  GameRole,
  NarratorAction,
  NightScript,
} from '../types/game';

/**
 * Creates a mock RoleListItem for testing.
 */
export function createMockRole(overrides: Partial<RoleListItem> = {}): RoleListItem {
  return {
    id: 'test-uuid-1234',
    name: 'Test Role',
    description: 'A test role description',
    team: 'village' as Team,
    wake_order: 3,
    visibility: 'official' as Visibility,
    vote_score: 5,
    use_count: 0,
    default_count: 1,
    min_count: 1,
    max_count: 1,
    is_primary_team_role: false,
    dependencies: [],
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates an array of mock roles for testing.
 */
export function createMockRoles(count: number = 5): RoleListItem[] {
  const teams: Team[] = ['village', 'werewolf', 'vampire', 'alien', 'neutral'];
  const visibilities: Visibility[] = ['official', 'public', 'private'];

  return Array.from({length: count}, (_, i) => ({
    id: `role-uuid-${i + 1}`,
    name: `Test Role ${i + 1}`,
    description: `Description for role ${i + 1}`,
    team: teams[i % teams.length],
    wake_order: i % 10,
    visibility: visibilities[i % visibilities.length],
    vote_score: i * 2,
    use_count: 0,
    default_count: 1,
    min_count: 1,
    max_count: 1,
    is_primary_team_role: false,
    dependencies: [],
    created_at: '2025-01-01T00:00:00Z',
  }));
}

/**
 * Creates a mock official role.
 */
export function createMockOfficialRole(
  name: string,
  team: Team,
  wakeOrder: number | null = null,
): RoleListItem {
  return {
    id: `official-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    description: `${name} role description`,
    team,
    wake_order: wakeOrder ?? undefined,
    visibility: 'official',
    vote_score: 0,
    use_count: 0,
    default_count: 1,
    min_count: 1,
    max_count: 1,
    is_primary_team_role: false,
    dependencies: [],
    created_at: '2025-01-01T00:00:00Z',
  };
}

/**
 * Sample official roles matching the seed data.
 */
export const sampleOfficialRoles: RoleListItem[] = [
  createMockOfficialRole('Villager', 'village'),
  createMockOfficialRole('Werewolf', 'werewolf', 1),
  createMockOfficialRole('Seer', 'village', 4),
  createMockOfficialRole('Robber', 'village', 4),
  createMockOfficialRole('Troublemaker', 'village', 5),
  createMockOfficialRole('Tanner', 'neutral'),
  createMockOfficialRole('Minion', 'werewolf', 2),
];

/**
 * Creates a mock GameRole for testing.
 */
export function createMockGameRole(
  overrides: Partial<GameRole> = {},
): GameRole {
  return {
    id: 'game-role-uuid-1',
    role_id: 'role-uuid-1',
    role_name: 'Werewolf',
    role_team: 'werewolf',
    position: 0,
    is_center: false,
    is_flipped: false,
    ...overrides,
  };
}

/**
 * Creates a mock GameSession for testing.
 */
export function createMockGameSession(
  overrides: Partial<GameSession> = {},
): GameSession {
  return {
    id: 'game-uuid-1234',
    player_count: 5,
    center_card_count: 3,
    discussion_timer_seconds: 300,
    phase: 'setup' as GamePhase,
    current_wake_order: null,
    created_at: '2025-01-01T00:00:00Z',
    started_at: null,
    ended_at: null,
    game_roles: [],
    ...overrides,
  };
}

/**
 * Creates a mock GameSessionListItem for testing.
 */
export function createMockGameListItem(
  overrides: Partial<GameSessionListItem> = {},
): GameSessionListItem {
  return {
    id: 'game-uuid-1234',
    player_count: 5,
    phase: 'setup' as GamePhase,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock NightScript for testing.
 */
export function createMockNightScript(
  overrides: Partial<NightScript> = {},
): NightScript {
  const defaultActions: NarratorAction[] = [
    {
      order: 1,
      role_name: 'Narrator',
      instruction: 'Everyone, close your eyes.',
      duration_seconds: 5,
      requires_player_action: false,
    },
    {
      order: 2,
      role_name: 'Werewolf',
      instruction: 'Werewolf, wake up and look for other werewolves.',
      duration_seconds: 10,
      requires_player_action: true,
    },
    {
      order: 3,
      role_name: 'Werewolf',
      instruction: 'Werewolf, close your eyes.',
      duration_seconds: 3,
      requires_player_action: false,
    },
    {
      order: 4,
      role_name: 'Narrator',
      instruction: 'Everyone, open your eyes. Discussion begins now.',
      duration_seconds: 5,
      requires_player_action: false,
    },
  ];

  return {
    game_session_id: 'game-uuid-1234',
    actions: defaultActions,
    total_duration_seconds: 23,
    ...overrides,
  };
}

/**
 * Creates a mock Ability for testing.
 */
export function createMockAbility(overrides: Partial<Ability> = {}): Ability {
  return {
    id: 'ability-uuid-1',
    type: 'view_card',
    name: 'View Card',
    description: 'Look at another player\'s card',
    parameters_schema: {},
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock RoleDraft for testing.
 */
export function createMockDraft(overrides: Partial<RoleDraft> = {}): RoleDraft {
  return {
    id: 'draft-uuid-1',
    name: 'Test Draft Role',
    description: 'A test draft role',
    team: 'village' as Team,
    wake_order: 0,
    wake_target: null,
    votes: 1,
    is_primary_team_role: false,
    ability_steps: [] as AbilityStepDraft[],
    win_conditions: [] as WinConditionDraft[],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock NarratorPreviewResponse for testing.
 */
export function createMockPreviewResponse(
  overrides: Partial<NarratorPreviewResponse> = {},
): NarratorPreviewResponse {
  const defaultActions: NarratorPreviewAction[] = [
    {order: 1, instruction: 'Seer, wake up.', is_section_header: false},
    {order: 2, instruction: 'You may look at one other player\'s card.', is_section_header: false},
    {order: 3, instruction: 'OR You may look at 2 cards from the center.', is_section_header: false},
    {order: 4, instruction: 'Seer, close your eyes.', is_section_header: false},
  ];

  return {
    actions: defaultActions,
    ...overrides,
  };
}
