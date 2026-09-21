export type Permission = string;

export function hasPermission(grantedPermissions: Permission[], permission: Permission): boolean {
  return grantedPermissions.includes(permission) || grantedPermissions.includes('*');
}
