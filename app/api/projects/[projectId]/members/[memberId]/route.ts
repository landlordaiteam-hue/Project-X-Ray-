import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { runQuery, withTenant } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const memberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['exec_admin', 'project_manager', 'field_staff'])
});

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();

  const members = await runQuery<{
    id: string;
    organization_id: string;
    project_id: string;
    user_id: string;
    role_id: string;
  }>(
    `SELECT id, organization_id, project_id, user_id, role_id FROM project_members WHERE project_id = $1 AND organization_id = $2`,
    [params.projectId, user.organizationId]
  );

  return NextResponse.json({ ok: true, members: members.rows });
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project_member.manage')) return forbidden();

  try {
    const body = memberSchema.parse(await request.json());

    const result = await withTenant(user.organizationId, async (client) => {
      const userExists = await client.query<{ id: string }>(`SELECT id FROM users WHERE id = $1 AND organization_id = $2`, [body.userId, user.organizationId]);
      if (!userExists.rowCount) {
        throw new Error('User not found in organization');
      }

      const role = await client.query<{ id: string }>(`SELECT id FROM roles WHERE name = $1`, [body.role]);
      if (!role.rowCount) {
        throw new Error('Role not found');
      }

      const assigned = await client.query<{ id: string; project_id: string; user_id: string; role_id: string }>(
        `INSERT INTO project_members (organization_id, project_id, user_id, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id
         RETURNING id, project_id, user_id, role_id`,
        [user.organizationId, params.projectId, body.userId, role.rows[0].id]
      );

      await logAudit({
        organizationId: user.organizationId,
        userId: user.sub,
        action: 'project.member.added',
        entityType: 'project_member',
        entityId: assigned.rows[0].id,
        details: { projectId: params.projectId, userId: body.userId, role: body.role },
        source: 'api.project.members'
      });

      return assigned.rows[0];
    });

    return NextResponse.json({ ok: true, member: result }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to add project member' } }, { status: 400 });
  }
}
