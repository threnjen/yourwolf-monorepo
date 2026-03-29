import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {WakeOrderResolutionPage} from '../pages/WakeOrderResolution';
import {createMockOfficialRole, createMockGameSession} from './mocks';
import type {RoleListItem} from '../types/role';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/games', () => ({
  gamesApi: {
    create: vi.fn(),
  },
}));

import {gamesApi} from '../api/games';

const mockCreate = gamesApi.create as ReturnType<typeof vi.fn>;

function renderWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{pathname: '/games/new/wake-order', state}]}>
      <WakeOrderResolutionPage />
    </MemoryRouter>,
  );
}

function makeState(roles: RoleListItem[], selectedRoleCounts?: Record<string, number>) {
  const counts = selectedRoleCounts ?? Object.fromEntries(roles.map((r) => [r.id, 1]));
  return {
    playerCount: 5,
    centerCount: 3,
    timerSeconds: 300,
    selectedRoleCounts: counts,
    roles,
  };
}

describe('WakeOrderResolutionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('redirect without state', () => {
    it('redirects to /games/new when Router state is missing', () => {
      render(
        <MemoryRouter initialEntries={['/games/new/wake-order']}>
          <WakeOrderResolutionPage />
        </MemoryRouter>,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/games/new', {replace: true});
    });
  });

  describe('tile rendering', () => {
    it('only shows waking roles (wake_order > 0) as tiles', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const villager = createMockOfficialRole('Villager', 'village'); // no wake_order
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);

      renderWithState(makeState([seer, villager, werewolf]));

      expect(screen.getByText('Seer')).toBeInTheDocument();
      expect(screen.getByText('Werewolf')).toBeInTheDocument();
      expect(screen.queryByText('Villager')).not.toBeInTheDocument();
    });

    it('deduplicates copies of the same role into one tile', () => {
      const werewolf: RoleListItem = {
        ...createMockOfficialRole('Werewolf', 'werewolf', 1),
        default_count: 2,
        min_count: 1,
        max_count: 2,
      };

      renderWithState(makeState([werewolf], {[werewolf.id]: 2}));

      const tiles = screen.getAllByTestId('wake-tile');
      const werewolfTiles = tiles.filter((t) => t.textContent?.includes('Werewolf'));
      expect(werewolfTiles).toHaveLength(1);
    });

    it('displays tile with role name and team-colored border', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      renderWithState(makeState([seer]));

      const tile = screen.getByTestId('wake-tile');
      expect(tile).toHaveTextContent('Seer');
      // Check that the tile has a left border (team color applied via inline style)
      expect(tile.style.borderLeft).toContain('4px solid');
    });
  });

  describe('initial grouping and conflict detection', () => {
    it('tiles are sorted by wake_order initially', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const minion = createMockOfficialRole('Minion', 'werewolf', 2);

      renderWithState(makeState([seer, werewolf, minion]));

      const tiles = screen.getAllByTestId('wake-tile');
      expect(tiles[0]).toHaveTextContent('Werewolf');
      expect(tiles[1]).toHaveTextContent('Minion');
      expect(tiles[2]).toHaveTextContent('Seer');
    });

    it('shows conflict message when roles share the same wake_order', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);

      renderWithState(makeState([seer, robber]));

      expect(screen.getByText('Resolve wake order conflicts to start the game')).toBeInTheDocument();
    });

    it('"Start Game" is disabled when conflicts exist', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);

      renderWithState(makeState([seer, robber]));

      const button = screen.getByText('Start Game');
      expect(button).toBeDisabled();
    });
  });

  describe('no conflicts', () => {
    it('"Start Game" enabled when all roles have unique wake_order', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);

      renderWithState(makeState([werewolf, seer]));

      const button = screen.getByText('Start Game');
      expect(button).not.toBeDisabled();
    });
  });

  describe('no waking roles', () => {
    it('"Start Game" is enabled immediately when no waking roles selected', () => {
      const villager = createMockOfficialRole('Villager', 'village');
      const tanner = createMockOfficialRole('Tanner', 'neutral');

      renderWithState(makeState([villager, tanner]));

      const button = screen.getByText('Start Game');
      expect(button).not.toBeDisabled();
    });

    it('shows message about no waking roles', () => {
      const villager = createMockOfficialRole('Villager', 'village');

      renderWithState(makeState([villager]));

      expect(screen.getByText(/No waking roles selected/)).toBeInTheDocument();
    });
  });

  describe('game creation', () => {
    it('clicking "Start Game" calls gamesApi.create with wake_order_sequence', async () => {
      const mockGame = createMockGameSession({id: 'game-abc'});
      mockCreate.mockResolvedValue(mockGame);

      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);

      renderWithState(makeState([werewolf, seer]));

      const user = userEvent.setup();
      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            player_count: 5,
            center_card_count: 3,
            discussion_timer_seconds: 300,
            role_ids: expect.arrayContaining([werewolf.id, seer.id]),
            wake_order_sequence: [werewolf.id, seer.id],
          }),
        );
      });
    });

    it('navigates to /games/{id} after successful game creation', async () => {
      const mockGame = createMockGameSession({id: 'game-xyz'});
      mockCreate.mockResolvedValue(mockGame);

      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      renderWithState(makeState([werewolf]));

      const user = userEvent.setup();
      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/games/game-xyz');
      });
    });

    it('shows error on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      renderWithState(makeState([werewolf]));

      const user = userEvent.setup();
      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('does not send wake_order_sequence when no waking roles', async () => {
      const mockGame = createMockGameSession({id: 'game-empty'});
      mockCreate.mockResolvedValue(mockGame);

      const villager = createMockOfficialRole('Villager', 'village');
      renderWithState(makeState([villager]));

      const user = userEvent.setup();
      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            wake_order_sequence: undefined,
          }),
        );
      });
    });
  });
});
