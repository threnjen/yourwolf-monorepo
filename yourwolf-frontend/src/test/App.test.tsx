import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {App} from '../App';
import {useRoles} from '../hooks/useRoles';
import {useRepositories} from '../context/repository_context';

// Mock useRoles to avoid actual API calls
vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

vi.mock('../context/repository_context', () => ({
  RepositoryProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useRepositories: vi.fn(),
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;
const mockUseRepositories = useRepositories as ReturnType<typeof vi.fn>;

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoles.mockReturnValue({
      roles: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseRepositories.mockReturnValue({repositories: {}, loading: false, error: null});
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const {container} = renderApp();
      expect(container).toBeInTheDocument();
    });

    it('keeps the navigation shell visible while bootstrap is pending', () => {
      mockUseRepositories.mockReturnValue({repositories: null, loading: true, error: null});
      renderApp();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Loading local catalog');
      expect(screen.queryByText(/Welcome to Your/)).not.toBeInTheDocument();
    });

    it('shows the bootstrap failure without rendering catalog routes', () => {
      mockUseRepositories.mockReturnValue({repositories: null, loading: false, error: 'IndexedDB blocked'});
      renderApp();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('IndexedDB blocked');
      expect(screen.queryByText(/Welcome to Your/)).not.toBeInTheDocument();
    });
  });
});
