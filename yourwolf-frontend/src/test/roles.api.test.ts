import {describe, it, expect, vi, beforeEach} from 'vitest';
import {rolesApi} from '../api/roles';
import {createMockRoles, createMockRole, createMockDraft} from './mocks';
import {RoleListItem} from '../types/role';

// Mock the API client module
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked client
import {apiClient} from '../api/client';

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

  describe('listOfficial', () => {
    it('fetches official roles', async () => {
      const officialRoles = createMockRoles(7).map((r) => ({...r, visibility: 'official' as const}));
      mockApiClient.get.mockResolvedValue({data: createPaginatedResponse(officialRoles)});

      const result = await rolesApi.listOfficial();

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles/official');
      expect(result).toEqual(officialRoles);
    });

    it('propagates API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Server error'));

      await expect(rolesApi.listOfficial()).rejects.toThrow('Server error');
    });
  });

  describe('getById', () => {
    it('fetches a single role by ID', async () => {
      const mockRole = createMockRole({id: 'role-123', name: 'Werewolf'});
      mockApiClient.get.mockResolvedValue({data: mockRole});

      const result = await rolesApi.getById('role-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles/role-123');
      expect(result).toEqual(mockRole);
    });

    it('handles UUID format IDs', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const mockRole = createMockRole({id: uuid});
      mockApiClient.get.mockResolvedValue({data: mockRole});

      await rolesApi.getById(uuid);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/roles/${uuid}`);
    });

    it('propagates 404 errors', async () => {
      const error = {
        response: {status: 404},
        message: 'Not found',
      };
      mockApiClient.get.mockRejectedValue(error);

      await expect(rolesApi.getById('nonexistent')).rejects.toEqual(error);
    });

    it('returns Role object with full details', async () => {
      const mockRole = createMockRole({id: 'role-123'});
      mockApiClient.get.mockResolvedValue({data: mockRole});

      const result = await rolesApi.getById('role-123');

      expect(result.id).toBe('role-123');
      expect(result.name).toBeDefined();
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
