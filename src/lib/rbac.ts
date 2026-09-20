export type Role = 'exec_admin' | 'project_manager' | 'field_staff';

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  exec_admin: ['organization.read', 'organization.write', 'project.read', 'project.write', 'project_member.manage', 'audit.read', 'security.manage'],
  project_manager: ['organization.read', 'project.read', 'project.write', 'project_member.manage', 'audit.read'],
  field_staff: ['project.read']
};

export function permissionsForRole(role: string): string[] { return [...(ROLE_PERMISSIONS[role as Role] ?? [])]; }
export function hasPermission(permissions: string[], permission: string): boolean { return permissions.includes(permission); }
export function canAccessProject(user: { organizationId: string; permissions: string[] }, project: { organizationId: string; memberUserIds?: string[] }, userId?: string): boolean {
  if (user.organizationId !== project.organizationId) return false;
  if (hasPermission(user.permissions, 'project.write') || hasPermission(user.permissions, 'organization.read')) return true;
  return Boolean(userId && project.memberUserIds?.includes(userId));
}
