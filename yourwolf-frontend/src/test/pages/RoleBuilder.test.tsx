import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {RoleBuilderPage} from '../../pages/RoleBuilder';
import {rolesApi} from '../../api/roles';
import {adaptDraftToEngine} from '../../adapters/role_adapters';
import {buildPreview} from '../../engine/narration';
import {createMockDraft} from '../mocks';
import {useRoles} from '../../hooks/useRoles';
import {useRepositories} from '../../context/repository_context';

vi.mock('../../api/roles', () => ({
  rolesApi: {
    list: vi.fn(),
    validate: vi.fn(),
    checkName: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../api/abilities', () => ({
  abilitiesApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../hooks/useAbilities', () => ({
  useAbilities: vi.fn(() => ({abilities: [], loading: false, error: null})),
}));

vi.mock('../../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

vi.mock('../../context/repository_context', () => ({
  useRepositories: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockRolesApi = rolesApi as unknown as {
  validate: ReturnType<typeof vi.fn>;
  checkName: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};
const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;
const mockUseRepositories = useRepositories as ReturnType<typeof vi.fn>;
const mockRolesPut = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <RoleBuilderPage />
    </MemoryRouter>,
  );
}

async function navigateToReview() {
  fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Test Role'}});
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
}

describe('RoleBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockRolesApi.validate.mockResolvedValue({is_valid: true, errors: [], warnings: []});
    mockRolesApi.checkName.mockResolvedValue({name: 'Test Role', is_available: true, message: 'Available'});
    mockUseRoles.mockReturnValue({roles: [], loading: false, error: null, refetch: vi.fn()});
    mockRolesPut.mockResolvedValue(undefined);
    mockUseRepositories.mockReturnValue({
      repositories: {roles: {list: vi.fn().mockResolvedValue([]), put: mockRolesPut}},
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the page heading', () => {
      renderPage();
      expect(screen.getByText(/Create New Role/i)).toBeInTheDocument();
    });

    it('renders the Wizard component', () => {
      renderPage();
      // Wizard is rendered — Basic Info step label should be visible
      expect(screen.getByText(/Basic Info/i)).toBeInTheDocument();
    });

    it('renders step indicator with all steps', () => {
      renderPage();
      expect(screen.getByRole('button', {name: /Abilities/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /Win Conditions/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /Review/i})).toBeInTheDocument();
    });
  });

  describe('create role', () => {
    it('navigates to roles listing after successful create', async () => {
      renderPage();
      await navigateToReview();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      });
      await act(async () => {});
      expect(mockNavigate).toHaveBeenCalledWith('/roles');
      expect(mockRolesPut).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Role',
        visibility: 'private',
        is_locked: false,
        dependencies: [],
      }));
      expect(mockRolesApi.create).not.toHaveBeenCalled();
    });

    it('shows error message when local persistence fails and keeps the draft', async () => {
      mockRolesPut.mockRejectedValue(new Error('Storage error'));
      renderPage();
      await navigateToReview();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      });
      await act(async () => {});
      expect(screen.getByText(/Error creating role/i)).toBeInTheDocument();
      expect(screen.getByText('Test Role')).toBeInTheDocument();
      expect(mockRolesApi.create).not.toHaveBeenCalled();
    });

    it('blocks local and server writes for a case-insensitive local name collision', async () => {
      mockUseRoles.mockReturnValue({
        roles: [{name: 'test role'}],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });
      renderPage();
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Test Role'}});
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();
      expect(mockRolesApi.validate).not.toHaveBeenCalled();
      expect(screen.getByText('Taken ✗')).toBeInTheDocument();
      expect(mockRolesPut).not.toHaveBeenCalled();
      expect(mockRolesApi.create).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('sets fallback validation when validate call fails', async () => {
      mockRolesApi.validate.mockRejectedValue(new Error('Network error'));
      renderPage();
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Test'}});
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByText(/Validation service unavailable/i)).toBeInTheDocument();
    });

    it('surfaces the server field message when validate rejects with a 422', async () => {
      // An over-long name is the reachable out-of-bounds case: the wizard only gates
      // on a 2-character minimum, so a name past the server's 50-character limit
      // walks straight to Review and comes back as a pydantic 422.
      // Body is verbatim FastAPI output for name length 60 against max_length=50.
      mockRolesApi.validate.mockRejectedValue(
        Object.assign(new Error('Request failed with status code 422'), {
          isAxiosError: true,
          response: {
            status: 422,
            data: {
              detail: [
                {
                  type: 'string_too_long',
                  loc: ['body', 'name'],
                  msg: 'String should have at most 50 characters',
                  input: 'x'.repeat(60),
                  ctx: {max_length: 50},
                },
              ],
            },
          },
        }),
      );
      renderPage();
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'x'.repeat(60)}});
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));

      expect(
        screen.getByText(/name: String should have at most 50 characters/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Validation service unavailable/i)).not.toBeInTheDocument();
    });
  });

  describe('local preview', () => {
    it('renders the engine preview after debounce while validation remains server-backed', async () => {
      renderPage();

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
      fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});

      // Before debounce fires
      expect(screen.getByText(/Generating preview/i)).toBeInTheDocument();
      expect(mockRolesApi.validate).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      const expected = buildPreview(adaptDraftToEngine(createMockDraft({name: 'Seer', wake_order: 4})));
      for (const action of expected) {
        expect(screen.getByText(action.instruction)).toBeInTheDocument();
      }
      expect(mockRolesApi.validate).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.validate).toHaveBeenCalledWith(expect.objectContaining({name: 'Seer', wake_order: 4}));
    });

    it('renders only the newest draft after rapid edits within one debounce window', async () => {
      renderPage();

      // Rapid changes
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'S'}});
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Se'}});
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
      fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      expect(screen.getByText('Seer, wake up.')).toBeInTheDocument();
      expect(screen.queryByText('S, wake up.')).not.toBeInTheDocument();
      expect(mockRolesApi.validate).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.validate).toHaveBeenCalledWith(expect.objectContaining({name: 'Seer'}));
    });

    it('keeps the newest validation when an older validation resolves late', async () => {
      let resolveFirst: ((value: {is_valid: boolean; errors: string[]; warnings: string[]}) => void) | undefined;
      let resolveSecond: ((value: {is_valid: boolean; errors: string[]; warnings: string[]}) => void) | undefined;
      mockRolesApi.validate
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
      renderPage();

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'First'}});

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Newest'}});
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      await act(async () => {
        resolveFirst?.({is_valid: false, errors: ['stale'], warnings: []});
      });
      expect(screen.queryByText(/stale/)).not.toBeInTheDocument();

      await act(async () => {
        resolveSecond?.({is_valid: false, errors: ['newest'], warnings: []});
      });

      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByText(/newest/)).toBeInTheDocument();
      expect(screen.queryByText(/stale/)).not.toBeInTheDocument();
      expect(mockRolesApi.validate).toHaveBeenCalledTimes(2);
    });

    it('renders an empty preview for a non-waking draft without a preview error state', async () => {
      renderPage();

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Villager'}});

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      expect(screen.getByText(/does not wake up — no narrator instructions/i)).toBeInTheDocument();
      expect(screen.queryByText(/preview service unavailable|preview failed/i)).not.toBeInTheDocument();
    });
  });
});
