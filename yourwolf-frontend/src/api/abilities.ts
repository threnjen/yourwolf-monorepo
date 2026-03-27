import {apiClient} from './client';
import {Ability} from '../types/role';

export const abilitiesApi = {
  list: async (): Promise<Ability[]> => {
    const {data} = await apiClient.get<Ability[]>('/abilities');
    return data;
  },
};
