import { describe, expect, it } from 'vitest';
import { hasPermission } from './rbac';

describe('project workspace access', () => {
  it('allows project managers to manage members', () => {
    expect(hasPermission(['project.read', 'project_member.manage'], 'project_member.manage')).toBe(true);
  });

  it('prevents field staff from managing members', () => {
    expect(hasPermission(['project.read'], 'project_member.manage')).toBe(false);
  });
});
