import { describe, expect, it } from 'vitest';
import { hasPermission, RBAC } from './rbac';

describe('trust foundation RBAC', () => {
  it('supports the defined role permissions', () => {
    expect(hasPermission(['project.read'], RBAC.projectRead)).toBe(true);
    expect(hasPermission(['organization.write'], RBAC.organizationWrite)).toBe(true);
    expect(hasPermission(['*'], RBAC.auditRead)).toBe(true);
  });

  it('denies permissions not granted', () => {
    expect(hasPermission(['project.read'], RBAC.projectWrite)).toBe(false);
    expect(hasPermission([], RBAC.organizationRead)).toBe(false);
  });
});
