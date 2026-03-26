import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {App} from '../App';
import {useRoles} from '../hooks/useRoles';

// Mock useRoles to avoid actual API calls
vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;

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
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const {container} = renderApp();
      expect(container).toBeInTheDocument();
    });

    it('renders Layout wrapper', () => {
      const {container} = renderApp();
      expect(container.querySelector('.app-container')).toBeInTheDocument();
    });
  });
});
