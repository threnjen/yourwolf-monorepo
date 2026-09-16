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
import {installNoNetworkGuard} from '../test_utils';

vi.mock('../../hooks/useRoles', () => ({useRoles: vi.fn()}));
vi.mock('../../hooks/useAbilities', () => ({useAbilities: vi.fn()}));
vi.mock('../../context/repository_context', () => ({useRepositories: vi.fn()}));

const mockNavigate = vi.fn();
const wizardProbe = vi.hoisted(() => ({validation: null as unknown}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {...actual, useNavigate: () => mockNavigate};
});

vi.mock('../../components/RoleBuilder/Wizard', async () => {
  const actual = await vi.importActual<typeof import('../../components/RoleBuilder/Wizard')>(
    '../../components/RoleBuilder/Wizard',
  );
  function ObservedWizard(props: Parameters<typeof actual.Wizard>[0]) {
    wizardProbe.validation = props.validation;
    return actual.Wizard(props);
  }
  return {...actual, Wizard: ObservedWizard};
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
    wizardProbe.validation = null;
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
    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByText(/Generating preview/i)).toBeInTheDocument();
    expect(screen.queryByText('Seer, wake up.')).not.toBeInTheDocument();
    await settleValidation();

    const expected = buildPreview(adaptDraftToEngine(createMockDraft({name: 'Seer', wake_order: 4})));
    for (const action of expected) {
      expect(screen.getByText(action.instruction)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Validation service unavailable/i)).not.toBeInTheDocument();
  });

  it('proves draft validation, name status, and preview stay offline', async () => {
    mockUseAbilities.mockReturnValue({abilities: [createMockAbility()], loading: false, error: null});
    const networkGuard = installNoNetworkGuard();
    try {
      renderPage();
      fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Offline Role'}});
      fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});
      await settleValidation();

      expect(screen.getByText('Available ✓')).toBeInTheDocument();
      expect(screen.getByText('Offline Role, wake up.')).toBeInTheDocument();
      expect(wizardProbe.validation).toMatchObject({
        is_valid: false,
        errors: expect.arrayContaining(['At least one win condition is required.']),
      });
      expect(screen.queryByText(/Validation service unavailable/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      fireEvent.click(screen.getByRole('button', {name: /add condition/i}));
      fireEvent.click(screen.getByLabelText(/primary win condition/i));
      await settleValidation();
      fireEvent.click(screen.getByRole('button', {name: /next/i}));
      expect(screen.getByRole('button', {name: /create role/i})).not.toBeDisabled();
      fireEvent.click(screen.getByRole('button', {name: /create role/i}));
      await act(async () => {});
      expect(mockRolesPut).toHaveBeenCalledWith(expect.objectContaining({name: 'Offline Role'}));
      expect(mockNavigate).toHaveBeenCalledWith('/roles');

      expect(networkGuard.getFetchAttempts()).toBe(0);
      expect(networkGuard.getXhrAttempts()).toBe(0);
      networkGuard.assertNoRequests();
    } finally {
      networkGuard.restore();
    }
  });

  it('fails at the browser request boundary and restores globals after assertion failure', async () => {
    const originalFetch = globalThis.fetch;
    const originalXmlHttpRequest = globalThis.XMLHttpRequest;
    const networkGuard = installNoNetworkGuard();
    try {
      await expect(globalThis.fetch('/unexpected')).rejects.toThrow('Unexpected browser request: fetch');

      const request = new globalThis.XMLHttpRequest();
      request.open('GET', '/unexpected');
      expect(() => request.send()).toThrow('Unexpected browser request: XMLHttpRequest');

      expect(networkGuard.getFetchAttempts()).toBe(1);
      expect(networkGuard.getXhrAttempts()).toBe(1);
      expect(() => networkGuard.assertNoRequests()).toThrow(
        'Unexpected browser requests: fetch=1, XMLHttpRequest=1',
      );
    } finally {
      networkGuard.restore();
    }

    expect(globalThis.fetch).toBe(originalFetch);
    expect(globalThis.XMLHttpRequest).toBe(originalXmlHttpRequest);
  });

  it('cancels pending preview and validation work on unmount', () => {
    const view = renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Unmounted Role'}});
    expect(vi.getTimerCount()).toBe(2);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
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
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'a'}});
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Latest Role'}});
    mockUseRoles.mockReturnValue({...rolesState, loading: false});
    mockUseAbilities.mockReturnValue({abilities: [], loading: false, error: null});
    view.rerender(<MemoryRouter><RoleBuilderPage /></MemoryRouter>);
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.queryByText(/Validating/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/at least 2 characters/i)).not.toBeInTheDocument();
    expect(screen.getByText(/At least one win condition/i)).toBeInTheDocument();
  });

  it('clears pending validation when a catalog becomes unavailable', async () => {
    const view = renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Transient Role'}});
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});

    mockUseAbilities.mockReturnValue({abilities: [], loading: true, error: null});
    view.rerender(<MemoryRouter><RoleBuilderPage /></MemoryRouter>);

    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/Validating/i)).toBeInTheDocument();
    expect(screen.getByText('Transient Role, wake up.')).toBeInTheDocument();
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

  it('renders local domain warnings alongside a valid validation result', async () => {
    mockUseAbilities.mockReturnValue({abilities: [createMockAbility()], loading: false, error: null});
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Warning Role'}});
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});
    await settleValidation();

    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    const abilityButton = screen.getByRole('button', {name: /view card/i});
    for (let index = 0; index < 6; index += 1) {
      fireEvent.click(abilityButton);
    }
    await settleValidation();

    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /add condition/i}));
    fireEvent.click(screen.getByLabelText(/primary win condition/i));
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));

    expect(screen.getByText(/more than 5 ability steps/i)).toBeInTheDocument();
  });

  it('suppresses collision for a trimmed 51-character name only when length is invalid', async () => {
    mockUseRoles.mockReturnValue({
      roles: [{name: 'x'.repeat(51)}],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    const name = `  ${'x'.repeat(51)}  `;
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: name}});
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/Role name must be at most 50 characters/i)).toBeInTheDocument();
    expect(screen.queryByText(/Name is already taken/)).not.toBeInTheDocument();
  });

  it('suppresses collision for a one-character name that matches a local role', async () => {
    mockUseRoles.mockReturnValue({
      roles: [{name: 'a'}],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'a'}});
    await settleValidation();
    expect(wizardProbe.validation).toMatchObject({
      is_valid: false,
      errors: expect.arrayContaining(['Role name must be at least 2 characters.']),
    });
    expect(wizardProbe.validation).not.toMatchObject({
      errors: expect.arrayContaining(['Name is already taken']),
    });
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

  it('rechecks the repeated save gate before reading the repository', async () => {
    const rolesList = vi.fn().mockResolvedValue([]);
    mockUseRepositories.mockReturnValue({
      repositories: {roles: {list: rolesList, put: mockRolesPut}},
      loading: false,
      error: null,
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Valid Role'}});
    await settleValidation();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /next/i}));

    const createButton = screen.getByRole('button', {name: /create role/i});
    expect(createButton).toBeDisabled();
    createButton.removeAttribute('disabled');
    fireEvent.click(createButton);
    await act(async () => {});
    expect(rolesList).not.toHaveBeenCalled();
    expect(mockRolesPut).not.toHaveBeenCalled();
  });

  it('keeps the draft when local persistence fails', async () => {
    mockUseAbilities.mockReturnValue({abilities: [createMockAbility()], loading: false, error: null});
    mockRolesPut.mockRejectedValue(new Error('Storage error'));
    renderPage();
    await navigateToReview();
    fireEvent.click(screen.getByRole('button', {name: /create role/i}));
    await act(async () => {});
    expect(screen.getByText(/Error creating role: Storage error/i)).toBeInTheDocument();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
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

  it('keeps preview generation independent of validation readiness for a non-waking role', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Villager'}});
    await settleValidation();
    expect(screen.getByText(/does not wake up — no narrator instructions/i)).toBeInTheDocument();
    expect(screen.queryByText(/preview service unavailable|preview failed/i)).not.toBeInTheDocument();
  });

  it('renders only the newest preview after rapid draft edits', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'S'}});
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Se'}});
    fireEvent.change(screen.getByLabelText(/name/i), {target: {value: 'Seer'}});
    fireEvent.change(screen.getByLabelText(/wake order/i), {target: {value: '4'}});
    await settleValidation();
    expect(screen.getByText('Seer, wake up.')).toBeInTheDocument();
    expect(screen.queryByText('S, wake up.')).not.toBeInTheDocument();
  });
});
