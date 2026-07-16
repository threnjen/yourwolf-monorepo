import {describe, it, expect} from 'vitest';
import {
  buildInitialParameters,
  getParameterType,
  coerceParameterValue,
  appendAbilityStep,
  removeStepAt,
  moveStepUp,
  moveStepDown,
  setStepModifier,
  setStepParameter,
  renumberSteps,
} from '../domain/abilitySteps';
import type {AbilityStepDraft, StepModifier} from '../types/role';

function makeStep(
  id: string,
  order: number,
  modifier: StepModifier = 'and',
  parameters: Record<string, unknown> = {},
): AbilityStepDraft {
  return {
    id,
    order,
    modifier,
    is_required: false,
    parameters,
    ability_type: `type_${id}`,
    ability_name: `Ability ${id}`,
  };
}

/** Three steps in the shape the component keeps them: first 'none', rest 'and'. */
function threeSteps(): AbilityStepDraft[] {
  return [makeStep('a', 1, 'none'), makeStep('b', 2, 'and'), makeStep('c', 3, 'and')];
}

const integerSchema = {
  properties: {count: {type: 'integer', default: 2}},
};

const arraySchema = {
  properties: {positions: {type: 'array'}},
};

describe('abilitySteps', () => {
  describe('renumberSteps', () => {
    it('returns an empty list unchanged', () => {
      expect(renumberSteps([])).toEqual([]);
    });

    it('assigns 1-based sequential order', () => {
      const steps = [makeStep('a', 7), makeStep('b', 9), makeStep('c', 4)];
      expect(renumberSteps(steps).map((s) => s.order)).toEqual([1, 2, 3]);
    });

    it('forces the first step modifier to none', () => {
      expect(renumberSteps([makeStep('a', 1, 'or')])[0].modifier).toBe('none');
    });

    it('promotes a non-first none modifier to and', () => {
      const steps = [makeStep('a', 1, 'none'), makeStep('b', 2, 'none')];
      expect(renumberSteps(steps)[1].modifier).toBe('and');
    });

    it('preserves or/if modifiers on non-first steps', () => {
      const steps = [makeStep('a', 1, 'none'), makeStep('b', 2, 'or'), makeStep('c', 3, 'if')];
      expect(renumberSteps(steps).map((s) => s.modifier)).toEqual(['none', 'or', 'if']);
    });

    it('does not mutate the input steps', () => {
      const steps = [makeStep('a', 5, 'or')];
      renumberSteps(steps);
      expect(steps[0]).toEqual(makeStep('a', 5, 'or'));
    });
  });

  describe('buildInitialParameters', () => {
    it('returns an empty object when the schema is undefined', () => {
      expect(buildInitialParameters(undefined)).toEqual({});
    });

    it('returns an empty object when the schema has no properties', () => {
      expect(buildInitialParameters({})).toEqual({});
    });

    it('seeds integer parameters with the schema default', () => {
      expect(buildInitialParameters(integerSchema)).toEqual({count: 2});
    });

    it('seeds integer parameters with 1 when no default is declared', () => {
      expect(buildInitialParameters({properties: {count: {type: 'integer'}}})).toEqual({count: 1});
    });

    it('does not seed non-integer parameters', () => {
      const schema = {properties: {target: {type: 'string'}, positions: {type: 'array'}}};
      expect(buildInitialParameters(schema)).toEqual({});
    });
  });

  describe('getParameterType', () => {
    it('returns undefined when the schema is undefined', () => {
      expect(getParameterType(undefined, 'count')).toBeUndefined();
    });

    it('returns undefined for an unknown key', () => {
      expect(getParameterType(integerSchema, 'nope')).toBeUndefined();
    });

    it('returns the declared property type', () => {
      expect(getParameterType(integerSchema, 'count')).toBe('integer');
    });
  });

  describe('coerceParameterValue', () => {
    it('passes through values with no declared type', () => {
      expect(coerceParameterValue('raw', undefined)).toBe('raw');
    });

    it('passes through string values', () => {
      expect(coerceParameterValue('player.self', 'string')).toBe('player.self');
    });

    it('parses an integer input', () => {
      expect(coerceParameterValue('3', 'integer')).toBe(3);
    });

    it('falls back to 1 for unparseable integer input', () => {
      expect(coerceParameterValue('abc', 'integer')).toBe(1);
    });

    it('falls back to 1 for an empty integer input', () => {
      expect(coerceParameterValue('', 'integer')).toBe(1);
    });

    it('clamps integers below 1 up to 1', () => {
      expect(coerceParameterValue('0', 'integer')).toBe(1);
      expect(coerceParameterValue('-5', 'integer')).toBe(1);
    });

    it('parses a comma-separated array input', () => {
      expect(coerceParameterValue('1, 2, 3', 'array')).toEqual([1, 2, 3]);
    });

    it('drops non-numeric array entries', () => {
      expect(coerceParameterValue('1, x, 3', 'array')).toEqual([1, 3]);
    });

    it('returns an empty array for empty array input', () => {
      expect(coerceParameterValue('', 'array')).toEqual([]);
    });
  });

  describe('appendAbilityStep', () => {
    it('adds the first step with modifier none and order 1', () => {
      const result = appendAbilityStep(
        [],
        {abilityType: 'view_card', abilityName: 'View Card'},
        () => 'id-1',
      );

      expect(result).toEqual([
        {
          id: 'id-1',
          ability_type: 'view_card',
          ability_name: 'View Card',
          order: 1,
          modifier: 'none',
          is_required: false,
          parameters: {},
        },
      ]);
    });

    it('adds a subsequent step with modifier and, numbered after the last', () => {
      const result = appendAbilityStep(
        [makeStep('a', 1, 'none')],
        {abilityType: 'swap_card', abilityName: 'Swap Card'},
        () => 'id-2',
      );

      expect(result).toHaveLength(2);
      expect(result[1].order).toBe(2);
      expect(result[1].modifier).toBe('and');
    });

    it('seeds parameters from the ability schema', () => {
      const result = appendAbilityStep(
        [],
        {abilityType: 'view_card', abilityName: 'View Card', parametersSchema: integerSchema},
        () => 'id-1',
      );

      expect(result[0].parameters).toEqual({count: 2});
    });

    it('leaves existing steps untouched', () => {
      const steps = threeSteps();
      const result = appendAbilityStep(
        steps,
        {abilityType: 'stop', abilityName: 'Stop'},
        () => 'id-4',
      );

      expect(result.slice(0, 3)).toEqual(steps);
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      appendAbilityStep(steps, {abilityType: 'stop', abilityName: 'Stop'}, () => 'id-4');
      expect(steps).toHaveLength(3);
    });
  });

  describe('removeStepAt', () => {
    it('removes the step at the index and renumbers the rest', () => {
      const result = removeStepAt(threeSteps(), 1);
      expect(result.map((s) => s.id)).toEqual(['a', 'c']);
      expect(result.map((s) => s.order)).toEqual([1, 2]);
    });

    it('promotes the new first step to modifier none', () => {
      const result = removeStepAt(threeSteps(), 0);
      expect(result[0].id).toBe('b');
      expect(result[0].modifier).toBe('none');
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      removeStepAt(steps, 0);
      expect(steps).toHaveLength(3);
    });
  });

  describe('moveStepUp', () => {
    it('swaps the step with the one above it and renumbers', () => {
      const result = moveStepUp(threeSteps(), 1);
      expect(result.map((s) => s.id)).toEqual(['b', 'a', 'c']);
      expect(result.map((s) => s.order)).toEqual([1, 2, 3]);
    });

    it('normalizes modifiers after the move', () => {
      const result = moveStepUp(threeSteps(), 1);
      expect(result.map((s) => s.modifier)).toEqual(['none', 'and', 'and']);
    });

    it('returns the steps unchanged when already first', () => {
      const steps = threeSteps();
      expect(moveStepUp(steps, 0)).toBe(steps);
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      moveStepUp(steps, 1);
      expect(steps.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('moveStepDown', () => {
    it('swaps the step with the one below it and renumbers', () => {
      const result = moveStepDown(threeSteps(), 0);
      expect(result.map((s) => s.id)).toEqual(['b', 'a', 'c']);
      expect(result.map((s) => s.order)).toEqual([1, 2, 3]);
    });

    it('returns the steps unchanged when already last', () => {
      const steps = threeSteps();
      expect(moveStepDown(steps, 2)).toBe(steps);
    });

    it('preserves an or modifier carried by the moved step', () => {
      const steps = [makeStep('a', 1, 'none'), makeStep('b', 2, 'or'), makeStep('c', 3, 'and')];
      const result = moveStepDown(steps, 1);
      expect(result.map((s) => s.id)).toEqual(['a', 'c', 'b']);
      expect(result.map((s) => s.modifier)).toEqual(['none', 'and', 'or']);
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      moveStepDown(steps, 0);
      expect(steps.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('setStepModifier', () => {
    it('sets the modifier on the targeted step only', () => {
      const result = setStepModifier(threeSteps(), 1, 'or');
      expect(result.map((s) => s.modifier)).toEqual(['none', 'or', 'and']);
    });

    it('does not renumber or otherwise normalize', () => {
      const result = setStepModifier(threeSteps(), 2, 'if');
      expect(result.map((s) => s.order)).toEqual([1, 2, 3]);
      expect(result[2].modifier).toBe('if');
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      setStepModifier(steps, 1, 'or');
      expect(steps[1].modifier).toBe('and');
    });
  });

  describe('setStepParameter', () => {
    it('coerces and sets an integer parameter', () => {
      const result = setStepParameter(threeSteps(), 0, 'count', '4', integerSchema);
      expect(result[0].parameters).toEqual({count: 4});
    });

    it('coerces and sets an array parameter', () => {
      const result = setStepParameter(threeSteps(), 0, 'positions', '2, 3', arraySchema);
      expect(result[0].parameters).toEqual({positions: [2, 3]});
    });

    it('stores a string parameter verbatim', () => {
      const schema = {properties: {target: {type: 'string'}}};
      const result = setStepParameter(threeSteps(), 0, 'target', 'player.self', schema);
      expect(result[0].parameters).toEqual({target: 'player.self'});
    });

    it('merges into existing parameters rather than replacing them', () => {
      const steps = [makeStep('a', 1, 'none', {target: 'player.self'})];
      const result = setStepParameter(steps, 0, 'count', '2', integerSchema);
      expect(result[0].parameters).toEqual({target: 'player.self', count: 2});
    });

    it('leaves other steps untouched', () => {
      const result = setStepParameter(threeSteps(), 1, 'count', '4', integerSchema);
      expect(result[0].parameters).toEqual({});
      expect(result[2].parameters).toEqual({});
    });

    it('passes the value through when the schema is undefined', () => {
      const result = setStepParameter(threeSteps(), 0, 'count', '4', undefined);
      expect(result[0].parameters).toEqual({count: '4'});
    });

    it('does not mutate the input steps', () => {
      const steps = threeSteps();
      setStepParameter(steps, 0, 'count', '4', integerSchema);
      expect(steps[0].parameters).toEqual({});
    });
  });
});
