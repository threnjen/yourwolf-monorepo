import {describe, it, expect, vi, beforeEach} from 'vitest';
import {rolesApi} from '../../api/roles';
import {createMockRoles, createMockRole, createMockDraft} from '../mocks';
import {RoleListItem} from '../../types/transport';
import type {RoleDetailAdapterInput} from '../../adapters/role_adapters';

// Mock the API client module
vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked client
import {apiClient} from '../../api/client';

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Helper to wrap roles in paginated response
function createPaginatedResponse(roles: RoleListItem[]) {
  return {
    items: roles,
    total: roles.length,
    page: 1,
    limit: 50,
    pages: 1,
  };
}

describe('rolesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches roles without parameters', async () => {
      const mockRoles = createMockRoles(5);
      mockApiClient.get.mockResolvedValue({data: createPaginatedResponse(mockRoles)});

      const result = await rolesApi.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles', {
        params: undefined,
        paramsSerializer: {indexes: null},
      });
      expect(result).toEqual(mockRoles);
    });

    it('passes team filter', async () => {
      const mockRoles = createMockRoles(3);
      mockApiClient.get.mockResolvedValue({data: createPaginatedResponse(mockRoles)});

      await rolesApi.list({team: 'werewolf'});

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles', {
        params: {team: 'werewolf'},
        paramsSerializer: {indexes: null},
      });
    });

    it('passes visibility filter as array', async () => {
      const mockRoles = createMockRoles(2);
      mockApiClient.get.mockResolvedValue({data: createPaginatedResponse(mockRoles)});

      await rolesApi.list({visibility: ['official']});

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles', {
        params: {visibility: ['official']},
        paramsSerializer: {indexes: null},
      });
    });

    it('passes combined parameters', async () => {
      const mockRoles = createMockRoles(5);
      mockApiClient.get.mockResolvedValue({data: createPaginatedResponse(mockRoles)});

      await rolesApi.list({
        team: 'village',
        visibility: ['public'],
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles', {
        params: {
          team: 'village',
          visibility: ['public'],
        },
        paramsSerializer: {indexes: null},
      });
    });

    it('propagates API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(rolesApi.list()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('fetches and returns the role detail projection', async () => {
      const detail: RoleDetailAdapterInput = {
        wake_target: 'player.self',
        ability_steps: [
          {
            ability_type: 'view_card',
            order: 1,
            modifier: 'none',
            is_required: true,
            parameters: {target: 'player.other'},
          },
        ],
      };
      mockApiClient.get.mockResolvedValue({data: detail});

      const result = await rolesApi.getById('role-seer');

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles/role-seer');
      expect(result).toEqual(detail);
    });
  });

  describe('validate', () => {
    it('posts draft to /roles/validate', async () => {
      const draft = createMockDraft({name: 'My Role'});
      const validationResult = {is_valid: true, errors: [], warnings: []};
      mockApiClient.post.mockResolvedValue({data: validationResult});

      const result = await rolesApi.validate(draft);

      expect(mockApiClient.post).toHaveBeenCalledWith('/roles/validate', expect.objectContaining({
        name: 'My Role',
      }));
      expect(result).toEqual(validationResult);
    });

    it('returns validation errors from backend', async () => {
      const draft = createMockDraft({name: ''});
      const validationResult = {is_valid: false, errors: ['Name is required'], warnings: []};
      mockApiClient.post.mockResolvedValue({data: validationResult});

      const result = await rolesApi.validate(draft);

      expect(result.is_valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });
  });

  describe('checkName', () => {
    it('gets /roles/check-name with name param', async () => {
      const nameCheckResult = {name: 'Werewolf', is_available: false, message: 'Name is taken'};
      mockApiClient.get.mockResolvedValue({data: nameCheckResult});

      const result = await rolesApi.checkName('Werewolf');

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles/check-name', {params: {name: 'Werewolf'}});
      expect(result).toEqual(nameCheckResult);
    });

    it('returns available for unique name', async () => {
      const nameCheckResult = {name: 'MyUniqueRole', is_available: true, message: 'Name is available'};
      mockApiClient.get.mockResolvedValue({data: nameCheckResult});

      const result = await rolesApi.checkName('MyUniqueRole');

      expect(result.is_available).toBe(true);
    });
  });

  describe('create', () => {
    it('posts draft to /roles', async () => {
      const draft = createMockDraft({name: 'New Role', team: 'village'});
      const createdRole = createMockRole({id: 'new-id', name: 'New Role'});
      mockApiClient.post.mockResolvedValue({data: createdRole});

      const result = await rolesApi.create(draft);

      expect(mockApiClient.post).toHaveBeenCalledWith('/roles', expect.objectContaining({
        name: 'New Role',
        team: 'village',
      }));
      expect(result).toEqual(createdRole);
    });
  });

});
