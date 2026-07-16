import {apiClient} from './client';
import {Role, RoleListItem, ValidationResult, NameCheckResult, Visibility, NarratorPreviewResponse} from '../types/transport';
import {RoleDraft} from '../domain/roleDraft';
import {Team} from '../domain/teams';

interface RoleListParams {
  team?: string;
  visibility?: string[];
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
    const {data} = await apiClient.get<RoleListResponse>('/roles', {
      params,
      paramsSerializer: {
        indexes: null,
      },
    });
    return data.items;
  },

  validate: async (draft: RoleDraft): Promise<ValidationResult> => {
    const {data} = await apiClient.post<ValidationResult>('/roles/validate', draftToPayload(draft));
    return data;
  },

  checkName: async (name: string): Promise<NameCheckResult> => {
    const {data} = await apiClient.get<NameCheckResult>('/roles/check-name', {params: {name}});
    return data;
  },

  create: async (draft: RoleDraft): Promise<Role> => {
    const {data} = await apiClient.post<Role>('/roles', draftToPayload(draft));
    return data;
  },

  previewScript: async (draft: RoleDraft): Promise<NarratorPreviewResponse> => {
    const {data} = await apiClient.post<NarratorPreviewResponse>('/roles/preview-script', draftToPreviewPayload(draft));
    return data;
  },
};

interface RoleCreatePayload {
  name: string;
  description: string;
  team: Team;
  wake_order: number | null;
  wake_target: string | null;
  votes: number;
  is_primary_team_role: boolean;
  visibility: Visibility;
  creator_id: null;
  ability_steps: {
    ability_type: string;
    order: number;
    modifier: string;
    is_required: boolean;
    parameters: Record<string, unknown>;
    condition_type?: string;
    condition_params?: Record<string, unknown>;
  }[];
  win_conditions: {
    condition_type: string;
    condition_params: Record<string, unknown> | null;
    is_primary: boolean;
    overrides_team: boolean;
  }[];
}

function draftToPayload(draft: RoleDraft): RoleCreatePayload {
  return {
    name: draft.name,
    description: draft.description,
    team: draft.team,
    wake_order: draft.wake_order,
    wake_target: draft.wake_target,
    votes: draft.votes,
    is_primary_team_role: draft.is_primary_team_role,
    visibility: 'private',
    creator_id: null,
    ability_steps: draft.ability_steps.map((s) => ({
      ability_type: s.ability_type,
      order: s.order,
      modifier: s.modifier,
      is_required: s.is_required,
      parameters: s.parameters,
      condition_type: s.condition_type,
      condition_params: s.condition_params,
    })),
    win_conditions: draft.win_conditions.map((w) => ({
      condition_type: w.condition_type,
      condition_params: w.condition_params ?? null,
      is_primary: w.is_primary,
      overrides_team: w.overrides_team,
    })),
  };
}

interface PreviewScriptPayload {
  name: string;
  wake_order: number | null;
  wake_target: string | null;
  ability_steps: {
    ability_type: string;
    order: number;
    modifier: string;
    is_required: boolean;
    parameters: Record<string, unknown>;
    condition_type?: string;
    condition_params?: Record<string, unknown>;
  }[];
}

function draftToPreviewPayload(draft: RoleDraft): PreviewScriptPayload {
  return {
    name: draft.name,
    wake_order: draft.wake_order,
    wake_target: draft.wake_target,
    ability_steps: draft.ability_steps.map((s) => ({
      ability_type: s.ability_type,
      order: s.order,
      modifier: s.modifier,
      is_required: s.is_required,
      parameters: s.parameters,
      condition_type: s.condition_type,
      condition_params: s.condition_params,
    })),
  };
}
