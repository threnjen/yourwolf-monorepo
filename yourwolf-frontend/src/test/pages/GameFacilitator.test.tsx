import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {GameFacilitatorPage} from '../../pages/GameFacilitator';
import {saveGameSnapshot} from '../../storage/game_session_storage';
import * as gameStorage from '../../storage/game_session_storage';
import type {GameSession} from '../../engine/gameSession';
import type {EngineRoleInput} from '../../engine/types';

const role: EngineRoleInput = {
  id: 'role-1', name: 'Werewolf', team: 'werewolf', wake_order: 1,
  wake_target: null, min_count: 1, max_count: 2,
  is_primary_team_role: true, ability_steps: [],
};

function makeGame(phase: GameSession['phase'], warnings: readonly string[] = []): GameSession {
  return {
    id: 'game-123', player_count: 3, center_card_count: 1,
    discussion_timer_seconds: 300, role_ids: ['role-1', 'role-1', 'role-1', 'role-1'],
    wake_order_sequence: ['role-1'], phase, current_wake_order: phase === 'night' ? 0 : null, warnings,
  };
}

function renderFacilitator(game: GameSession | null = makeGame('setup')) {
  if (game !== null) saveGameSnapshot({session: game, roles: [role]});
  return render(
    <MemoryRouter initialEntries={['/games/game-123']}>
      <Routes><Route path="/games/:gameId" element={<GameFacilitatorPage />} /></Routes>
    </MemoryRouter>,
  );
}

describe('GameFacilitatorPage', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('shows a setup link for a missing game', async () => {
    renderFacilitator(null);
    await waitFor(() => expect(screen.getByText('Game not found')).toBeInTheDocument());
    expect(screen.getByRole('link', {name: 'New Game Setup'})).toHaveAttribute('href', '/games/new');
  });

  it('renders setup warnings only when present', async () => {
    renderFacilitator(makeGame('setup', ['Werewolf works best with Seer in the game']));
    await waitFor(() => expect(screen.getByText('Setup warnings')).toBeInTheDocument());
    expect(screen.getByText('Werewolf works best with Seer in the game')).toBeInTheDocument();
    sessionStorage.clear();
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getAllByText('Begin Night Phase')).toHaveLength(2));
    expect(screen.getAllByTestId('setup-warnings')).toHaveLength(1);
  });

  it('starts locally and persists the night phase', async () => {
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Begin Night Phase'));
    await waitFor(() => expect(screen.getByText(/NIGHT Phase/i)).toBeInTheDocument());
    expect(JSON.parse(sessionStorage.getItem('yourwolf:game:game-123') ?? '{}').session.phase).toBe('night');
  });

  it('advances discussion locally', async () => {
    renderFacilitator(makeGame('discussion'));
    await waitFor(() => expect(screen.getByText('Skip to Voting')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Skip to Voting'));
    await waitFor(() => expect(screen.getByRole('heading', {name: 'VOTING Phase'})).toBeInTheDocument());
  });

  it('keeps the previous phase when a transition write fails', async () => {
    renderFacilitator(makeGame('setup'));
    await waitFor(() => expect(screen.getByText('Begin Night Phase')).toBeInTheDocument());
    vi.spyOn(gameStorage, 'saveGameSnapshot').mockImplementation(() => { throw new Error('Storage unavailable'); });
    fireEvent.click(screen.getByText('Begin Night Phase'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Storage unavailable'));
    expect(screen.getByText(/SETUP Phase/i)).toBeInTheDocument();
  });

  it('renders the night script from local roles after refresh', async () => {
    renderFacilitator(makeGame('night'));
    await waitFor(() => expect(screen.getByText('Everyone, close your eyes.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText(/Werewolf, wake up/)).toBeInTheDocument();
  });

  it('keeps completed sessions on refresh', async () => {
    renderFacilitator(makeGame('complete'));
    await waitFor(() => expect(screen.getByText('Game Over')).toBeInTheDocument());
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.queryByText('Leave Game')).not.toBeInTheDocument();
  });
});
