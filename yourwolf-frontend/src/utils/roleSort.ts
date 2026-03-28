import type {Team, RoleListItem} from '../types/role';

export const TEAM_ORDER: Team[] = ['village', 'werewolf', 'vampire', 'alien', 'neutral'];

export interface TeamGroup {
  team: Team;
  roles: RoleListItem[];
}

export function sortRolesByTeam(roles: RoleListItem[]): RoleListItem[] {
  return [...roles].sort((a, b) => {
    const aIndex = TEAM_ORDER.indexOf(a.team);
    const bIndex = TEAM_ORDER.indexOf(b.team);
    return (aIndex === -1 ? TEAM_ORDER.length : aIndex) - (bIndex === -1 ? TEAM_ORDER.length : bIndex);
  });
}

export function groupRolesByTeam(roles: RoleListItem[]): TeamGroup[] {
  const sorted = sortRolesByTeam(roles);
  const groups: TeamGroup[] = [];

  for (const role of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.team === role.team) {
      last.roles.push(role);
    } else {
      groups.push({team: role.team, roles: [role]});
    }
  }

  return groups;
}
