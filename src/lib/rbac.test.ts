import { describe, expect, it } from 'vitest';
import { hasPermission, RBAC } from './rbac';

describe('RBAC', () => {
  it('grants exact permissions and wildcard access', () => {
    expect(hasPermission([RBAC.projectRead], RBAC.projectRead)).toBe(true);
    expect(hasPermission(['*'], RBAC.projectMemberManage)).toBe(true);
  });
  it('denies missing permissions', () => {
    expect(hasPermission([RBAC.projectRead], RBAC.projectWrite)).toBe(false);
  });
});
