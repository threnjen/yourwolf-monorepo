import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {RoleBuilderPage} from '../pages/RoleBuilder';
import {rolesApi} from '../api/roles';

vi.mock('../api/roles', () => ({
  rolesApi: {
    list: vi.fn(),
    listOfficial: vi.fn(),
    getById: vi.fn(),
    validate: vi.fn(),
    checkName: vi.fn(),
    create: vi.fn(),
    previewScript: vi.fn(),
  },
}));

vi.mock('../api/abilities', () => ({
  abilitiesApi: {
    list: vi.fn().mockResolvedValue([]),
  },
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
  previewScript: ReturnType<typeof vi.fn>;
};

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
    mockRolesApi.previewScript.mockResolvedValue({actions: []});
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
      const mockRole = {id: 'new-role-id', name: 'Test', team: 'village'};
      mockRolesApi.create.mockResolvedValue(mockRole);
      renderPage();
      await navigateToReview();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      });
      await act(async () => {});
      expect(mockNavigate).toHaveBeenCalledWith('/roles');
    });

    it('shows error message when create fails', async () => {
      mockRolesApi.create.mockRejectedValue(new Error('Server error'));
      renderPage();
      await navigateToReview();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      });
      await act(async () => {});
      expect(screen.getByText(/Error creating role/i)).toBeInTheDocument();
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
  });

  describe('preview (AC3, AC7)', () => {
    it('calls previewScript after debounce on draft change', async () => {
      mockRolesApi.previewScript.mockResolvedValue({actions: []});
      renderPage();

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});

      // Before debounce fires
      expect(mockRolesApi.previewScript).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      expect(mockRolesApi.previewScript).toHaveBeenCalledTimes(1);
    });

    it('only fires one preview call within debounce window', async () => {
      mockRolesApi.previewScript.mockResolvedValue({actions: []});
      renderPage();

      // Rapid changes
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'S'}});
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Se'}});
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      // Only the last debounced call should fire
      expect(mockRolesApi.previewScript).toHaveBeenCalledTimes(1);
    });

    it('gracefully handles preview API failure', async () => {
      mockRolesApi.previewScript.mockRejectedValue(new Error('Network error'));
      renderPage();

      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {});

      // Preview should degrade gracefully — panel still present, no crash
      expect(screen.getByTestId('narrator-preview')).toBeInTheDocument();
      expect(screen.getByText(/no narrator instructions/i)).toBeInTheDocument();
    });
  });
});
