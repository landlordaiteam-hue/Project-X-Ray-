import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

const DEFAULT_PROJECTS: ProjectRecord[] = [
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

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'projects.json');

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function readProjectsFromDisk(): Promise<ProjectRecord[]> {
  try {
    const data = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(data) as ProjectRecord[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore missing or invalid store and fall back to defaults
  }

  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2), 'utf8');
  return DEFAULT_PROJECTS;
}

async function writeProjectsToDisk(projects: ProjectRecord[]) {
  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(projects, null, 2), 'utf8');
  } catch {
    // ignore disk failures in this lightweight foundation layer
  }
}

export async function getProjectList(): Promise<ProjectListItem[]> {
  const projects = await readProjectsFromDisk();
  return projects.map((project) => ({
    ...project,
    statusLabel: project.status.replace('_', ' ')
  }));
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  const projects = await readProjectsFromDisk();
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: { name: string; code: string; status?: ProjectStatus }): Promise<ProjectRecord> {
  const projects = await readProjectsFromDisk();
  const projectId = slugify(input.name) || `project-${projects.length + 1}`;

  const record: ProjectRecord = {
    id: projectId,
    name: input.name,
    code: input.code,
    status: input.status ?? 'planning',
    summary: 'New project created from the workspace foundation.',
    members: []
  };

  projects.push(record);
  await writeProjectsToDisk(projects);
  return record;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>
): Promise<ProjectRecord | null> {
  const projects = await readProjectsFromDisk();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return null;

  const nextProject = { ...projects[index], ...updates };
  projects[index] = nextProject;
  await writeProjectsToDisk(projects);
  return nextProject;
}

export async function deleteProject(projectId: string): Promise<ProjectRecord | null> {
  const projects = await readProjectsFromDisk();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return null;

  const [removed] = projects.splice(index, 1);
  await writeProjectsToDisk(projects);
  return removed;
}

export async function addProjectMember(
  projectId: string,
  member: Pick<ProjectMember, 'name' | 'role'>
): Promise<ProjectMember | null> {
  const projects = await readProjectsFromDisk();
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const record: ProjectMember = {
    id: slugify(member.name) || `member-${project.members.length + 1}`,
    ...member
  };

  project.members.push(record);
  await writeProjectsToDisk(projects);
  return record;
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<ProjectMember | null> {
  const projects = await readProjectsFromDisk();
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const index = project.members.findIndex((member) => member.id === memberId);
  if (index === -1) return null;

  const [removed] = project.members.splice(index, 1);
  await writeProjectsToDisk(projects);
  return removed;
}

export function projectStatusLabel(status: ProjectStatus) {
  return status.replace('_', ' ');
}
