import {describe, it, expect} from 'vitest';
import {TEAMS} from '../domain/teams';
import {TEAM_ORDER} from '../utils/roleSort';
import {TEAM_COLORS} from '../styles/theme';

describe('domain/teams single source', () => {
  it('states the five teams exactly once, in canonical sort-significant order', () => {
    expect(TEAMS).toEqual(['village', 'werewolf', 'vampire', 'alien', 'neutral']);
  });

  it('derives TEAM_ORDER to cover exactly the TEAMS array, in the same order', () => {
    expect(TEAM_ORDER).toEqual([...TEAMS]);
  });

  it('derives TEAM_COLORS keys to cover exactly the TEAMS array', () => {
    expect(Object.keys(TEAM_COLORS).sort()).toEqual([...TEAMS].sort());
  });

  it('maps every team to a hex color token', () => {
    for (const team of TEAMS) {
      expect(TEAM_COLORS[team]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
