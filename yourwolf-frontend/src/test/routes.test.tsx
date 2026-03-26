import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AppRoutes} from '../routes';
import {useRoles} from '../hooks/useRoles';

// Mock useRoles to avoid actual API calls
vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
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

  describe('home route', () => {
    it('renders Home page at "/" path', () => {
      renderRoutes('/');

      expect(screen.getByText(/Welcome to Your/)).toBeInTheDocument();
    });
  });

  describe('roles route', () => {
    it('renders Roles page at "/roles" path', () => {
      renderRoutes('/roles');

      expect(screen.getByText('Official Roles')).toBeInTheDocument();
    });
  });
});
