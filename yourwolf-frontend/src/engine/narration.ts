import {buildStepInstruction, buildWakeInstruction, getStepDuration} from './templates.ts';
import type {
  EngineRoleInput,
  NarratorAction,
  NarratorPreviewAction,
} from './types.ts';

const OPENING_INSTRUCTION = 'Everyone, close your eyes.';
const CLOSING_INSTRUCTION = 'Everyone, open your eyes.';
const NARRATOR_ROLE_NAME = 'Narrator';
const OPENING_DURATION_SECONDS = 5;
const CLOSING_DURATION_SECONDS = 3;
const WAKE_DURATION_SECONDS = 3;
const CLOSE_EYES_DURATION_SECONDS = 3;
const SECOND_WAKE_ABILITY_TYPES = new Set(['perform_immediately', 'perform_as']);

function compareRoleNames(left: EngineRoleInput, right: EngineRoleInput): number {
  if (left.name < right.name) {
    return -1;
  }
  if (left.name > right.name) {
    return 1;
  }
  return 0;
}

function compareWakeOrder(left: EngineRoleInput, right: EngineRoleInput): number {
  const leftOrder = left.wake_order ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.wake_order ?? Number.POSITIVE_INFINITY;
  return leftOrder - rightOrder || compareRoleNames(left, right);
}

function uniqueWakingRoles(roles: readonly EngineRoleInput[]): EngineRoleInput[] {
  const seenIds = new Set<string>();
  const wakingRoles: EngineRoleInput[] = [];

  for (const role of roles) {
    if (role.wake_order === null || role.wake_order <= 0 || seenIds.has(role.id)) {
      continue;
    }
    seenIds.add(role.id);
    wakingRoles.push(role);
  }

  return wakingRoles;
}

/** Sort waking roles using deterministic default or custom wake ordering. */
export function sortWakingRoles(
  roles: readonly EngineRoleInput[],
  customWakeSequence?: readonly string[],
): EngineRoleInput[] {
  const wakingRoles = uniqueWakingRoles(roles);
  if (!customWakeSequence || customWakeSequence.length === 0) {
    return wakingRoles.slice().sort(compareWakeOrder);
  }

  const sequencePositions = new Map<string, number>();
  customWakeSequence.forEach((roleId, index) => {
    sequencePositions.set(roleId, index);
  });

  return wakingRoles.slice().sort((left, right) => {
    const leftPosition = sequencePositions.get(left.id);
    const rightPosition = sequencePositions.get(right.id);
    if (leftPosition !== undefined && rightPosition !== undefined) {
      return leftPosition - rightPosition;
    }
    if (leftPosition !== undefined) {
      return -1;
    }
    if (rightPosition !== undefined) {
      return 1;
    }
    return compareWakeOrder(left, right);
  });
}

/** Build the ordered narrator actions for one role. */
export function buildRoleScript(
  role: EngineRoleInput,
  startOrder = 1,
): NarratorAction[] {
  const actions: NarratorAction[] = [
    {
      order: startOrder,
      role_name: role.name,
      instruction: buildWakeInstruction(role),
      duration_seconds: WAKE_DURATION_SECONDS,
      requires_player_action: false,
    },
  ];
  let order = startOrder + 1;

  const sortedSteps = role.ability_steps.slice().sort((left, right) => left.order - right.order);
  for (const step of sortedSteps) {
    const instruction = buildStepInstruction(step);
    if (instruction === undefined) {
      continue;
    }
    actions.push({
      order,
      role_name: role.name,
      instruction,
      duration_seconds: getStepDuration(step),
      requires_player_action: step.is_required || step.modifier === 'or',
    });
    order += 1;
  }

  actions.push({
    order,
    role_name: role.name,
    instruction: `${role.name}, close your eyes.`,
    duration_seconds: CLOSE_EYES_DURATION_SECONDS,
    requires_player_action: false,
  });
  return actions;
}

/** Build the complete ordered night script, including narrator boundaries. */
export function buildNightScript(
  roles: readonly EngineRoleInput[],
  customWakeSequence?: readonly string[],
): NarratorAction[] {
  const actions: NarratorAction[] = [
    {
      order: 1,
      role_name: NARRATOR_ROLE_NAME,
      instruction: OPENING_INSTRUCTION,
      duration_seconds: OPENING_DURATION_SECONDS,
      requires_player_action: false,
    },
  ];
  let order = 2;

  for (const role of sortWakingRoles(roles, customWakeSequence)) {
    const roleActions = buildRoleScript(role, order);
    actions.push(...roleActions);
    order += roleActions.length;
  }

  actions.push({
    order,
    role_name: NARRATOR_ROLE_NAME,
    instruction: CLOSING_INSTRUCTION,
    duration_seconds: CLOSING_DURATION_SECONDS,
    requires_player_action: false,
  });
  return actions;
}

/** Sum narrator action durations without changing the action list. */
export function totalDurationSeconds(actions: readonly NarratorAction[]): number {
  return actions.reduce((total, action) => total + action.duration_seconds, 0);
}

/** Build a preview for one role, including its optional second-wake section. */
export function buildPreview(role: EngineRoleInput): NarratorPreviewAction[] {
  if (role.wake_order === null || role.wake_order <= 0) {
    return [];
  }

  const previewActions: NarratorPreviewAction[] = buildRoleScript(role).map((action) => ({
    order: action.order,
    instruction: action.instruction,
    is_section_header: false,
  }));

  if (
    role.ability_steps.some((step) => SECOND_WAKE_ABILITY_TYPES.has(step.ability_type))
  ) {
    previewActions.push({
      order: previewActions.length + 1,
      instruction: `Then, at the copied role's wake time, ${role.name} performs the copied role's night actions.`,
      is_section_header: true,
    });
  }

  return previewActions;
}
