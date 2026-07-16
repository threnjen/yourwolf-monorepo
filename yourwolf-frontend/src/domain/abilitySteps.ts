import type {AbilityStepDraft, StepModifier} from '../types/role';

/** A JSON-Schema-ish parameter descriptor as delivered by the abilities API. */
type ParametersSchema = Record<string, unknown>;

/** The ability identity + schema needed to append a step. */
export interface AbilityStepSeed {
  abilityType: string;
  abilityName: string;
  parametersSchema?: ParametersSchema;
}

/** Supplies ids for new steps — `crypto.randomUUID` in production, a stub in tests. */
export type IdFactory = () => string;

function readProperties(
  schema: ParametersSchema | undefined,
): Record<string, Record<string, unknown>> | undefined {
  return schema?.properties as Record<string, Record<string, unknown>> | undefined;
}

/**
 * The modifier a step must carry at `index`.
 *
 * The first step has nothing to chain from, so it is always 'none'; any later step
 * that would read 'none' becomes 'and'. Explicit 'or'/'if' choices are preserved —
 * moving a step must not silently drop its branching semantics.
 */
function normalizeModifier(modifier: StepModifier, index: number): StepModifier {
  if (index === 0) return 'none';
  return modifier === 'none' ? 'and' : modifier;
}

/** Reassigns 1-based order and normalizes modifiers across the whole list. */
export function renumberSteps(steps: readonly AbilityStepDraft[]): AbilityStepDraft[] {
  return steps.map((step, i) => ({
    ...step,
    order: i + 1,
    modifier: normalizeModifier(step.modifier, i),
  }));
}

/** Seeds the parameter values a newly added step starts with (integers only). */
export function buildInitialParameters(schema: ParametersSchema | undefined): Record<string, unknown> {
  const properties = readProperties(schema);
  const parameters: Record<string, unknown> = {};
  if (!properties) return parameters;

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'integer') {
      parameters[key] = (prop.default as number | undefined) ?? 1;
    }
  }
  return parameters;
}

/** The declared type of a schema parameter, or undefined if it is not declared. */
export function getParameterType(
  schema: ParametersSchema | undefined,
  key: string,
): string | undefined {
  return readProperties(schema)?.[key]?.type as string | undefined;
}

/**
 * Converts a raw form input into the typed value a step parameter stores.
 *
 * Integers below 1 and unparseable input fall back to 1; array input is a
 * comma-separated list with non-numeric entries dropped. Anything else passes through.
 */
export function coerceParameterValue(value: unknown, propType: string | undefined): unknown {
  if (propType === 'integer') {
    const num = parseInt(value as string, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }
  if (propType === 'array') {
    return (value as string)
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  return value;
}

/** Appends a new step for `seed` at the end of the list. Existing steps are untouched. */
export function appendAbilityStep(
  steps: readonly AbilityStepDraft[],
  seed: AbilityStepSeed,
  createId: IdFactory = () => crypto.randomUUID(),
): AbilityStepDraft[] {
  const nextOrder = steps.length + 1;
  const newStep: AbilityStepDraft = {
    id: createId(),
    ability_type: seed.abilityType,
    ability_name: seed.abilityName,
    order: nextOrder,
    modifier: nextOrder === 1 ? 'none' : 'and',
    is_required: false,
    parameters: buildInitialParameters(seed.parametersSchema),
  };
  return [...steps, newStep];
}

/** Removes the step at `index`, renumbering what remains. */
export function removeStepAt(steps: readonly AbilityStepDraft[], index: number): AbilityStepDraft[] {
  return renumberSteps(steps.filter((_, i) => i !== index));
}

/** Swaps the step at `index` with the one before it. No-op when already first. */
export function moveStepUp(steps: readonly AbilityStepDraft[], index: number): AbilityStepDraft[] {
  if (index === 0) return steps as AbilityStepDraft[];
  const reordered = [...steps];
  [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
  return renumberSteps(reordered);
}

/** Swaps the step at `index` with the one after it. No-op when already last. */
export function moveStepDown(steps: readonly AbilityStepDraft[], index: number): AbilityStepDraft[] {
  if (index === steps.length - 1) return steps as AbilityStepDraft[];
  const reordered = [...steps];
  [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
  return renumberSteps(reordered);
}

/**
 * Sets the modifier on one step.
 *
 * Deliberately does not renumber: this is a direct user choice on a step whose
 * position has not changed.
 */
export function setStepModifier(
  steps: readonly AbilityStepDraft[],
  index: number,
  modifier: StepModifier,
): AbilityStepDraft[] {
  return steps.map((step, i) => (i === index ? {...step, modifier} : step));
}

/** Coerces `value` per the ability schema and stores it on the step's parameters. */
export function setStepParameter(
  steps: readonly AbilityStepDraft[],
  stepIndex: number,
  paramKey: string,
  value: unknown,
  schema: ParametersSchema | undefined,
): AbilityStepDraft[] {
  const parsedValue = coerceParameterValue(value, getParameterType(schema, paramKey));
  return steps.map((step, i) =>
    i === stepIndex ? {...step, parameters: {...step.parameters, [paramKey]: parsedValue}} : step,
  );
}
