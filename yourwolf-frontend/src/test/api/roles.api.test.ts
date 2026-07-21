import {describe, it, expect, vi, beforeEach} from 'vitest';
import {rolesApi} from '../../api/roles';
import {createMockRoles, createMockRole, createMockDraft, createMockPreviewResponse} from '../mocks';
import {RoleListItem} from '../../types/transport';

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

  describe('previewScript', () => {
    it('posts only preview-relevant fields to /roles/preview-script', async () => {
      const draft = createMockDraft({name: 'Seer', wake_order: 4, wake_target: 'player.self'});
      const previewResponse = createMockPreviewResponse();
      mockApiClient.post.mockResolvedValue({data: previewResponse});

      const result = await rolesApi.previewScript(draft);

      const [url, payload] = mockApiClient.post.mock.calls[0];
      expect(url).toBe('/roles/preview-script');
      // Should only send preview-relevant fields, not description/team/votes etc.
      expect(payload).toEqual({
        name: 'Seer',
        wake_order: 4,
        wake_target: 'player.self',
        ability_steps: [],
      });
      expect(payload).not.toHaveProperty('description');
      expect(payload).not.toHaveProperty('team');
      expect(payload).not.toHaveProperty('votes');
      expect(payload).not.toHaveProperty('win_conditions');
      expect(result).toEqual(previewResponse);
    });

    it('returns empty actions for non-waking role', async () => {
      const draft = createMockDraft({name: 'Villager', wake_order: null});
      const emptyPreview = createMockPreviewResponse({actions: []});
      mockApiClient.post.mockResolvedValue({data: emptyPreview});

      const result = await rolesApi.previewScript(draft);

      expect(result.actions).toEqual([]);
    });
  });
});
