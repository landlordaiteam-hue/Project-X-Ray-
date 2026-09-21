import { databaseEnabled, query, withTenant } from './db';

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

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  code: string;
  status: ProjectStatus;
  summary: string;
  member_id: string | null;
  member_name: string | null;
  member_role: ProjectRole | null;
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

const MEMORY_PROJECTS: ProjectRecord[] = DEFAULT_PROJECTS.map((project) => ({
  ...project,
  members: project.members.map((member) => ({ ...member }))
}));

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const organizationId = () => process.env.DEFAULT_ORGANIZATION_ID;
const useMemoryFallback = () => !databaseEnabled() || !organizationId();
const requireOrganizationId = () => {
  const id = organizationId();
  if (!id) throw new Error('DEFAULT_ORGANIZATION_ID is required when DATABASE_URL is configured');
  return id;
};

async function listProjectsFromDb(): Promise<ProjectRecord[]> {
  const orgId = requireOrganizationId();
  const rows = await withTenant(orgId, async (client) =>
    client.query<ProjectRow>(`
      SELECT p.id::text, p.slug, p.name, p.code, p.status, p.summary,
             m.id::text AS member_id,
             m.name AS member_name,
             m.role AS member_role
      FROM projects p
      LEFT JOIN project_members m ON m.project_id = p.id
      WHERE p.organization_id = current_setting('app.current_organization_id')::uuid
      ORDER BY p.created_at, m.created_at
    `)
  );

  const byId = new Map<string, ProjectRecord>();
  for (const row of rows.rows) {
    const project = byId.get(row.slug) ?? {
      id: row.slug,
      name: row.name,
      code: row.code,
      status: row.status,
      summary: row.summary,
      members: []
    };

    if (row.member_id && row.member_name && row.member_role) {
      project.members.push({
        id: row.member_id,
        name: row.member_name,
        role: row.member_role
      });
    }

    byId.set(row.slug, project);
  }

  return [...byId.values()];
}

export async function getProjectList(): Promise<ProjectListItem[]> {
  const projects = useMemoryFallback() ? MEMORY_PROJECTS : await listProjectsFromDb();
  return projects.map((project) => ({ ...project, statusLabel: project.status.replace('_', ' ') }));
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  const projects = useMemoryFallback() ? MEMORY_PROJECTS : await listProjectsFromDb();
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: { name: string; code: string; status?: ProjectStatus }): Promise<ProjectRecord> {
  const projectId = slugify(input.name) || `project-${Date.now()}`;
  const record: ProjectRecord = {
    id: projectId,
    name: input.name,
    code: input.code,
    status: input.status ?? 'planning',
    summary: 'New project created from the workspace foundation.',
    members: []
  };

  if (useMemoryFallback()) {
    if (MEMORY_PROJECTS.some((project) => project.id === projectId || project.code.toLowerCase() === input.code.toLowerCase())) {
      throw new Error('Project already exists');
    }
    MEMORY_PROJECTS.push(record);
    return record;
  }

  const orgId = requireOrganizationId();
  await withTenant(orgId, async (client) => {
    await client.query(
      "INSERT INTO projects (organization_id, slug, name, code, status, summary) VALUES (current_setting('app.current_organization_id')::uuid, $1, $2, $3, $4, $5)",
      [projectId, input.name, input.code, record.status, record.summary]
    );
  });

  return record;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectRecord, 'name' | 'code' | 'status' | 'summary'>>
): Promise<ProjectRecord | null> {
  const current = await getProjectById(projectId);
  if (!current) return null;

  if (useMemoryFallback()) {
    const next = { ...current, ...updates };
    const idx = MEMORY_PROJECTS.findIndex((project) => project.id === projectId);
    if (idx !== -1) MEMORY_PROJECTS[idx] = next;
    return next;
  }

  const orgId = requireOrganizationId();
  await withTenant(orgId, (client) =>
    client.query(
      "UPDATE projects SET name = COALESCE($1, name), code = COALESCE($2, code), status = COALESCE($3, status), summary = COALESCE($4, summary), updated_at = NOW() WHERE slug = $5 AND organization_id = current_setting('app.current_organization_id')::uuid",
      [updates.name ?? null, updates.code ?? null, updates.status ?? null, updates.summary ?? null, projectId]
    )
  );

  return { ...current, ...updates };
}

export async function deleteProject(projectId: string): Promise<ProjectRecord | null> {
  const current = await getProjectById(projectId);
  if (!current) return null;

  if (useMemoryFallback()) {
    const index = MEMORY_PROJECTS.findIndex((project) => project.id === projectId);
    if (index !== -1) MEMORY_PROJECTS.splice(index, 1);
    return current;
  }

  const orgId = requireOrganizationId();
  await withTenant(orgId, (client) =>
    client.query("DELETE FROM projects WHERE slug = $1 AND organization_id = current_setting('app.current_organization_id')::uuid", [projectId])
  );

  return current;
}

export async function addProjectMember(
  projectId: string,
  member: Pick<ProjectMember, 'name' | 'role'>
): Promise<ProjectMember | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  if (project.members.some((item) => item.name.toLowerCase() === member.name.toLowerCase())) {
    throw new Error('Member already exists');
  }

  if (useMemoryFallback()) {
    const record: ProjectMember = {
      id: slugify(member.name) || `member-${project.members.length + 1}`,
      ...member
    };
    project.members.push(record);
    return record;
  }

  const orgId = requireOrganizationId();
  const result = await withTenant(orgId, (client) =>
    client.query<{ id: string }>(
      "INSERT INTO project_members (organization_id, project_id, name, role) SELECT current_setting('app.current_organization_id')::uuid, id, $1, $2 FROM projects WHERE slug = $3 AND organization_id = current_setting('app.current_organization_id')::uuid RETURNING id::text",
      [member.name, member.role, projectId]
    )
  );

  return result.rows[0] ? { id: result.rows[0].id, ...member } : null;
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<ProjectMember | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const member = project.members.find((item) => item.id === memberId) ?? null;
  if (!member) return null;

  if (useMemoryFallback()) {
    project.members = project.members.filter((item) => item.id !== memberId);
    return member;
  }

  const orgId = requireOrganizationId();
  await withTenant(orgId, (client) =>
    client.query("DELETE FROM project_members WHERE id = $1 AND organization_id = current_setting('app.current_organization_id')::uuid", [memberId])
  );

  return member;
}

export function projectStatusLabel(status: ProjectStatus) {
  return status.replace('_', ' ');
}
