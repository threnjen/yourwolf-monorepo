import {describe, it, expect} from 'vitest';
import {
  buildRoleMap,
  countSelectedCards,
  removeRoleWithCascade,
  toggleRoleSelection,
  adjustRoleCount,
} from '../domain/roleSelection';
import {createMockOfficialRole} from './mocks';
import type {RoleListItem} from '../types/transport';

function withCounts(role: RoleListItem, defaultCount: number, min: number, max: number): RoleListItem {
  return {...role, default_count: defaultCount, min_count: min, max_count: max};
}

/** Tanner (no deps) + Apprentice Tanner (requires Tanner) — the canonical cascade pair. */
function tannerPair() {
  const tanner = createMockOfficialRole('Tanner', 'neutral');
  const apprentice: RoleListItem = {
    ...createMockOfficialRole('Apprentice Tanner', 'neutral'),
    dependencies: [
      {
        required_role_id: tanner.id,
        required_role_name: 'Tanner',
        dependency_type: 'requires',
      },
    ],
  };
  return {tanner, apprentice, roleMap: buildRoleMap([apprentice, tanner])};
}

describe('roleSelection', () => {
  describe('buildRoleMap', () => {
    it('returns an empty map for an empty role list', () => {
      expect(buildRoleMap([])).toEqual({});
    });

    it('indexes roles by id', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      const robber = createMockOfficialRole('Robber', 'village', 4);
      expect(buildRoleMap([seer, robber])).toEqual({[seer.id]: seer, [robber.id]: robber});
    });
  });

  describe('countSelectedCards', () => {
    it('returns 0 for an empty selection', () => {
      expect(countSelectedCards({})).toBe(0);
    });

    it('sums every selected count', () => {
      expect(countSelectedCards({a: 2, b: 1, c: 3})).toBe(6);
    });
  });

  describe('toggleRoleSelection', () => {
    it('selects an unselected role at its default_count', () => {
      const werewolf = withCounts(createMockOfficialRole('Werewolf', 'werewolf', 1), 2, 1, 2);
      const roleMap = buildRoleMap([werewolf]);

      expect(toggleRoleSelection({}, werewolf.id, roleMap)).toEqual({[werewolf.id]: 2});
    });

    it('deselects an already-selected role', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 1, 1, 3);
      const roleMap = buildRoleMap([villager]);

      expect(toggleRoleSelection({[villager.id]: 1}, villager.id, roleMap)).toEqual({});
    });

    it('returns the selection unchanged when the role is unknown', () => {
      const counts = {'some-id': 1};
      expect(toggleRoleSelection(counts, 'missing-id', buildRoleMap([]))).toBe(counts);
    });

    it('auto-selects a REQUIRES dependency at the required role default_count', () => {
      const {tanner, apprentice, roleMap} = tannerPair();

      expect(toggleRoleSelection({}, apprentice.id, roleMap)).toEqual({
        [apprentice.id]: 1,
        [tanner.id]: 1,
      });
    });

    it('auto-selects a multi-copy dependency at its default_count', () => {
      const werewolf = withCounts(createMockOfficialRole('Werewolf', 'werewolf', 1), 2, 1, 2);
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
      const roleMap = buildRoleMap([minion, werewolf]);

      expect(toggleRoleSelection({}, minion.id, roleMap)).toEqual({
        [minion.id]: 1,
        [werewolf.id]: 2,
      });
    });

    it('silently skips a dependency whose required role is absent from the list', () => {
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
      const roleMap = buildRoleMap([orphan]);

      expect(toggleRoleSelection({}, orphan.id, roleMap)).toEqual({[orphan.id]: 1});
    });

    it('does not auto-select RECOMMENDS dependencies', () => {
      const tanner = createMockOfficialRole('Tanner', 'neutral');
      const fan: RoleListItem = {
        ...createMockOfficialRole('Tanner Fan', 'neutral'),
        dependencies: [
          {
            required_role_id: tanner.id,
            required_role_name: 'Tanner',
            dependency_type: 'recommends',
          },
        ],
      };
      const roleMap = buildRoleMap([fan, tanner]);

      expect(toggleRoleSelection({}, fan.id, roleMap)).toEqual({[fan.id]: 1});
    });

    it('leaves an already-selected dependency at its current count', () => {
      const {tanner, apprentice, roleMap} = tannerPair();

      expect(toggleRoleSelection({[tanner.id]: 3}, apprentice.id, roleMap)).toEqual({
        [tanner.id]: 3,
        [apprentice.id]: 1,
      });
    });

    it('does not mutate the input selection', () => {
      const {apprentice, roleMap} = tannerPair();
      const counts = {};
      toggleRoleSelection(counts, apprentice.id, roleMap);
      expect(counts).toEqual({});
    });
  });

  describe('removeRoleWithCascade', () => {
    it('removes the role itself', () => {
      const {tanner, roleMap} = tannerPair();
      expect(removeRoleWithCascade({[tanner.id]: 1}, tanner.id, roleMap)).toEqual({});
    });

    it('cascade-removes selected roles that REQUIRE the removed role', () => {
      const {tanner, apprentice, roleMap} = tannerPair();

      expect(
        removeRoleWithCascade({[tanner.id]: 1, [apprentice.id]: 1}, tanner.id, roleMap),
      ).toEqual({});
    });

    it('does not remove the required role when the dependent is removed (one-way)', () => {
      const {tanner, apprentice, roleMap} = tannerPair();

      expect(
        removeRoleWithCascade({[tanner.id]: 1, [apprentice.id]: 1}, apprentice.id, roleMap),
      ).toEqual({[tanner.id]: 1});
    });

    it('cascades one level only, leaving a transitive dependent orphaned', () => {
      // A requires B; C requires A. Removing B drops A, but C — which requires the
      // now-absent A — survives. This is the current (pre-extraction) behavior and is
      // pinned deliberately: the cascade re-scans only for dependents of the *removed*
      // role id, not of roles dropped by the cascade itself. Phase 04's engine must
      // reproduce this exactly, or change it as a conscious, tested decision.
      const b = createMockOfficialRole('B', 'village');
      const a: RoleListItem = {
        ...createMockOfficialRole('A', 'village'),
        dependencies: [{required_role_id: b.id, required_role_name: 'B', dependency_type: 'requires'}],
      };
      const c: RoleListItem = {
        ...createMockOfficialRole('C', 'village'),
        dependencies: [{required_role_id: a.id, required_role_name: 'A', dependency_type: 'requires'}],
      };
      const roleMap = buildRoleMap([a, b, c]);

      expect(removeRoleWithCascade({[a.id]: 1, [b.id]: 1, [c.id]: 1}, b.id, roleMap)).toEqual({
        [c.id]: 1,
      });
    });

    it('leaves unrelated roles selected', () => {
      const {tanner, roleMap} = tannerPair();
      const seer = createMockOfficialRole('Seer', 'village', 4);

      expect(
        removeRoleWithCascade({[tanner.id]: 1, [seer.id]: 1}, tanner.id, roleMap),
      ).toEqual({[seer.id]: 1});
    });

    it('does not mutate the input selection', () => {
      const {tanner, apprentice, roleMap} = tannerPair();
      const counts = {[tanner.id]: 1, [apprentice.id]: 1};
      removeRoleWithCascade(counts, tanner.id, roleMap);
      expect(counts).toEqual({[tanner.id]: 1, [apprentice.id]: 1});
    });
  });

  describe('adjustRoleCount', () => {
    it('increments the count', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 1, 1, 3);
      const roleMap = buildRoleMap([villager]);

      expect(adjustRoleCount({[villager.id]: 1}, villager.id, 1, roleMap)).toEqual({
        [villager.id]: 2,
      });
    });

    it('decrements the count', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 3, 1, 3);
      const roleMap = buildRoleMap([villager]);

      expect(adjustRoleCount({[villager.id]: 3}, villager.id, -1, roleMap)).toEqual({
        [villager.id]: 2,
      });
    });

    it('returns the selection unchanged when the increment would exceed max_count', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 3, 1, 3);
      const roleMap = buildRoleMap([villager]);
      const counts = {[villager.id]: 3};

      expect(adjustRoleCount(counts, villager.id, 1, roleMap)).toBe(counts);
    });

    it('removes the role entirely when decremented below min_count', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 1, 1, 3);
      const roleMap = buildRoleMap([villager]);

      expect(adjustRoleCount({[villager.id]: 1}, villager.id, -1, roleMap)).toEqual({});
    });

    it('cascade-removes dependents when decremented below min_count', () => {
      const {tanner, apprentice, roleMap} = tannerPair();

      expect(
        adjustRoleCount({[tanner.id]: 1, [apprentice.id]: 1}, tanner.id, -1, roleMap),
      ).toEqual({});
    });

    it('returns the selection unchanged when the role is unknown', () => {
      const counts = {'some-id': 1};
      expect(adjustRoleCount(counts, 'missing-id', 1, buildRoleMap([]))).toBe(counts);
    });

    it('treats an unselected role as count 0', () => {
      const villager = withCounts(createMockOfficialRole('Villager', 'village'), 1, 1, 3);
      const roleMap = buildRoleMap([villager]);

      expect(adjustRoleCount({}, villager.id, 1, roleMap)).toEqual({[villager.id]: 1});
    });
  });
});
