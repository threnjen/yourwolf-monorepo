import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {Roles} from '../pages/Roles';
import {useRoles} from '../hooks/useRoles';
import {createMockRoles} from './mocks';

// Mock the useRoles hook
vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;

function renderRoles() {
  return render(
    <BrowserRouter>
      <Roles />
    </BrowserRouter>,
  );
}

describe('Roles Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator when loading', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.getByText('Loading roles...')).toBeInTheDocument();
    });

    it('does not show roles grid when loading', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.queryByText('Official Roles')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message when error occurs', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: false,
        error: 'Failed to connect to server',
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.getByText(/Error loading roles:/)).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('shows help text for server connection', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: false,
        error: 'Network error',
        refetch: vi.fn(),
      });

      renderRoles();

      expect(
        screen.getByText(/Make sure the backend server is running/),
      ).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('displays page title', () => {
      mockUseRoles.mockReturnValue({
        roles: createMockRoles(3),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.getByText('Official Roles')).toBeInTheDocument();
    });

    it('displays page subtitle', () => {
      mockUseRoles.mockReturnValue({
        roles: createMockRoles(3),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(
        screen.getByText(/Browse all official One Night Ultimate Werewolf roles/),
      ).toBeInTheDocument();
    });

    it('renders role cards for each role', () => {
      const mockRoles = createMockRoles(5);
      mockUseRoles.mockReturnValue({
        roles: mockRoles,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      // Each role should be rendered
      mockRoles.forEach((role) => {
        expect(screen.getByText(role.name)).toBeInTheDocument();
      });
    });

    it('renders correct number of role cards', () => {
      const mockRoles = createMockRoles(7);
      mockUseRoles.mockReturnValue({
        roles: mockRoles,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      // Check that we have 7 role headings (h3 elements within cards)
      const headings = screen.getAllByRole('heading', {level: 3});
      expect(headings).toHaveLength(7);
    });
  });

  describe('empty state', () => {
    it('shows empty message when no roles', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.getByText(/No roles found/)).toBeInTheDocument();
    });

    it('shows icon in empty state', () => {
      mockUseRoles.mockReturnValue({
        roles: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderRoles();

      expect(screen.getByText('🎭')).toBeInTheDocument();
    });
  });
});
