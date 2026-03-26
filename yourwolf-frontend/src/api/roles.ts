import {apiClient} from './client';
import {Role, RoleListItem} from '../types/role';

interface RoleListParams {
  team?: string;
  visibility?: string;
  page?: number;
  limit?: number;
}

interface RoleListResponse {
  items: RoleListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const rolesApi = {
  list: async (params?: RoleListParams): Promise<RoleListItem[]> => {
    const {data} = await apiClient.get<RoleListResponse>('/roles', {params});
    return data.items;
  },

  listOfficial: async (): Promise<RoleListItem[]> => {
    const {data} = await apiClient.get<RoleListResponse>('/roles/official');
    return data.items;
  },

  getById: async (id: string): Promise<Role> => {
    const {data} = await apiClient.get<Role>(`/roles/${id}`);
    return data;
  },
};
