import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AppRoutes} from '../routes';
import {useRoles} from '../hooks/useRoles';
import {apiClient} from '../api/client';

// Mock useRoles to avoid actual API calls
vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

vi.mock('../hooks/useAbilities', () => ({
  useAbilities: vi.fn(() => ({abilities: [], loading: false, error: null})),
}));

vi.mock('../context/repository_context', () => ({
  useRepositories: vi.fn(() => ({
    repositories: {
      roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
      abilities: {list: vi.fn()},
      games: {get: vi.fn(), put: vi.fn()},
      metadata: {get: vi.fn()},
      bootstrap: vi.fn(),
      reseed: vi.fn(),
      close: vi.fn(),
    },
    loading: false,
    error: null,
  })),
}));

// Mock rolesApi to avoid actual API calls from RoleBuilderPage
vi.mock('../api/roles', () => ({
  rolesApi: {
    list: vi.fn(),
    validate: vi.fn().mockResolvedValue({is_valid: true, errors: [], warnings: []}),
    checkName: vi.fn(),
    create: vi.fn(),
  },
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;

function renderRoutes(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoles.mockReturnValue({
      roles: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('fails immediately if a test attempts a games request through any HTTP method', () => {
    expect(() => apiClient.get('/games')).toThrow('Forbidden games request');
    expect(() => apiClient.post('/games')).toThrow('Forbidden games request');
    expect(() => apiClient.put('/games')).toThrow('Forbidden games request');
    expect(() => apiClient.patch('/games')).toThrow('Forbidden games request');
    expect(() => apiClient.delete('/games')).toThrow('Forbidden games request');
    expect(() => apiClient.post('/roles/preview-script')).toThrow('Forbidden local preview request');
  });

  it('fails immediately if a test attempts a catalog read through HTTP', () => {
    expect(() => apiClient.get('/roles')).toThrow('Forbidden catalog request');
    expect(() => apiClient.get('/roles/official')).toThrow('Forbidden catalog request');
    expect(() => apiClient.get('/abilities')).toThrow('Forbidden catalog request');
    expect(() => apiClient.post('/roles/validate')).not.toThrow('Forbidden catalog request');
    expect(() => apiClient.get('/roles/check-name')).not.toThrow('Forbidden catalog request');
  });

  describe('home route', () => {
    it('renders Home page at "/" path', () => {
      renderRoutes('/');

      expect(screen.getByText(/Welcome to Your/)).toBeInTheDocument();
    });
  });

  describe('roles route', () => {
    it('renders Roles page at "/roles" path', () => {
      renderRoutes('/roles');

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Roles');
    });
  });

  describe('role builder route', () => {
    it('renders RoleBuilder page at "/roles/new" path', () => {
      renderRoutes('/roles/new');

      expect(screen.getByText(/Create New Role/i)).toBeInTheDocument();
    });
  });

  describe('wake order route', () => {
    it('renders WakeOrderResolution page at "/games/new/wake-order" path with state', () => {
      render(
        <MemoryRouter initialEntries={[{
          pathname: '/games/new/wake-order',
          state: {
            playerCount: 5,
            centerCount: 3,
            timerSeconds: 300,
            selectedRoleCounts: {},
            roles: [],
          },
        }]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByText(/Review Wake Order/i)).toBeInTheDocument();
    });

    it('redirects to /games/new when accessed without state', () => {
      renderRoutes('/games/new/wake-order');

      // Should redirect to /games/new (GameSetup)
      expect(screen.getByText(/New Game Setup/i)).toBeInTheDocument();
    });
  });
});
