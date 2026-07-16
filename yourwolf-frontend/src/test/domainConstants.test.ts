import {describe, it, expect} from 'vitest';
import {
  ABILITY_CATEGORIES,
  MODIFIERS,
  MODIFIER_LABELS,
  STRING_TARGET_OPTIONS,
} from '../domain/constants';

describe('domain/constants MODIFIER_LABELS', () => {
  it('labels every step modifier exactly as the components previously did', () => {
    expect(MODIFIER_LABELS).toEqual({
      none: '—',
      and: 'And then',
      or: 'Or instead',
      if: 'Only if',
    });
  });

  it('covers every modifier in MODIFIERS with a non-empty label', () => {
    for (const modifier of MODIFIERS) {
      expect(MODIFIER_LABELS[modifier]).toBeTruthy();
    }
  });
});

describe('domain/constants ABILITY_CATEGORIES', () => {
  it('preserves the five categories, their labels, and their ability types', () => {
    expect(ABILITY_CATEGORIES).toEqual([
      {id: 'card', label: 'Card Actions', types: ['view_card', 'swap_card', 'take_card', 'flip_card', 'copy_role']},
      {id: 'info', label: 'Information', types: ['view_awake', 'thumbs_up', 'explicit_no_view']},
      {id: 'physical', label: 'Physical', types: ['rotate_all', 'touch']},
      {id: 'state', label: 'State Changes', types: ['change_to_team', 'perform_as', 'perform_immediately', 'stop']},
      {id: 'other', label: 'Other', types: ['random_num_players']},
    ]);
  });

  it('gives every category a unique id', () => {
    const ids = ABILITY_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('domain/constants STRING_TARGET_OPTIONS', () => {
  it('preserves the target options exactly, in order', () => {
    expect(STRING_TARGET_OPTIONS).toEqual([
      'player.self',
      'player.other',
      'center.main',
      'center.bonus',
      'previous',
      'viewed',
      'team.werewolf',
      'team.vampire',
      'team.alien',
      'team.village',
      'role.mason',
      'players.actions',
    ]);
  });
});
