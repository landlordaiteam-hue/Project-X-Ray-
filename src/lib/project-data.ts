import { databaseEnabled, withTenant } from './db';

export type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'complete';
export type ProjectRole = 'exec_admin' | 'project_manager' | 'field_staff';
export type ProjectMember = { id: string; name: string; role: ProjectRole };
export type ProjectRecord = { id: string; name: string; code: string; status: ProjectStatus; summary: string; members: ProjectMember[] };
export type ProjectListItem = ProjectRecord & { statusLabel: string };

type ProjectRow = { id: string; slug: string; name: string; code: string; status: ProjectStatus; summary: string; member_id: string | null; member_name: string | null; member_role: ProjectRole | null };

const organizationId = () => process.env.DEFAULT_ORGANIZATION_ID;
const memory: ProjectRecord[] = [
  { id: 'alpha-tower', name: 'Alpha Tower', code: 'AT-101', status: 'active', summary: 'Core commercial tower rebuild and tenant-fit out coordination.', members: [{ id: 'alicia-stone', name: 'Alicia Stone', role: 'project_manager' }, { id: 'marcus-hall', name: 'Marcus Hall', role: 'field_staff' }, { id: 'jenna-patel', name: 'Jenna Patel', role: 'exec_admin' }] },
  { id: 'northline-logistics', name: 'Northline Logistics', code: 'NL-220', status: 'planning', summary: 'Regional distribution center expansion and staging plan.', members: [{ id: 'nia-brooks', name: 'Nia Brooks', role: 'project_manager' }, { id: 'rafael-chen', name: 'Rafael Chen', role: 'field_staff' }] },
  { id: 'harbor-suites', name: 'Harbor Suites', code: 'HS-310', status: 'on_hold', summary: 'Hotel conversion and waterfront amenities rework.', members: [{ id: 'priya-shah', name: 'Priya Shah', role: 'exec_admin' }, { id: 'omar-grant', name: 'Omar Grant', role: 'field_staff' }, { id: 'leah-flores', name: 'Leah Flores', role: 'project_manager' }] }
];

export const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const useMemory = () => !databaseEnabled() || !organizationId();
const requireOrganization = () => {
  const id = organizationId();
  if (!id) throw new Error('DEFAULT_ORGANIZATION_ID is required when DATABASE_URL is configured');
  return id;
};

async function dbList() {
  const rows = await withTenant(requireOrganization(), async (client) => (await client.query<ProjectRow>(`SELECT p.id::text, p.slug, p.name, p.code, p.status, p.summary, m.id::text AS member_id, m.name AS member_name, m.role AS member_role FROM projects p LEFT JOIN project_members m ON m.project_id = p.id WHERE p.organization_id = current_setting('app.current_organization_id')::uuid ORDER BY p.created_at, m.created_at`)).rows);
  const projects = new Map<string, ProjectRecord>();
  for (const row of rows) {
    const project = projects.get(row.slug) ?? { id: row.slug, name: row.name, code: row.code, status: row.status, summary: row.summary, members: [] };
    if (row.member_id && row.member_name && row.member_role) project.members.push({ id: row.member_id, name: row.member_name, role: row.member_role });
    projects.set(row.slug, project);
  }
  return [...projects.values()];
}

export async function getProjectList(): Promise<ProjectListItem[]> {
  const projects = useMemory() ? memory : await dbList();
  return projects.map((project) => ({ ...project, statusLabel: project.status.replace('_', ' ') }));
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const projects = useMemory() ? memory : await dbList();
  return projects.find((project) => project.id === id) ?? null;
}

export async function createProject(input: { name: string; code: string; status?: ProjectStatus }) {
  const slug = slugify(input.name) || `project-${Date.now()}`;
  const project: ProjectRecord = { id: slug, name: input.name, code: input.code, status: input.status ?? 'planning', summary: 'New project created from the workspace foundation.', members: [] };
  if (useMemory()) {
    if (memory.some((item) => item.id === slug || item.code.toLowerCase() === input.code.toLowerCase())) throw new Error('Project already exists');
    memory.push(project);
    return project;
  }
  await withTenant(requireOrganization(), (client) => client.query('INSERT INTO projects (organization_id, slug, name, code, status, summary) VALUES (current_setting(\'app.current_organization_id\')::uuid, $1, $2, $3, $4, $5)', [slug, input.name, input.code, project.status, project.summary]));
  return project;
}

export async function updateProject(id: string, updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>) {
  const current = await getProjectById(id);
  if (!current) return null;
  if (useMemory()) {
    Object.assign(current, updates);
    return current;
  }
  await withTenant(requireOrganization(), (client) => client.query('UPDATE projects SET name = COALESCE($1, name), code = COALESCE($2, code), status = COALESCE($3, status), summary = COALESCE($4, summary), updated_at = NOW() WHERE slug = $5 AND organization_id = current_setting(\'app.current_organization_id\')::uuid', [updates.name ?? null, updates.code ?? null, updates.status ?? null, updates.summary ?? null, id]));
  return { ...current, ...updates };
}

export async function deleteProject(id: string) {
  const current = await getProjectById(id);
  if (!current) return null;
  if (useMemory()) memory.splice(memory.indexOf(current), 1);
  else await withTenant(requireOrganization(), (client) => client.query('DELETE FROM projects WHERE slug = $1 AND organization_id = current_setting(\'app.current_organization_id\')::uuid', [id]));
  return current;
}

export async function addProjectMember(projectId: string, member: Pick<ProjectMember, 'name' | 'role'>) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  if (project.members.some((item) => item.name.toLowerCase() === member.name.toLowerCase())) throw new Error('Member already exists');
  if (useMemory()) {
    const next = { id: slugify(member.name) || `member-${project.members.length + 1}`, ...member };
    project.members.push(next);
    return next;
  }
  const result = await withTenant(requireOrganization(), (client) => client.query<{ id: string }>('INSERT INTO project_members (organization_id, project_id, name, role) SELECT current_setting(\'app.current_organization_id\')::uuid, id, $1, $2 FROM projects WHERE slug = $3 AND organization_id = current_setting(\'app.current_organization_id\')::uuid RETURNING id::text', [member.name, member.role, projectId]));
  return result.rows[0] ? { id: result.rows[0].id, ...member } : null;
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  const member = project.members.find((item) => item.id === memberId) ?? null;
  if (!member) return null;
  if (useMemory()) project.members = project.members.filter((item) => item.id !== memberId);
  else await withTenant(requireOrganization(), (client) => client.query('DELETE FROM project_members WHERE id = $1 AND organization_id = current_setting(\'app.current_organization_id\')::uuid', [memberId]));
  return member;
}
