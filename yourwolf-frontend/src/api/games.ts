import {apiClient} from './client';
import type {
  GameSession,
  GameSessionCreate,
  GameSessionListItem,
  NightScript,
} from '../types/game';

interface GameListParams {
  phase?: string;
  page?: number;
  limit?: number;
}

interface GameListResponse {
  items: GameSessionListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const gamesApi = {
  create: async (data: GameSessionCreate): Promise<GameSession> => {
    const response = await apiClient.post<GameSession>('/games', data);
    return response.data;
  },

  list: async (params?: GameListParams): Promise<GameSessionListItem[]> => {
    const {data} = await apiClient.get<GameListResponse>('/games', {params});
    return data.items;
  },

  getById: async (gameId: string): Promise<GameSession> => {
    const {data} = await apiClient.get<GameSession>(`/games/${gameId}`);
    return data;
  },

  start: async (gameId: string): Promise<GameSession> => {
    const {data} = await apiClient.post<GameSession>(`/games/${gameId}/start`);
    return data;
  },

  advancePhase: async (gameId: string): Promise<GameSession> => {
    const {data} = await apiClient.post<GameSession>(
      `/games/${gameId}/advance`,
    );
    return data;
  },

  getNightScript: async (gameId: string): Promise<NightScript> => {
    const {data} = await apiClient.get<NightScript>(
      `/games/${gameId}/script`,
    );
    return data;
  },

  delete: async (gameId: string): Promise<void> => {
    await apiClient.delete(`/games/${gameId}`);
  },
};
