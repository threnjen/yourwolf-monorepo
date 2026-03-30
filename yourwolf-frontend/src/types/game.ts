export type GamePhase =
  | 'setup'
  | 'night'
  | 'discussion'
  | 'voting'
  | 'resolution'
  | 'complete';

export interface GameSessionCreate {
  player_count: number;
  center_card_count: number;
  discussion_timer_seconds: number;
  role_ids: string[];
  wake_order_sequence?: string[];
}

export interface GameRole {
  id: string;
  role_id: string;
  role_name: string;
  role_team: string;
  position: number | null;
  is_center: boolean;
  is_flipped: boolean;
}

export interface GameSession {
  id: string;
  player_count: number;
  center_card_count: number;
  discussion_timer_seconds: number;
  phase: GamePhase;
  current_wake_order: number | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  game_roles: GameRole[];
}

export interface GameSessionListItem {
  id: string;
  player_count: number;
  phase: GamePhase;
  created_at: string;
}

export interface NarratorAction {
  order: number;
  role_name: string;
  instruction: string;
  duration_seconds: number;
  requires_player_action: boolean;
}

export interface NightScript {
  game_session_id: string;
  actions: NarratorAction[];
  total_duration_seconds: number;
}
