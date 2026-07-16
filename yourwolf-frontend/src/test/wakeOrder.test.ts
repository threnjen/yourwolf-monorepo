import {describe, it, expect} from 'vitest';
import {
  shuffleArray,
  collectWakingRoles,
  getWakeGroupKeys,
  buildGroupOrders,
  flattenWakeOrder,
  expandRoleIds,
} from '../domain/wakeOrder';
import type {WakingRole} from '../domain/wakeOrder';
import {createMockOfficialRole} from './mocks';

/** An RNG that replays a fixed script, so shuffles are reproducible. */
function scriptedRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

function makeWaking(id: string, wakeOrder: number): WakingRole {
  return {id, name: id, team: 'village', wake_order: wakeOrder};
}

describe('wakeOrder', () => {
  describe('shuffleArray', () => {
    it('returns an empty array unchanged', () => {
      expect(shuffleArray([], scriptedRng([0]))).toEqual([]);
    });

    it('returns a single-element array unchanged', () => {
      expect(shuffleArray(['a'], scriptedRng([0]))).toEqual(['a']);
    });

    it('preserves the multiset of elements', () => {
      const result = shuffleArray(['a', 'b', 'c', 'd'], scriptedRng([0.1, 0.9, 0.5, 0.3]));
      expect([...result].sort()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('is deterministic for a given RNG (Fisher-Yates, rng always 0)', () => {
      // i=2: j=0 -> [c,b,a]; i=1: j=0 -> [b,c,a]
      expect(shuffleArray(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
      const input = ['a', 'b', 'c'];
      shuffleArray(input, () => 0);
      expect(input).toEqual(['a', 'b', 'c']);
    });

    it('defaults to Math.random when no RNG is injected', () => {
      const result = shuffleArray(['a', 'b', 'c']);
      expect([...result].sort()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('collectWakingRoles', () => {
    it('returns an empty list when nothing is selected', () => {
      expect(collectWakingRoles({}, [])).toEqual([]);
    });

    it('includes only roles with a positive wake_order', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const villager = createMockOfficialRole('Villager', 'village'); // no wake_order

      const result = collectWakingRoles(
        {[werewolf.id]: 1, [villager.id]: 1},
        [werewolf, villager],
      );

      expect(result.map((r) => r.id)).toEqual([werewolf.id]);
    });

    it('excludes roles with a zero wake_order', () => {
      const sleeper = createMockOfficialRole('Sleeper', 'village', 0);
      expect(collectWakingRoles({[sleeper.id]: 1}, [sleeper])).toEqual([]);
    });

    it('excludes roles whose selected count is zero or negative', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      expect(collectWakingRoles({[seer.id]: 0}, [seer])).toEqual([]);
    });

    it('collapses multiple copies of a role into a single waking entry', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const result = collectWakingRoles({[werewolf.id]: 3}, [werewolf]);
      expect(result).toHaveLength(1);
    });

    it('ignores selected ids that are absent from the role list', () => {
      const seer = createMockOfficialRole('Seer', 'village', 4);
      expect(collectWakingRoles({'ghost-id': 1, [seer.id]: 1}, [seer]).map((r) => r.id)).toEqual([
        seer.id,
      ]);
    });

    it('sorts by wake_order ascending', () => {
      const troublemaker = createMockOfficialRole('Troublemaker', 'village', 5);
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      const minion = createMockOfficialRole('Minion', 'werewolf', 2);

      const result = collectWakingRoles(
        {[troublemaker.id]: 1, [werewolf.id]: 1, [minion.id]: 1},
        [troublemaker, werewolf, minion],
      );

      expect(result.map((r) => r.wake_order)).toEqual([1, 2, 5]);
    });

    it('projects id, name, team and wake_order', () => {
      const werewolf = createMockOfficialRole('Werewolf', 'werewolf', 1);
      expect(collectWakingRoles({[werewolf.id]: 1}, [werewolf])).toEqual([
        {id: werewolf.id, name: 'Werewolf', team: 'werewolf', wake_order: 1},
      ]);
    });
  });

  describe('getWakeGroupKeys', () => {
    it('returns an empty list for no waking roles', () => {
      expect(getWakeGroupKeys([])).toEqual([]);
    });

    it('returns unique wake_order values sorted ascending', () => {
      const roles = [makeWaking('a', 4), makeWaking('b', 1), makeWaking('c', 4)];
      expect(getWakeGroupKeys(roles)).toEqual([1, 4]);
    });
  });

  describe('buildGroupOrders', () => {
    it('returns an empty map for no waking roles', () => {
      expect(buildGroupOrders([], () => 0)).toEqual({});
    });

    it('groups role ids by wake_order', () => {
      const roles = [makeWaking('ww', 1), makeWaking('seer', 4), makeWaking('robber', 4)];
      const groups = buildGroupOrders(roles, () => 0);

      expect(Object.keys(groups).map(Number).sort((a, b) => a - b)).toEqual([1, 4]);
      expect(groups[1]).toEqual(['ww']);
      expect([...groups[4]].sort()).toEqual(['robber', 'seer']);
    });

    it('shuffles only within a group — never across groups', () => {
      const roles = [
        makeWaking('a1', 1),
        makeWaking('a2', 1),
        makeWaking('b1', 4),
        makeWaking('b2', 4),
      ];
      const groups = buildGroupOrders(roles, scriptedRng([0.9, 0.1, 0.5, 0.3]));

      expect([...groups[1]].sort()).toEqual(['a1', 'a2']);
      expect([...groups[4]].sort()).toEqual(['b1', 'b2']);
    });

    it('is deterministic for a given RNG', () => {
      const roles = [makeWaking('a', 4), makeWaking('b', 4), makeWaking('c', 4)];
      expect(buildGroupOrders(roles, () => 0)[4]).toEqual(['b', 'c', 'a']);
    });

    it('defaults to Math.random when no RNG is injected', () => {
      const groups = buildGroupOrders([makeWaking('only', 1)]);
      expect(groups[1]).toEqual(['only']);
    });
  });

  describe('flattenWakeOrder', () => {
    it('returns an empty sequence when there are no groups', () => {
      expect(flattenWakeOrder([], {})).toEqual([]);
    });

    it('concatenates groups in ascending group order', () => {
      expect(flattenWakeOrder([1, 4], {1: ['ww'], 4: ['seer', 'robber']})).toEqual([
        'ww',
        'seer',
        'robber',
      ]);
    });

    it('preserves the within-group order it is given', () => {
      expect(flattenWakeOrder([4], {4: ['robber', 'seer']})).toEqual(['robber', 'seer']);
    });

    it('skips group keys that have no entry', () => {
      expect(flattenWakeOrder([1, 2, 4], {1: ['ww'], 4: ['seer']})).toEqual(['ww', 'seer']);
    });
  });

  describe('expandRoleIds', () => {
    it('returns an empty list for an empty selection', () => {
      expect(expandRoleIds({})).toEqual([]);
    });

    it('repeats each role id by its selected count', () => {
      expect(expandRoleIds({ww: 2, seer: 1})).toEqual(['ww', 'ww', 'seer']);
    });

    it('omits roles selected zero times', () => {
      expect(expandRoleIds({ww: 0, seer: 1})).toEqual(['seer']);
    });
  });
});
