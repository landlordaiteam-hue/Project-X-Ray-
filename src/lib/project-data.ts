import { databaseEnabled, query, withTransaction } from './db';

export type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'complete';
export type ProjectRole = 'exec_admin' | 'project_manager' | 'field_staff';
export type ProjectMember = { id: string; name: string; role: ProjectRole };
export type ProjectRecord = { id: string; name: string; code: string; status: ProjectStatus; summary: string; members: ProjectMember[] };
export type ProjectListItem = ProjectRecord & { statusLabel: string };

const organizationId = () => process.env.DEFAULT_ORGANIZATION_ID;
const memory: ProjectRecord[] = [
  { id: 'alpha-tower', name: 'Alpha Tower', code: 'AT-101', status: 'active', summary: 'Core commercial tower rebuild and tenant-fit out coordination.', members: [{ id: 'alicia-stone', name: 'Alicia Stone', role: 'project_manager' }, { id: 'marcus-hall', name: 'Marcus Hall', role: 'field_staff' }, { id: 'jenna-patel', name: 'Jenna Patel', role: 'exec_admin' }] },
  { id: 'northline-logistics', name: 'Northline Logistics', code: 'NL-220', status: 'planning', summary: 'Regional distribution center expansion and staging plan.', members: [{ id: 'nia-brooks', name: 'Nia Brooks', role: 'project_manager' }, { id: 'rafael-chen', name: 'Rafael Chen', role: 'field_staff' }] },
  { id: 'harbor-suites', name: 'Harbor Suites', code: 'HS-310', status: 'on_hold', summary: 'Hotel conversion and waterfront amenities rework.', members: [{ id: 'priya-shah', name: 'Priya Shah', role: 'exec_admin' }, { id: 'omar-grant', name: 'Omar Grant', role: 'field_staff' }, { id: 'leah-flores', name: 'Leah Flores', role: 'project_manager' }] }
];

export const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fallback = () => !databaseEnabled() || !organizationId();

async function dbList() {
  const result = await query<ProjectRecord & { member_id: string | null; member_name: string | null; member_role: ProjectRole | null }>(`SELECT p.id::text, p.slug, p.name, p.code, p.status, p.summary, m.id::text AS member_id, m.name AS member_name, m.role AS member_role FROM projects p LEFT JOIN project_members m ON m.project_id = p.id WHERE p.organization_id = $1 ORDER BY p.created_at`, [organizationId()]);
  const byId = new Map<string, ProjectRecord>();
  for (const row of result.rows) {
    const project = byId.get(row.id) ?? { id: row.slug, name: row.name, code: row.code, status: row.status, summary: row.summary, members: [] };
    if (row.member_id && row.member_name && row.member_role) project.members.push({ id: row.member_id, name: row.member_name, role: row.member_role });
    byId.set(row.id, project);
  }
  return [...byId.values()];
}

export async function getProjectList(): Promise<ProjectListItem[]> {
  const projects = fallback() ? memory : await dbList();
  return projects.map((p) => ({ ...p, statusLabel: p.status.replace('_', ' ') }));
}

export async function getProjectById(id: string) {
  const projects = fallback() ? memory : await dbList();
  return projects.find((p) => p.id === id) ?? null;
}

export async function createProject(input: { name: string; code: string; status?: ProjectStatus }) {
  const slug = slugify(input.name) || `project-${Date.now()}`;
  if (fallback()) { if (memory.some((p) => p.id === slug || p.code.toLowerCase() === input.code.toLowerCase())) throw new Error('Project already exists'); const project = { id: slug, name: input.name, code: input.code, status: input.status ?? 'planning', summary: 'New project created from the workspace foundation.', members: [] }; memory.push(project); return project; }
  const result = await query<{ id: string }>('INSERT INTO projects (organization_id, slug, name, code, status, summary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text', [organizationId(), slug, input.name, input.code, input.status ?? 'planning', 'New project created from the workspace foundation.']);
  return { id: slug, name: input.name, code: input.code, status: input.status ?? 'planning', summary: 'New project created from the workspace foundation.', members: [] };
}

export async function updateProject(id: string, updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>) { const current = await getProjectById(id); if (!current) return null; if (fallback()) { Object.assign(current, updates); return current; } await query('UPDATE projects SET name = COALESCE($2, name), code = COALESCE($3, code), status = COALESCE($4, status), summary = COALESCE($5, summary), updated_at = NOW() WHERE slug = $1 AND organization_id = $6', [id, updates.name ?? null, updates.code ?? null, updates.status ?? null, updates.summary ?? null, organizationId()]); return { ...current, ...updates }; }
export async function deleteProject(id: string) { const current = await getProjectById(id); if (!current) return null; if (fallback()) { memory.splice(memory.indexOf(current), 1); return current; } await query('DELETE FROM projects WHERE slug = $1 AND organization_id = $2', [id, organizationId()]); return current; }
export async function addProjectMember(id: string, member: Pick<ProjectMember, 'name' | 'role'>) { const project = await getProjectById(id); if (!project) return null; if (project.members.some((m) => m.name.toLowerCase() === member.name.toLowerCase())) throw new Error('Member already exists'); if (fallback()) { const next = { id: slugify(member.name), ...member }; project.members.push(next); return next; } const result = await query<{ id: string }>('INSERT INTO project_members (organization_id, project_id, name, role) SELECT $1, id, $2, $3 FROM projects WHERE slug = $4 AND organization_id = $1 RETURNING id::text', [organizationId(), member.name, member.role, id]); return { id: result.rows[0].id, ...member }; }
export async function removeProjectMember(projectId: string, memberId: string) { const project = await getProjectById(projectId); if (!project) return null; const member = project.members.find((m) => m.id === memberId); if (!member) return null; if (fallback()) project.members = project.members.filter((m) => m.id !== memberId); else await query('DELETE FROM project_members WHERE id = $1 AND organization_id = $2', [memberId, organizationId()]); return member; }
