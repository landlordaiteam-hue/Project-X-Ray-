import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './auth';
import { canAccessProject, hasPermission, permissionsForRole } from './rbac';
import { assertTenantAccess, tenantMatches } from './tenant';
describe('authentication',()=>{it('hashes and verifies passwords',async()=>{const hash=await hashPassword('Password123!');expect(await verifyPassword('Password123!',hash)).toBe(true);expect(await verifyPassword('wrong-password',hash)).toBe(false)})});
describe('RBAC',()=>{it('maps roles to permissions',()=>{expect(hasPermission(permissionsForRole('exec_admin'),'project.write')).toBe(true);expect(hasPermission(permissionsForRole('field_staff'),'project.write')).toBe(false)})});
describe('tenant isolation and project access',()=>{it('rejects a different tenant',()=>{expect(tenantMatches('a','b')).toBe(false);expect(()=>assertTenantAccess('a','b')).toThrow()});it('requires same tenant and role/member access',()=>{expect(canAccessProject({organizationId:'a',permissions:permissionsForRole('project_manager')},{organizationId:'a'})).toBe(true);expect(canAccessProject({organizationId:'a',permissions:permissionsForRole('field_staff')},{organizationId:'a',memberUserIds:['u1']},'u1')).toBe(true);expect(canAccessProject({organizationId:'a',permissions:permissionsForRole('field_staff')},{organizationId:'b',memberUserIds:['u1']},'u1')).toBe(false)})});
