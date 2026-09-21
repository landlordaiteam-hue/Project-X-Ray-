export type Permission = string;

export const RBAC = {
  projectRead: 'project.read',
  projectWrite: 'project.write',
  projectMemberManage: 'project_member.manage'
} as const;

export function hasPermission(grantedPermissions: Permission[], permission: Permission): boolean {
  return grantedPermissions.includes(permission) || grantedPermissions.includes('*');
}
