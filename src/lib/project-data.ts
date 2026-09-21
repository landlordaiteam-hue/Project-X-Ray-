export type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'complete';

export type ProjectRole = 'exec_admin' | 'project_manager' | 'field_staff';

export type ProjectMember = {
  id: string;
  name: string;
  role: ProjectRole;
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

const defaultProjects: ProjectRecord[] = [
  {
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
  {
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
  {
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
];

let projects: ProjectRecord[] = [...defaultProjects];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getProjectList(): Promise<ProjectListItem[]> {
  return projects.map((project) => ({
    ...project,
    statusLabel: project.status.replace('_', ' ')
  }));
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: { name: string; code: string; status?: ProjectStatus }): Promise<ProjectRecord> {
  const id = slugify(input.name) || `project-${projects.length + 1}`;
  const record: ProjectRecord = {
    id,
    name: input.name,
    code: input.code,
    status: input.status ?? 'planning',
    summary: 'New project created from the workspace foundation.',
    members: []
  };

  projects.push(record);
  return record;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>
): Promise<ProjectRecord | null> {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return null;

  const next = { ...projects[index], ...updates };
  projects[index] = next;
  return next;
}

export async function deleteProject(projectId: string): Promise<ProjectRecord | null> {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return null;

  const [removed] = projects.splice(index, 1);
  return removed;
}

export async function addProjectMember(projectId: string, member: Pick<ProjectMember, 'name' | 'role'>): Promise<ProjectMember | null> {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const nextMember: ProjectMember = {
    id: slugify(member.name) || `member-${project.members.length + 1}`,
    ...member
  };

  project.members.push(nextMember);
  return nextMember;
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<ProjectMember | null> {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const index = project.members.findIndex((member) => member.id === memberId);
  if (index === -1) return null;

  const [removed] = project.members.splice(index, 1);
  return removed;
}
