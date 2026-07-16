import {apiClient} from './client';
import {Ability} from '../types/transport';

export const abilitiesApi = {
  list: async (): Promise<Ability[]> => {
    const {data} = await apiClient.get<Ability[]>('/abilities');
    return data;
  },
};
