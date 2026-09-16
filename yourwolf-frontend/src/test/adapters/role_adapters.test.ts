import {describe, expect, it} from 'vitest';
import {buildPreview} from '../../engine/narration';
import {
  adaptDependenciesToEngine,
  adaptDraftToEngine,
  adaptRoleToEngine,
  type RoleDetailAdapterInput,
  type RoleListItemAdapterInput,
} from '../../adapters/role_adapters';
import type {RoleDraft} from '../../domain/roleDraft';

const listItem: RoleListItemAdapterInput = {
  id: 'role-seer',
  name: 'Seer',
  team: 'village',
  wake_order: 4,
  min_count: 1,
  max_count: 2,
  is_primary_team_role: false,
  dependencies: [
    {
      required_role_id: 'role-villager',
      required_role_name: 'Villager',
      dependency_type: 'recommends',
    },
  ],
};

const detail: RoleDetailAdapterInput = {
  wake_target: null,
  ability_steps: [
    {
      ability_type: null,
      order: 1,
      modifier: 'none',
      is_required: true,
      parameters: {},
    },
    {
      ability_type: 'view_card',
      order: 2,
      modifier: 'and',
      is_required: true,
      parameters: {target: 'player.other'},
    },
  ],
};

const draft: RoleDraft = {
  id: 'draft-seer',
  name: 'Seer',
  description: 'Looks at a card.',
  team: 'village',
  wake_order: null,
  wake_target: null,
  votes: 1,
  is_primary_team_role: false,
  ability_steps: [],
  win_conditions: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('role adapters', () => {
  it('merges list metadata and detail fields into engine input', () => {
    const result = adaptRoleToEngine(listItem, detail);

    expect(result).toEqual({
      id: 'role-seer',
      name: 'Seer',
      team: 'village',
      wake_order: 4,
      wake_target: null,
      min_count: 1,
      max_count: 2,
      is_primary_team_role: false,
      ability_steps: [
        {
          ability_type: 'unknown',
          order: 1,
          modifier: 'none',
          is_required: true,
          parameters: {},
        },
        {
          ability_type: 'view_card',
          order: 2,
          modifier: 'and',
          is_required: true,
          parameters: {target: 'player.other'},
        },
      ],
    });
    expect(buildPreview(result)).toEqual([
      {order: 1, instruction: 'Seer, wake up.', is_section_header: false},
      {
        order: 2,
        instruction: "You may look at one other player's card.",
        is_section_header: false,
      },
      {order: 3, instruction: 'Seer, close your eyes.', is_section_header: false},
    ]);
  });

  it('normalizes absent nullable fields and preserves an empty step list', () => {
    const result = adaptRoleToEngine(
      {...listItem, wake_order: undefined},
      {ability_steps: [], wake_target: undefined},
    );

    expect(result.wake_order).toBeNull();
    expect(result.wake_target).toBeNull();
    expect(result.ability_steps).toEqual([]);
  });

  it('converts dependencies with the owning role id', () => {
    expect(adaptDependenciesToEngine(listItem)).toEqual([
      {
        role_id: 'role-seer',
        required_role_id: 'role-villager',
        dependency_type: 'recommends',
      },
    ]);
  });

  it('converts drafts for local preview with preview-inert count metadata', () => {
    const result = adaptDraftToEngine(draft);

    expect(result).toEqual({
      id: 'draft-seer',
      name: 'Seer',
      team: 'village',
      wake_order: null,
      wake_target: null,
      min_count: 1,
      max_count: 1,
      is_primary_team_role: false,
      ability_steps: [],
    });
    expect(buildPreview(result)).toEqual([]);
  });
});
