import {apiClient} from './client';
import type {GameSession, GameSessionCreate, NightScript} from '../types/game';

export const gamesApi = {
  create: async (data: GameSessionCreate): Promise<GameSession> => {
    const {data: game} = await apiClient.post<GameSession>('/games', data);
    return game;
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
