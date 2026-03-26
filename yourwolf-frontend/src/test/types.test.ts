import {describe, it, expect} from 'vitest';
import type {Team, Visibility, StepModifier, Role, RoleListItem, AbilityStep, WinCondition} from '../types/role';

describe('Role types', () => {
  describe('Team type', () => {
    it('accepts valid team values', () => {
      const teams: Team[] = ['village', 'werewolf', 'vampire', 'alien', 'neutral'];
      expect(teams).toHaveLength(5);
    });
  });

  describe('Visibility type', () => {
    it('accepts valid visibility values', () => {
      const visibilities: Visibility[] = ['private', 'public', 'official'];
      expect(visibilities).toHaveLength(3);
    });
  });

  describe('StepModifier type', () => {
    it('accepts valid modifier values', () => {
      const modifiers: StepModifier[] = ['none', 'and', 'or', 'if'];
      expect(modifiers).toHaveLength(4);
    });
  });

  describe('RoleListItem interface', () => {
    it('validates required fields', () => {
      const role: RoleListItem = {
        id: 'test-id',
        name: 'Test Role',
        description: 'Test description',
        team: 'village',
        visibility: 'official',
        vote_score: 0,
        use_count: 0,
        default_count: 1,
        min_count: 1,
        max_count: 1,
        dependencies: [],
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(role.id).toBe('test-id');
      expect(role.name).toBe('Test Role');
      expect(role.team).toBe('village');
      expect(role.visibility).toBe('official');
    });

    it('accepts description field', () => {
      const role: RoleListItem = {
        id: 'test-id',
        name: 'Test Role',
        description: 'A test description',
        team: 'werewolf',
        visibility: 'public',
        vote_score: 5,
        use_count: 10,
        default_count: 1,
        min_count: 1,
        max_count: 1,
        dependencies: [],
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(role.description).toBe('A test description');
    });

    it('accepts optional wake_order', () => {
      const role: RoleListItem = {
        id: 'test-id',
        name: 'Test Role',
        description: 'Test description',
        team: 'village',
        wake_order: 3,
        visibility: 'official',
        vote_score: 10,
        use_count: 5,
        default_count: 1,
        min_count: 1,
        max_count: 1,
        dependencies: [],
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(role.wake_order).toBe(3);
    });
  });

  describe('AbilityStep interface', () => {
    it('validates required fields', () => {
      const step: AbilityStep = {
        id: 'step-1',
        order: 1,
        modifier: 'none',
        is_required: true,
        parameters: {},
        ability_type: 'look',
        ability_name: 'Look at Card',
      };

      expect(step.id).toBe('step-1');
      expect(step.order).toBe(1);
      expect(step.modifier).toBe('none');
      expect(step.is_required).toBe(true);
    });

    it('accepts optional condition fields', () => {
      const step: AbilityStep = {
        id: 'step-1',
        order: 1,
        modifier: 'if',
        is_required: false,
        parameters: {target: 'center'},
        condition_type: 'player_count',
        condition_params: {min: 5},
        ability_type: 'swap',
        ability_name: 'Conditional Swap',
      };

      expect(step.condition_type).toBe('player_count');
      expect(step.condition_params).toEqual({min: 5});
    });
  });

  describe('WinCondition interface', () => {
    it('validates required fields', () => {
      const condition: WinCondition = {
        id: 'win-1',
        condition_type: 'team_wins',
        is_primary: true,
        overrides_team: false,
      };

      expect(condition.id).toBe('win-1');
      expect(condition.condition_type).toBe('team_wins');
      expect(condition.is_primary).toBe(true);
      expect(condition.overrides_team).toBe(false);
    });

    it('accepts optional condition_params', () => {
      const condition: WinCondition = {
        id: 'win-1',
        condition_type: 'survives',
        condition_params: {target: 'self'},
        is_primary: false,
        overrides_team: true,
      };

      expect(condition.condition_params).toEqual({target: 'self'});
    });
  });

  describe('Role interface', () => {
    it('validates full role object', () => {
      const role: Role = {
        id: 'role-123',
        name: 'Werewolf',
        description: 'A scary werewolf',
        team: 'werewolf',
        wake_order: 1,
        wake_target: 'other werewolves',
        votes: 1,
        visibility: 'official',
        is_locked: true,
        vote_score: 100,
        use_count: 500,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ability_steps: [],
        win_conditions: [],
      };

      expect(role.id).toBe('role-123');
      expect(role.name).toBe('Werewolf');
      expect(role.is_locked).toBe(true);
      expect(role.ability_steps).toEqual([]);
      expect(role.win_conditions).toEqual([]);
    });

    it('accepts nested ability_steps and win_conditions', () => {
      const role: Role = {
        id: 'role-456',
        name: 'Seer',
        team: 'village',
        votes: 1,
        visibility: 'official',
        is_locked: true,
        vote_score: 50,
        use_count: 300,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ability_steps: [
          {
            id: 'step-1',
            order: 1,
            modifier: 'none',
            is_required: true,
            parameters: {},
            ability_type: 'look',
            ability_name: 'Look at Card',
          },
        ],
        win_conditions: [
          {
            id: 'win-1',
            condition_type: 'team_wins',
            is_primary: true,
            overrides_team: false,
          },
        ],
      };

      expect(role.ability_steps).toHaveLength(1);
      expect(role.win_conditions).toHaveLength(1);
    });
  });
});
