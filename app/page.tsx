export type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'complete';

export type ProjectMember = {
  id: string;
  name: string;
  role: 'exec_admin' | 'project_manager' | 'field_staff';
};

export type ProjectRecord = {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  summary: string;
  members: ProjectMember[];
};

export type ProjectListItem = ProjectRecord & {
  statusLabel: string;
};

const PROJECT_CATALOG: Record<string, ProjectRecord> = {
  'alpha-tower': {
    id: 'alpha-tower',
    name: 'Alpha Tower',
    code: 'AT-101',
    status: 'active',
    summary: 'Core commercial tower rebuild and tenant-fit out coordination.',
    members: [
      { id: 'alicia-stone', name: 'Alicia Stone', role: 'project_manager' },
      { id: 'marcus-hall', name: 'Marcus Hall', role: 'field_staff' },
      { id: 'jenna-patel', name: 'Jenna Patel', role: 'exec_admin' }
    ]
  },
  'northline-logistics': {
    id: 'northline-logistics',
    name: 'Northline Logistics',
    code: 'NL-220',
    status: 'planning',
    summary: 'Regional distribution center expansion and staging plan.',
    members: [
      { id: 'nia-brooks', name: 'Nia Brooks', role: 'project_manager' },
      { id: 'rafael-chen', name: 'Rafael Chen', role: 'field_staff' }
    ]
  },
  'harbor-suites': {
    id: 'harbor-suites',
    name: 'Harbor Suites',
    code: 'HS-310',
    status: 'on_hold',
    summary: 'Hotel conversion and waterfront amenities rework.',
    members: [
      { id: 'priya-shah', name: 'Priya Shah', role: 'exec_admin' },
      { id: 'omar-grant', name: 'Omar Grant', role: 'field_staff' },
      { id: 'leah-flores', name: 'Leah Flores', role: 'project_manager' }
    ]
  }
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getProjectList(): ProjectListItem[] {
  return Object.values(PROJECT_CATALOG).map((project) => ({
    ...project,
    statusLabel: project.status.replace('_', ' ')
  }));
}

export function getProjectById(projectId: string): ProjectRecord | null {
  return PROJECT_CATALOG[projectId] ?? null;
}

export function createProject(input: { name: string; code: string; status?: ProjectStatus }): ProjectRecord {
  const id = slugify(input.name);
  const project: ProjectRecord = {
    id,
    name: input.name,
    code: input.code,
    status: input.status ?? 'planning',
    summary: 'New project created from the workspace foundation.',
    members: []
  };

  PROJECT_CATALOG[id] = project;
  return project;
}

export function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>
): ProjectRecord | null {
  const current = PROJECT_CATALOG[projectId];
  if (!current) return null;

  const next = { ...current, ...updates };
  PROJECT_CATALOG[projectId] = next;
  return next;
}

export function deleteProject(projectId: string): ProjectRecord | null {
  const current = PROJECT_CATALOG[projectId];
  if (!current) return null;
  delete PROJECT_CATALOG[projectId];
  return current;
}

export function addProjectMember(projectId: string, member: Pick<ProjectMember, 'name' | 'role'>): ProjectMember | null {
  const project = PROJECT_CATALOG[projectId];
  if (!project) return null;

  const record: ProjectMember = {
    id: slugify(member.name),
    ...member
  };

  project.members.push(record);
  return record;
}

export function removeProjectMember(projectId: string, memberId: string): ProjectMember | null {
  const project = PROJECT_CATALOG[projectId];
  if (!project) return null;

  const member = project.members.find((item) => item.id === memberId) ?? null;
  project.members = project.members.filter((item) => item.id !== memberId);
  return member;
}
