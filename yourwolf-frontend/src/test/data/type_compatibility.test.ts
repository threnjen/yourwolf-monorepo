import type {Role, RoleListItem} from '../../types/transport';
import type {RoleRecord} from '../../data/records';
import {expect, test} from 'vitest';

function acceptsFullRole(role: Role): Role {
  return role;
}

function acceptsListRole(role: RoleListItem): RoleListItem {
  return role;
}

const roleRecord = {} as RoleRecord;

test('local role records are structurally compatible with transport role views', () => {
  expect(acceptsFullRole(roleRecord)).toBe(roleRecord);
  expect(acceptsListRole(roleRecord)).toBe(roleRecord);
});
