export type Permission = string;

export const RBAC = {
  organizationRead: 'organization.read',
  organizationWrite: 'organization.write',
  projectRead: 'project.read',
  projectWrite: 'project.write',
  projectMemberManage: 'project_member.manage',
  auditRead: 'audit.read',
  userManage: 'user.manage'
} as const;

export function hasPermission(grantedPermissions: Permission[], permission: Permission): boolean {
  return grantedPermissions.includes(permission) || grantedPermissions.includes('*');
}
