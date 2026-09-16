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
