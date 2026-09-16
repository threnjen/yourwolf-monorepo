import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {GameFacilitatorPage} from '../../pages/GameFacilitator';
import {RepositoryProvider} from '../../context/repository_context';
import type {GameSnapshot, IndexedDbRepositories} from '../../data';
import type {GameSession} from '../../engine/gameSession';
import type {EngineRoleInput} from '../../engine/types';

const role: EngineRoleInput = {
  id: 'role-1', name: 'Werewolf', team: 'werewolf', wake_order: 1,
  wake_target: null, min_count: 1, max_count: 2,
  is_primary_team_role: true, ability_steps: [],
};

const snapshots = new Map<string, GameSnapshot>();
const mockGamesGet = vi.fn(async (id: string) => snapshots.get(id) ?? null);
const mockGamesPut = vi.fn(async (snapshot: GameSnapshot) => {
  snapshots.set(snapshot.session.id, snapshot);
});

function createRepositories(): IndexedDbRepositories {
  return {
    roles: {} as IndexedDbRepositories['roles'],
    abilities: {} as IndexedDbRepositories['abilities'],
    games: {get: mockGamesGet, put: mockGamesPut},
    metadata: {} as IndexedDbRepositories['metadata'],
    bootstrap: vi.fn(),
    reseed: vi.fn(),
    close: vi.fn(),
  };
}

function makeGame(phase: GameSession['phase'], warnings: readonly string[] = []): GameSession {
  return {
    id: 'game-123', player_count: 3, center_card_count: 1,
    discussion_timer_seconds: 300, role_ids: ['role-1', 'role-1', 'role-1', 'role-1'],
    wake_order_sequence: ['role-1'], phase, current_wake_order: phase === 'night' ? 0 : null, warnings,
  };
}

function renderFacilitator(game: GameSession | null = makeGame('setup')) {
  if (game !== null) snapshots.set(game.id, {session: game, roles: [role]});
  return render(
    <MemoryRouter initialEntries={['/games/game-123']}>
      <RepositoryProvider repositories={createRepositories()}>
        <Routes><Route path="/games/:gameId" element={<GameFacilitatorPage />} /></Routes>
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

function renderFacilitatorWithoutParam() {
  return render(
    <MemoryRouter initialEntries={['/games/']}>
      <GameFacilitatorPage />
    </MemoryRouter>,
  );
}

describe('GameFacilitatorPage', () => {
  beforeEach(() => {
    snapshots.clear();
    mockGamesGet.mockImplementation(async (id: string) => snapshots.get(id) ?? null);
    mockGamesPut.mockImplementation(async (snapshot: GameSnapshot) => {
      snapshots.set(snapshot.session.id, snapshot);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows a setup link for a missing game', async () => {
    renderFacilitator(null);
    await waitFor(() => expect(screen.getByText('Game not found')).toBeInTheDocument());
    expect(screen.getByRole('link', {name: 'New Game Setup'})).toHaveAttribute('href', '/games/new');
  });

  it('shows a setup link when the game id route parameter is missing', () => {
    renderFacilitatorWithoutParam();
    expect(screen.getByText('Game not found')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'New Game Setup'})).toHaveAttribute('href', '/games/new');
  });

  it('shows loading while the stored snapshot is being read', async () => {
    renderFacilitator(makeGame('setup'));
    expect(screen.getByText('Loading game...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
  });

  it('treats corrupt storage as a missing game with setup recovery', async () => {
    mockGamesGet.mockResolvedValue(null);
    renderFacilitator(null);
    await waitFor(() => expect(screen.getByText('Game not found')).toBeInTheDocument());
    expect(screen.getByRole('link', {name: 'New Game Setup'})).toHaveAttribute('href', '/games/new');
  });

  it('renders setup warnings only when present', async () => {
    const warningView = renderFacilitator(makeGame('setup', ['Werewolf works best with Seer in the game']));
    await waitFor(() => expect(screen.getByText('Setup warnings')).toBeInTheDocument());
    expect(screen.getByText('Werewolf works best with Seer in the game')).toBeInTheDocument();
    warningView.unmount();
    snapshots.clear();
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    expect(screen.queryByTestId('setup-warnings')).not.toBeInTheDocument();
  });

  it('starts locally and persists the night phase', async () => {
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Begin Night Phase'));
    await waitFor(() => expect(screen.getByText(/NIGHT Phase/i)).toBeInTheDocument());
    expect(snapshots.get('game-123')?.session.phase).toBe('night');
  });

  it('keeps setup visible while the start write is pending', async () => {
    mockGamesPut.mockImplementation(() => new Promise<void>(() => undefined));
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Begin Night Phase'));
    await waitFor(() => expect(mockGamesPut).toHaveBeenCalled());
    expect(screen.getByText(/SETUP Phase/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'NIGHT Phase'})).not.toBeInTheDocument();
  });

  it('advances discussion locally', async () => {
    renderFacilitator(makeGame('discussion'));
    await waitFor(() => expect(screen.getByText('Skip to Voting')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Skip to Voting'));
    await waitFor(() => expect(screen.getByRole('heading', {name: 'VOTING Phase'})).toBeInTheDocument());
  });

  it('keeps discussion visible while the advance write is pending', async () => {
    mockGamesPut.mockImplementation(() => new Promise<void>(() => undefined));
    renderFacilitator(makeGame('discussion'));
    await waitFor(() => expect(screen.getByText('Skip to Voting')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Skip to Voting'));
    await waitFor(() => expect(mockGamesPut).toHaveBeenCalled());
    expect(screen.getByText(/DISCUSSION Phase/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'VOTING Phase'})).not.toBeInTheDocument();
  });

  it('keeps the previous phase when a transition write fails', async () => {
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    mockGamesPut.mockRejectedValueOnce(new Error('Storage unavailable'));
    fireEvent.click(screen.getByText('Begin Night Phase'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Storage unavailable'));
    expect(screen.getByText(/SETUP Phase/i)).toBeInTheDocument();
  });

  it('keeps the previous phase when an advance write fails', async () => {
    renderFacilitator(makeGame('discussion'));
    await waitFor(() => expect(screen.getByText('Skip to Voting')).toBeInTheDocument());
    mockGamesPut.mockRejectedValueOnce(new Error('Storage unavailable'));
    fireEvent.click(screen.getByText('Skip to Voting'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Storage unavailable'));
    expect(screen.getByText(/DISCUSSION Phase/i)).toBeInTheDocument();
    expect(loadStoredPhase()).toBe('discussion');
  });

  it('rebuilds the night script after a refresh and resets the reader index', async () => {
    const rendered = renderFacilitator(makeGame('night'));
    await waitFor(() => expect(screen.getByText('Everyone, close your eyes.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText(/Werewolf, wake up/)).toBeInTheDocument();

    rendered.unmount();
    renderFacilitator(makeGame('night'));
    await waitFor(() => expect(screen.getByText('Everyone, close your eyes.')).toBeInTheDocument());
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('reloads the voting and resolution phases', async () => {
    const voting = renderFacilitator(makeGame('voting'));
    await waitFor(() => expect(screen.getByText('Reveal Results')).toBeInTheDocument());
    voting.unmount();

    renderFacilitator(makeGame('resolution'));
    await waitFor(() => expect(screen.getByText('Complete Game')).toBeInTheDocument());
  });

  it('keeps completed sessions on refresh', async () => {
    renderFacilitator(makeGame('complete'));
    await waitFor(() => expect(screen.getByText('Game Over')).toBeInTheDocument());
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.queryByText('Leave Game')).not.toBeInTheDocument();
  });
});

function loadStoredPhase(): GameSession['phase'] | null {
  return snapshots.get('game-123')?.session.phase ?? null;
}
