import type {EngineAbilityStepInput, EngineRoleInput} from './types.ts';

/** Duration in seconds for each supported ability type. */
export const STEP_DURATIONS: Readonly<Record<string, number>> = {
  view_card: 8,
  swap_card: 6,
  take_card: 6,
  view_awake: 5,
  thumbs_up: 5,
  explicit_no_view: 2,
  rotate_all: 8,
  touch: 5,
  flip_card: 5,
  copy_role: 3,
  change_to_team: 2,
  perform_as: 2,
  perform_immediately: 2,
  stop: 0,
  random_num_players: 5,
};

const DEFAULT_STEP_DURATION = 5;

type Parameters = Readonly<Record<string, unknown>>;
type InstructionTemplate = (parameters: Parameters) => string;

function parameterString(
  parameters: Parameters,
  name: string,
  fallback: string,
): string {
  const value = parameters[name];
  return typeof value === 'string' ? value : fallback;
}

function parameterNumber(
  parameters: Parameters,
  name: string,
  fallback: number,
): number {
  const value = parameters[name];
  return typeof value === 'number' ? value : fallback;
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => {
      if (word.length === 0) {
        return word;
      }
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function viewCardInstruction(parameters: Parameters): string {
  const target = parameterString(parameters, 'target', 'player.other');
  const count = parameterNumber(parameters, 'count', 1);

  if (target === 'player.self') {
    return 'You may look at your own card.';
  }
  if (target === 'player.other') {
    if (count === 1) {
      return "You may look at one other player's card.";
    }
    return `You may look at up to ${String(count)} other players' cards.`;
  }
  if (target === 'center.main') {
    if (count === 1) {
      return 'You may look at one card from the center.';
    }
    return `You may look at ${String(count)} cards from the center.`;
  }
  return 'You may look at a card.';
}

function swapCardInstruction(parameters: Parameters): string {
  const targetA = parameterString(parameters, 'target_a', '');
  const targetB = parameterString(parameters, 'target_b', '');

  if (targetA === 'player.self' || targetB === 'player.self') {
    const other = targetA === 'player.self' ? targetB : targetA;
    if (other.includes('center')) {
      return 'Exchange your card with one from the center.';
    }
    return "Exchange your card with another player's card.";
  }
  if (targetA.includes('center')) {
    return "You may swap that center card with any player's card.";
  }
  return "You may swap two other players' cards.";
}

function takeCardInstruction(parameters: Parameters): string {
  const target = parameterString(parameters, 'target', 'player.other');
  if (target.includes('center')) {
    return 'Take a card from the center.';
  }
  return "Take another player's card.";
}

function thumbsUpInstruction(parameters: Parameters): string {
  const target = parameterString(parameters, 'target', '');

  if (target === 'player.self') {
    return 'Put your thumb out so others can see it.';
  }
  if (target.startsWith('team.')) {
    const team = target.slice('team.'.length);
    // The "Werewolfs" spelling is frozen narrator copy. Keep it in sync with
    // the backend oracle until a dedicated copy-fix feature changes both.
    return `${titleCase(team)}s, put your thumbs out.`;
  }
  if (target.startsWith('role.')) {
    const targetRole = target.split('role.').join('').split('_').join(' ');
    return `${titleCase(targetRole)}, put your thumb out.`;
  }
  if (target === 'players.actions') {
    return 'Everyone who viewed or moved a card tonight, put your thumb out.';
  }
  return 'Put your thumb out.';
}

function rotateInstruction(parameters: Parameters): string {
  const direction = parameterString(parameters, 'direction', 'left');
  return `You may move all player cards one position to the ${direction}.`;
}

function changeToTeamInstruction(parameters: Parameters): string {
  const team = parameters.team;
  if (team) {
    return `If you see a ${String(team)}, you are now on the ${String(team)} team.`;
  }
  return 'You change teams.';
}

function randomNumPlayersInstruction(parameters: Parameters): string {
  const options = parameters.options;
  if (!Array.isArray(options) || options.length === 0) {
    return 'A random number of players are selected.';
  }
  if (options.length === 1) {
    return `${String(options[0])} adjacent players are now part of your group.`;
  }

  const formatted =
    options.length === 2
      ? `${String(options[0])} or ${String(options[1])}`
      : `${options.slice(0, -1).map(String).join(', ')}, or ${String(options[options.length - 1])}`;
  return `A random number of adjacent players (${formatted}) are now part of your group.`;
}

const TEMPLATES: Readonly<Record<string, InstructionTemplate>> = {
  view_card: viewCardInstruction,
  swap_card: swapCardInstruction,
  take_card: takeCardInstruction,
  view_awake: () => 'Look around and see who else is awake.',
  thumbs_up: thumbsUpInstruction,
  explicit_no_view: () => 'Do not look at your new card.',
  rotate_all: rotateInstruction,
  touch: () => 'Reach out and tap the player next to you.',
  flip_card: () => "You may flip that player's card face up.",
  copy_role: () => 'You are now that role for the rest of the game.',
  change_to_team: changeToTeamInstruction,
  perform_as: () =>
    "At the copied role's normal wake time, perform their night actions.",
  perform_immediately: () => "Now perform the copied role's night actions.",
  stop: () => 'Stop. Do not perform any further actions.',
  random_num_players: randomNumPlayersInstruction,
};

/** Build the wake-up instruction for a role. */
export function buildWakeInstruction(role: EngineRoleInput): string {
  const wakeTarget = role.wake_target || 'player.self';

  if (wakeTarget === 'player.self') {
    return `${role.name}, wake up.`;
  }
  if (wakeTarget === 'team.werewolf') {
    return 'Werewolves, wake up and look for other werewolves.';
  }
  if (wakeTarget === 'team.alien') {
    return 'Aliens, wake up and look for other aliens.';
  }
  if (wakeTarget === 'team.vampire') {
    return 'Vampires, wake up and look for other vampires.';
  }
  if (wakeTarget.startsWith('role.')) {
    const targetRole = wakeTarget.split('role.').join('').split('_').join(' ');
    return `${role.name} and ${targetRole}, wake up.`;
  }
  return `${role.name}, wake up.`;
}

/** Build an instruction, or undefined when no template exists. */
export function buildStepInstruction(
  step: EngineAbilityStepInput,
): string | undefined {
  const template = TEMPLATES[step.ability_type];
  if (template === undefined) {
    return undefined;
  }

  const instruction = template(step.parameters);
  return step.modifier === 'or' ? `OR ${instruction}` : instruction;
}

/** Get the narration duration for an ability step. */
export function getStepDuration(step: EngineAbilityStepInput): number {
  return STEP_DURATIONS[step.ability_type] ?? DEFAULT_STEP_DURATION;
}
