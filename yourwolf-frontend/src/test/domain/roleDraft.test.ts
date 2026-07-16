import {describe, it, expect} from 'vitest';
import {createEmptyDraft} from '../../domain/roleDraft';

describe('domain/roleDraft createEmptyDraft', () => {
  it('creates a draft with the documented empty defaults', () => {
    const draft = createEmptyDraft();

    expect(draft).toMatchObject({
      name: '',
      description: '',
      team: 'village',
      wake_order: 0,
      wake_target: null,
      votes: 1,
      is_primary_team_role: false,
      ability_steps: [],
      win_conditions: [],
    });
  });

  it('assigns a fresh id on every call', () => {
    expect(createEmptyDraft().id).not.toBe(createEmptyDraft().id);
  });

  it('stamps created_at and updated_at with the same ISO timestamp', () => {
    const draft = createEmptyDraft();

    expect(draft.created_at).toBe(draft.updated_at);
    expect(new Date(draft.created_at).toISOString()).toBe(draft.created_at);
  });
});
