import {describe, it, expect} from 'vitest';
import {TEAM_ORDER, sortRolesByTeam, groupRolesByTeam} from '../utils/roleSort';
import {createMockOfficialRole} from './mocks';
import type {Team} from '../types/role';

describe('roleSort', () => {
  describe('TEAM_ORDER', () => {
    it('defines canonical ordering: village, werewolf, vampire, alien, neutral', () => {
      expect(TEAM_ORDER).toEqual(['village', 'werewolf', 'vampire', 'alien', 'neutral']);
    });
  });

  describe('sortRolesByTeam', () => {
    it('returns an empty array when given an empty array', () => {
      expect(sortRolesByTeam([])).toEqual([]);
    });

    it('sorts roles by canonical team order', () => {
      const roles = [
        createMockOfficialRole('Tanner', 'neutral'),
        createMockOfficialRole('Werewolf', 'werewolf', 1),
        createMockOfficialRole('Villager', 'village'),
        createMockOfficialRole('Vampire', 'vampire'),
        createMockOfficialRole('Alien', 'alien'),
      ];

      const sorted = sortRolesByTeam(roles);

      expect(sorted.map((r) => r.team)).toEqual([
        'village',
        'werewolf',
        'vampire',
        'alien',
        'neutral',
      ]);
    });

    it('preserves original order within the same team', () => {
      const roles = [
        createMockOfficialRole('Seer', 'village', 4),
        createMockOfficialRole('Villager', 'village'),
        createMockOfficialRole('Robber', 'village', 4),
      ];

      const sorted = sortRolesByTeam(roles);

      expect(sorted.map((r) => r.name)).toEqual(['Seer', 'Villager', 'Robber']);
    });

    it('does not mutate the original array', () => {
      const roles = [
        createMockOfficialRole('Tanner', 'neutral'),
        createMockOfficialRole('Villager', 'village'),
      ];
      const original = [...roles];

      sortRolesByTeam(roles);

      expect(roles).toEqual(original);
    });

    it('places unknown teams after all known teams', () => {
      const roles = [
        createMockOfficialRole('Mystery', 'unknown' as Team),
        createMockOfficialRole('Villager', 'village'),
      ];

      const sorted = sortRolesByTeam(roles);

      expect(sorted.map((r) => r.name)).toEqual(['Villager', 'Mystery']);
    });
  });

  describe('groupRolesByTeam', () => {
    it('returns an empty array when given an empty array', () => {
      expect(groupRolesByTeam([])).toEqual([]);
    });

    it('groups roles by team with team label headers', () => {
      const roles = [
        createMockOfficialRole('Villager', 'village'),
        createMockOfficialRole('Werewolf', 'werewolf', 1),
        createMockOfficialRole('Tanner', 'neutral'),
      ];

      const groups = groupRolesByTeam(roles);

      expect(groups).toHaveLength(3);
      expect(groups[0]).toEqual({team: 'village', roles: [roles[0]]});
      expect(groups[1]).toEqual({team: 'werewolf', roles: [roles[1]]});
      expect(groups[2]).toEqual({team: 'neutral', roles: [roles[2]]});
    });

    it('groups multiple roles of the same team together', () => {
      const roles = [
        createMockOfficialRole('Villager', 'village'),
        createMockOfficialRole('Seer', 'village', 4),
        createMockOfficialRole('Werewolf', 'werewolf', 1),
      ];

      const groups = groupRolesByTeam(roles);

      expect(groups).toHaveLength(2);
      expect(groups[0].team).toBe('village');
      expect(groups[0].roles).toHaveLength(2);
      expect(groups[1].team).toBe('werewolf');
      expect(groups[1].roles).toHaveLength(1);
    });

    it('sorts roles by team order before grouping', () => {
      const roles = [
        createMockOfficialRole('Tanner', 'neutral'),
        createMockOfficialRole('Werewolf', 'werewolf', 1),
        createMockOfficialRole('Villager', 'village'),
      ];

      const groups = groupRolesByTeam(roles);

      expect(groups.map((g) => g.team)).toEqual(['village', 'werewolf', 'neutral']);
    });
  });
});
