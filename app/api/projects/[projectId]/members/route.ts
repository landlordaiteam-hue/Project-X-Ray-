import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { runQuery, withTenant } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().min(2).max(80).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'complete']).optional()
});

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();

  const result = await runQuery<{ id: string; organization_id: string; name: string; code: string; status: string }>(
    `SELECT id, organization_id, name, code, status FROM projects WHERE id = $1 AND organization_id = $2`,
    [params.projectId, user.organizationId]
  );

  if (!result.rowCount) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, project: result.rows[0] });
}

export async function PATCH(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();

  try {
    const input = updateSchema.parse(await request.json());

    const result = await withTenant(user.organizationId, async (client) => {
      const values: string[] = [];
      const valuesList: unknown[] = [params.projectId, user.organizationId];
      let index = 3;

      if (input.name) { values.push(`name = $${index++}`); valuesList.push(input.name); }
      if (input.code) { values.push(`code = $${index++}`); valuesList.push(input.code); }
      if (input.status) { values.push(`status = $${index++}`); valuesList.push(input.status); }

      if (!values.length) {
        throw new Error('No updates supplied');
      }

      const update = await client.query<{ id: string; organization_id: string; name: string; code: string; status: string }>(
        `UPDATE projects SET ${values.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING id, organization_id, name, code, status`,
        valuesList
      );

      if (!update.rowCount) {
        throw new Error('Project not found');
      }

      await logAudit({
        organizationId: user.organizationId,
        userId: user.sub,
        action: 'project.updated',
        entityType: 'project',
        entityId: params.projectId,
        details: input,
        source: 'api.projects'
      });

      return update.rows[0];
    });

    return NextResponse.json({ ok: true, project: result });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Project update failed' } }, { status: 400 });
  }
}
