import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {GameSetupPage} from '../pages/GameSetup';
import {useRoles} from '../hooks/useRoles';
import {gamesApi} from '../api/games';
import {createMockOfficialRole} from './mocks';
import type {RoleListItem} from '../types/role';

vi.mock('../hooks/useRoles', () => ({
  useRoles: vi.fn(),
}));

vi.mock('../api/games', () => ({
  gamesApi: {
    create: vi.fn(),
  },
}));

const mockUseRoles = useRoles as ReturnType<typeof vi.fn>;

function renderGameSetup() {
  return render(
    <BrowserRouter>
      <GameSetupPage />
    </BrowserRouter>,
  );
}

function setupWithRoles(roles: RoleListItem[]) {
  mockUseRoles.mockReturnValue({
    roles,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe('GameSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoles.mockReturnValue({
      roles: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('input clamping', () => {
    describe('playerCount', () => {
      it('does not clamp on change — allows typing freely', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: '2'}});
        expect(input).toHaveValue(2);
      });

      it('clamps value below minimum up to 3 on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: '2'}});
        fireEvent.blur(input);
        expect(input).toHaveValue(3);
      });

      it('clamps value above maximum down to 20 on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: '21'}});
        fireEvent.blur(input);
        expect(input).toHaveValue(20);
      });

      it('clamps empty input to minimum on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Players');
        fireEvent.change(input, {target: {value: ''}});
        fireEvent.blur(input);
        expect(input).toHaveValue(3);
      });
    });

    describe('centerCount', () => {
      it('does not clamp on change', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Center Cards');
        fireEvent.change(input, {target: {value: '-1'}});
        expect(input).toHaveValue(-1);
      });

      it('clamps value below minimum up to 0 on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Center Cards');
        fireEvent.change(input, {target: {value: '-1'}});
        fireEvent.blur(input);
        expect(input).toHaveValue(0);
      });

      it('clamps value above maximum down to 5 on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Center Cards');
        fireEvent.change(input, {target: {value: '6'}});
        fireEvent.blur(input);
        expect(input).toHaveValue(5);
      });
    });

    describe('timerSeconds', () => {
      it('allows mid-edit without clamping', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Discussion Timer (seconds)');
        fireEvent.change(input, {target: {value: '1'}});
        expect(input).toHaveValue(1);
      });

      it('clamps value below minimum up to 60 on blur', () => {
        renderGameSetup();
        const input = screen.getByLabelText('Discussion Timer (seconds)');
        fireEvent.change(input, {target: {value: '30'}});
        fireEvent.blur(input);
        expect(input).toHaveValue(60);
      });
    });
  });

  describe('multi-copy role selection', () => {
    it('clicking a role with default_count=2 adds 2 to the total count', () => {
      const werewolf: RoleListItem = {
        ...createMockOfficialRole('Werewolf', 'werewolf', 1),
        default_count: 2,
        min_count: 1,
        max_count: 2,
      };
      setupWithRoles([werewolf]);
      renderGameSetup();

      fireEvent.click(
        screen.getByRole('heading', {name: 'Werewolf'}).closest('[data-role-id]')!,
      );
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });

    it('clicking an already-selected role removes it', () => {
      const werewolf: RoleListItem = {
        ...createMockOfficialRole('Werewolf', 'werewolf', 1),
        default_count: 2,
        min_count: 1,
        max_count: 2,
      };
      setupWithRoles([werewolf]);
      renderGameSetup();

      const card = screen.getByRole('heading', {name: 'Werewolf'}).closest('[data-role-id]')!;
      fireEvent.click(card); // select
      fireEvent.click(card); // deselect
      expect(screen.getByText(/0 \//)).toBeInTheDocument();
    });

    it('+ button increments count', () => {
      const villager: RoleListItem = {
        ...createMockOfficialRole('Villager', 'village'),
        default_count: 1,
        min_count: 1,
        max_count: 3,
      };
      setupWithRoles([villager]);
      renderGameSetup();

      fireEvent.click(screen.getByText('Villager').closest('[data-role-id]')!);
      fireEvent.click(screen.getByLabelText('Increase Villager count'));
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });

    it('- button decrements count', () => {
      const villager: RoleListItem = {
        ...createMockOfficialRole('Villager', 'village'),
        default_count: 3,
        min_count: 1,
        max_count: 3,
      };
      setupWithRoles([villager]);
      renderGameSetup();

      fireEvent.click(screen.getByText('Villager').closest('[data-role-id]')!);
      // starts at 3
      fireEvent.click(screen.getByLabelText('Decrease Villager count'));
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });

    it('+ button disabled at max_count', () => {
      const villager: RoleListItem = {
        ...createMockOfficialRole('Villager', 'village'),
        default_count: 3,
        min_count: 1,
        max_count: 3,
      };
      setupWithRoles([villager]);
      renderGameSetup();

      fireEvent.click(screen.getByText('Villager').closest('[data-role-id]')!);
      const plusBtn = screen.getByLabelText('Increase Villager count');
      expect(plusBtn).toBeDisabled();
    });

    it('- at min_count removes role entirely', () => {
      const villager: RoleListItem = {
        ...createMockOfficialRole('Villager', 'village'),
        default_count: 1,
        min_count: 1,
        max_count: 3,
      };
      setupWithRoles([villager]);
      renderGameSetup();

      fireEvent.click(screen.getByText('Villager').closest('[data-role-id]')!);
      // count = 1 = min_count, clicking - should remove entirely
      fireEvent.click(screen.getByLabelText('Decrease Villager count'));
      expect(screen.getByText(/0 \//)).toBeInTheDocument();
    });

    it('Mason (min=max=2) adds 2 and removes 2 atomically; no +/- buttons visible', () => {
      const mason: RoleListItem = {
        ...createMockOfficialRole('Mason', 'village', 3),
        default_count: 2,
        min_count: 2,
        max_count: 2,
      };
      setupWithRoles([mason]);
      renderGameSetup();

      // Select
      fireEvent.click(screen.getByText('Mason').closest('[data-role-id]')!);
      expect(screen.getByText(/2 \//)).toBeInTheDocument();

      // No +/- buttons
      expect(screen.queryByLabelText('Increase Mason count')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Decrease Mason count')).not.toBeInTheDocument();

      // Deselect
      fireEvent.click(screen.getByText('Mason').closest('[data-role-id]')!);
      expect(screen.getByText(/0 \//)).toBeInTheDocument();
    });
  });

  describe('dependency auto-selection', () => {
    it('selecting role with REQUIRES dependency auto-selects the required role', () => {
      const tanner: RoleListItem = {
        ...createMockOfficialRole('Tanner', 'neutral'),
        dependencies: [],
      };
      const apprenticeTanner: RoleListItem = {
        ...createMockOfficialRole('Apprentice Tanner', 'neutral'),
        dependencies: [
          {
            required_role_id: tanner.id,
            required_role_name: 'Tanner',
            dependency_type: 'requires',
          },
        ],
      };
      setupWithRoles([apprenticeTanner, tanner]);
      renderGameSetup();

      fireEvent.click(
        screen.getByText('Apprentice Tanner').closest('[data-role-id]')!,
      );
      // Both should be selected: 1 + 1 = 2 total
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });

    it('removing required role cascade-removes dependent', () => {
      const tanner: RoleListItem = {
        ...createMockOfficialRole('Tanner', 'neutral'),
        dependencies: [],
      };
      const apprenticeTanner: RoleListItem = {
        ...createMockOfficialRole('Apprentice Tanner', 'neutral'),
        dependencies: [
          {
            required_role_id: tanner.id,
            required_role_name: 'Tanner',
            dependency_type: 'requires',
          },
        ],
      };
      setupWithRoles([apprenticeTanner, tanner]);
      renderGameSetup();

      // Select Apprentice Tanner (auto-selects Tanner)
      fireEvent.click(
        screen.getByText('Apprentice Tanner').closest('[data-role-id]')!,
      );
      expect(screen.getByText(/2 \//)).toBeInTheDocument();

      // Remove Tanner → should cascade-remove Apprentice Tanner
      fireEvent.click(screen.getByText('Tanner').closest('[data-role-id]')!);
      expect(screen.getByText(/0 \//)).toBeInTheDocument();
    });

    it('removing dependent does NOT remove required (one-way)', () => {
      const tanner: RoleListItem = {
        ...createMockOfficialRole('Tanner', 'neutral'),
        dependencies: [],
      };
      const apprenticeTanner: RoleListItem = {
        ...createMockOfficialRole('Apprentice Tanner', 'neutral'),
        dependencies: [
          {
            required_role_id: tanner.id,
            required_role_name: 'Tanner',
            dependency_type: 'requires',
          },
        ],
      };
      setupWithRoles([apprenticeTanner, tanner]);
      renderGameSetup();

      // Select Apprentice Tanner (auto-selects Tanner)
      fireEvent.click(
        screen.getByText('Apprentice Tanner').closest('[data-role-id]')!,
      );
      expect(screen.getByText(/2 \//)).toBeInTheDocument();

      // Remove Apprentice Tanner → Tanner should stay
      fireEvent.click(
        screen.getByText('Apprentice Tanner').closest('[data-role-id]')!,
      );
      expect(screen.getByText(/1 \//)).toBeInTheDocument();
    });

    it('silently skips dependency when required role is not in fetched list', () => {
      const orphan: RoleListItem = {
        ...createMockOfficialRole('Orphan Role', 'neutral'),
        dependencies: [
          {
            required_role_id: 'non-existent-id',
            required_role_name: 'Ghost Role',
            dependency_type: 'requires',
          },
        ],
      };
      setupWithRoles([orphan]);
      renderGameSetup();

      fireEvent.click(
        screen.getByText('Orphan Role').closest('[data-role-id]')!,
      );
      // Only the orphan itself should be selected (1 card)
      expect(screen.getByText(/1 \//)).toBeInTheDocument();
    });

    it('auto-selects multi-copy dependency at its default_count', () => {
      const werewolf: RoleListItem = {
        ...createMockOfficialRole('Werewolf', 'werewolf', 1),
        default_count: 2,
        min_count: 1,
        max_count: 2,
        dependencies: [],
      };
      const minion: RoleListItem = {
        ...createMockOfficialRole('Minion', 'werewolf', 2),
        dependencies: [
          {
            required_role_id: werewolf.id,
            required_role_name: 'Werewolf',
            dependency_type: 'requires',
          },
        ],
      };
      setupWithRoles([minion, werewolf]);
      renderGameSetup();

      fireEvent.click(
        screen.getByText('Minion').closest('[data-role-id]')!,
      );
      // Minion=1 + Werewolf=2 (its default_count) = 3 total
      expect(screen.getByText(/3 \//)).toBeInTheDocument();
    });
  });

  describe('API submission', () => {
    it('submits role_ids with duplicated IDs for multi-copy roles', async () => {
      const mockCreate = gamesApi.create as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue({id: 'game-1'});

      const werewolf: RoleListItem = {
        ...createMockOfficialRole('Werewolf', 'werewolf', 1),
        default_count: 2,
        min_count: 1,
        max_count: 2,
        dependencies: [],
      };
      const seer: RoleListItem = {
        ...createMockOfficialRole('Seer', 'village', 4),
        default_count: 1,
        min_count: 1,
        max_count: 1,
        dependencies: [],
      };
      setupWithRoles([werewolf, seer]);
      renderGameSetup();

      // Set player=2, center=1 so total=3
      fireEvent.change(screen.getByLabelText('Players'), {target: {value: '3'}});
      fireEvent.blur(screen.getByLabelText('Players'));
      fireEvent.change(screen.getByLabelText('Center Cards'), {target: {value: '0'}});
      fireEvent.blur(screen.getByLabelText('Center Cards'));

      // Select Werewolf (2) + Seer (1) = 3 cards = totalCardsNeeded
      fireEvent.click(screen.getByRole('heading', {name: 'Werewolf'}).closest('[data-role-id]')!);
      fireEvent.click(screen.getByRole('heading', {name: 'Seer'}).closest('[data-role-id]')!);

      fireEvent.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            role_ids: expect.arrayContaining([werewolf.id, werewolf.id, seer.id]),
          }),
        );
      });
      const calledRoleIds = mockCreate.mock.calls[0][0].role_ids;
      expect(calledRoleIds).toHaveLength(3);
      expect(calledRoleIds.filter((id: string) => id === werewolf.id)).toHaveLength(2);
      expect(calledRoleIds.filter((id: string) => id === seer.id)).toHaveLength(1);
    });
  });
});
