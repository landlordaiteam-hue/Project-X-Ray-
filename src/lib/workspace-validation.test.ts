import { describe, expect, it, beforeEach } from 'vitest';
import { createProject, getProjectById, addProjectMember } from './project-data';
import { hasPermission, RBAC } from './rbac';

describe('workspace validation', () => {
  it('supports exact and wildcard permissions', () => {
    expect(hasPermission([RBAC.projectRead], RBAC.projectRead)).toBe(true);
    expect(hasPermission(['*'], RBAC.projectMemberManage)).toBe(true);
    expect(hasPermission([RBAC.projectRead], RBAC.projectWrite)).toBe(false);
  });

  it('rejects duplicate project codes and members', async () => {
    await expect(createProject({ name: 'Unique Validation Project', code: 'UV-001' })).resolves.toBeDefined();
    await expect(createProject({ name: 'Another Validation Project', code: 'UV-001' })).rejects.toThrow('Project already exists');
    await expect(addProjectMember('alpha-tower', { name: 'Alicia Stone', role: 'project_manager' })).rejects.toThrow('Member already exists');
    await expect(getProjectById('alpha-tower')).resolves.toBeDefined();
  });
});
