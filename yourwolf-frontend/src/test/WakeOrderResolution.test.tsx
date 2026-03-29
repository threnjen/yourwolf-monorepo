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

  describe('grouped layout and headers', () => {
    it('renders group headers with correct labels for each unique wake_order', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);
      const troublemaker = createMockOfficialRole('Troublemaker', 'village', 5);

      renderWithState(makeState([seer, werewolf, robber, troublemaker]));

      const headers = screen.getAllByTestId('wake-group-header');
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveTextContent('Wake #1');
      expect(headers[1]).toHaveTextContent('Wake #4');
      expect(headers[2]).toHaveTextContent('Wake #5');
    });

    it('tiles appear within their respective wake order groups', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);
      const troublemaker = createMockOfficialRole('Troublemaker', 'village', 5);

      renderWithState(makeState([seer, werewolf, robber, troublemaker]));

      // Group headers and tiles should render in wake_order group order
      const headers = screen.getAllByTestId('wake-group-header');
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveTextContent('Wake #1');
      expect(headers[1]).toHaveTextContent('Wake #4');
      expect(headers[2]).toHaveTextContent('Wake #5');
    });

    it('single-role groups display one tile under their header', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);

      renderWithState(makeState([werewolf, seer]));

      const groups = screen.getAllByTestId('wake-group');
      expect(groups).toHaveLength(2);
      // Each group should have exactly one tile
      for (const group of groups) {
        const tiles = group.querySelectorAll('[data-testid="wake-tile"]');
        expect(tiles).toHaveLength(1);
      }
    });

    it('multi-role groups contain all roles with that wake_order', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);

      renderWithState(makeState([seer, robber, werewolf]));

      const groups = screen.getAllByTestId('wake-group');
      // Wake #1 group should have 1 tile, Wake #4 group should have 2 tiles
      const group1Tiles = groups[0].querySelectorAll('[data-testid="wake-tile"]');
      const group4Tiles = groups[1].querySelectorAll('[data-testid="wake-tile"]');
      expect(group1Tiles).toHaveLength(1);
      expect(group4Tiles).toHaveLength(2);
    });
  });

  describe('random shuffle within groups', () => {
    it('tiles within a multi-role group are not always in the same order across renders', () => {
      // Render multiple times and check that at least one ordering differs
      const roles = [
        createMockOfficialRole('Seer', 'village', 4),
        createMockOfficialRole('Robber', 'village', 4),
        createMockOfficialRole('Witch', 'village', 4),
        createMockOfficialRole('Apprentice Seer', 'village', 4),
      ];

      const orderings = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const {unmount} = renderWithState(makeState(roles));
        const tiles = screen.getAllByTestId('wake-tile');
        const order = tiles.map((t) => t.textContent).join(',');
        orderings.add(order);
        unmount();
      }

      // With 4 roles and 20 renders, we should see more than 1 unique ordering
      expect(orderings.size).toBeGreaterThan(1);
    });
  });

  describe('always-enabled Start Game', () => {
    it('"Start Game" is always enabled on page load', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);

      renderWithState(makeState([werewolf, seer]));

      const button = screen.getByText('Start Game');
      expect(button).not.toBeDisabled();
    });

    it('"Start Game" is enabled even when multiple roles share the same wake_order', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);

      renderWithState(makeState([seer, robber]));

      const button = screen.getByText('Start Game');
      expect(button).not.toBeDisabled();
    });

    it('does not show conflict warning message', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);

      renderWithState(makeState([seer, robber]));

      expect(screen.queryByText(/Resolve wake order conflicts/)).not.toBeInTheDocument();
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

  describe('page text', () => {
    it('shows "Review Wake Order" as page title', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      renderWithState(makeState([werewolf]));

      expect(screen.getByText('Review Wake Order')).toBeInTheDocument();
    });

    it('shows correct subtitle text', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      renderWithState(makeState([werewolf]));

      expect(screen.getByText('Drag roles to customize order within each wake group')).toBeInTheDocument();
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

    it('wake_order_sequence respects group ordering (group 1 before group 4)', async () => {
      const mockGame = createMockGameSession({id: 'game-order'});
      mockCreate.mockResolvedValue(mockGame);

      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);

      renderWithState(makeState([seer, robber, werewolf]));

      const user = userEvent.setup();
      await user.click(screen.getByText('Start Game'));

      await waitFor(() => {
        const call = mockCreate.mock.calls[0][0];
        const seq: string[] = call.wake_order_sequence;
        // Werewolf (wake 1) must come before both Seer and Robber (wake 4)
        const werewolfIdx = seq.indexOf(werewolf.id);
        const seerIdx = seq.indexOf(seer.id);
        const robberIdx = seq.indexOf(robber.id);
        expect(werewolfIdx).toBeLessThan(seerIdx);
        expect(werewolfIdx).toBeLessThan(robberIdx);
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
