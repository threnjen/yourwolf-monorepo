import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {RoleBuilderPage} from '../../pages/RoleBuilder';
import {useRoles} from '../../hooks/useRoles';
import {useAbilities} from '../../hooks/useAbilities';
import {useRepositories} from '../../context/repository_context';
import {buildPreview} from '../../engine/narration';
import {adaptDraftToEngine} from '../../adapters/role_adapters';
import {createMockAbility, createMockDraft} from '../mocks';

vi.mock('../../hooks/useRoles', () => ({useRoles: vi.fn()}));
vi.mock('../../hooks/useAbilities', () => ({useAbilities: vi.fn()}));
vi.mock('../../context/repository_context', () => ({useRepositories: vi.fn()}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {...actual, useNavigate: () => mockNavigate};
});

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;
const mockUseAbilities = useAbilities as ReturnType<typeof vi.fn>;
const mockUseRepositories = useRepositories as ReturnType<typeof vi.fn>;
const mockRolesPut = vi.fn();

function renderPage() {
  return render(<MemoryRouter><RoleBuilderPage /></MemoryRouter>);
}

async function settleValidation() {
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  await act(async () => {});
}

async function navigateToReview() {
  fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Test Role'}});
  await settleValidation();
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
  fireEvent.click(screen.getByRole('button', {name: /add condition/i}));
  fireEvent.click(screen.getByLabelText(/primary win condition/i));
  await settleValidation();
  fireEvent.click(screen.getByRole('button', {name: /next/i}));
}

describe('RoleBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseRoles.mockReturnValue({roles: [], loading: false, error: null, refetch: vi.fn()});
    mockUseAbilities.mockReturnValue({abilities: [], loading: false, error: null});
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

  it('renders the builder heading and steps', () => {
    renderPage();
    expect(screen.getByText(/Create New Role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Abilities/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Review/i})).toBeInTheDocument();
  });

  it('uses local validation after the 1000ms debounce and keeps preview local', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});
    expect(screen.getByText(/Generating preview/i)).toBeInTheDocument();
    await settleValidation();

    const expected = buildPreview(adaptDraftToEngine(createMockDraft({name: 'Seer', wake_order: 4})));
    for (const action of expected) {
      expect(screen.getByText(action.instruction)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Validation service unavailable/i)).not.toBeInTheDocument();
  });

  it('waits for roles and abilities before publishing validation', async () => {
    mockUseRoles.mockReturnValue({roles: [], loading: true, error: null, refetch: vi.fn()});
    mockUseAbilities.mockReturnValue({abilities: [], loading: true, error: null});
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/Validating/i)).toBeInTheDocument();
  });

  it('validates the latest draft when both catalogs become ready', async () => {
    const rolesState = {roles: [], loading: true, error: null, refetch: vi.fn()};
    const abilitiesState = {abilities: [], loading: true, error: null};
    mockUseRoles.mockReturnValue(rolesState);
    mockUseAbilities.mockReturnValue(abilitiesState);
    const view = renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
    mockUseRoles.mockReturnValue({...rolesState, loading: false});
    mockUseAbilities.mockReturnValue({abilities: [], loading: false, error: null});
    view.rerender(<MemoryRouter><RoleBuilderPage /></MemoryRouter>);
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.queryByText(/Validating/i)).not.toBeInTheDocument();
    expect(screen.getByText(/At least one win condition/i)).toBeInTheDocument();
  });

  it('combines collision and domain errors with length precedence', async () => {
    mockUseRoles.mockReturnValue({
      roles: [{name: 'Taken Role'}],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Taken Role'}});
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/Name is already taken/)).toBeInTheDocument();
    expect(screen.getByText(/At least one win condition/i)).toBeInTheDocument();
    expect(screen.queryByText(/Validation service unavailable/i)).not.toBeInTheDocument();
  });

  it('suppresses collision for a trimmed 51-character name only when length is invalid', async () => {
    mockUseRoles.mockReturnValue({
      roles: [{name: 'x'.repeat(51)}],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    const name = 'x'.repeat(51);
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: name}});
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/Role name must be at most 50 characters/i)).toBeInTheDocument();
    expect(screen.queryByText(/Name is already taken/)).not.toBeInTheDocument();
  });

  it('keeps all save defenses and rechecks the repository immediately before put', async () => {
    mockUseRepositories.mockReturnValue({
      repositories: {roles: {list: vi.fn().mockResolvedValue([{name: 'Test Role'}]), put: mockRolesPut}},
      loading: false,
      error: null,
    });
    renderPage();
    await navigateToReview();
    fireEvent.click(screen.getByRole('button', {name: /create role/i}));
    await act(async () => {});
    expect(screen.getByText(/Name is already taken/i)).toBeInTheDocument();
    expect(mockRolesPut).not.toHaveBeenCalled();
  });

  it('saves a valid local role and navigates after persistence succeeds', async () => {
    mockUseAbilities.mockReturnValue({abilities: [createMockAbility()], loading: false, error: null});
    renderPage();
    await navigateToReview();
    expect(screen.getByRole('button', {name: /create role/i})).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: /create role/i}));
    await act(async () => {});
    expect(mockRolesPut).toHaveBeenCalledWith(expect.objectContaining({name: 'Test Role'}));
    expect(mockNavigate).toHaveBeenCalledWith('/roles');
  });
});
