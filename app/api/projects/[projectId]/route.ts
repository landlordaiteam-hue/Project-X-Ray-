import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { runQuery, withTenant } from '@/lib/db';

const projectSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(80),
  status: z.enum(['planning', 'active', 'on_hold', 'complete']).default('planning')
});

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();

  const result = await runQuery<{ id: string; organization_id: string; name: string; code: string; status: string; created_at: string }>(
    `SELECT id, organization_id, name, code, status, created_at FROM projects WHERE organization_id = $1 ORDER BY created_at DESC`,
    [user.organizationId]
  );

  return NextResponse.json({ ok: true, projects: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();

  try {
    const body = projectSchema.parse(await request.json());

    const project = await withTenant(user.organizationId, async (client) => {
      const result = await client.query<{ id: string; organization_id: string; name: string; code: string; status: string }>(
        `INSERT INTO projects (organization_id, name, code, status) VALUES ($1, $2, $3, $4) RETURNING id, organization_id, name, code, status`,
        [user.organizationId, body.name, body.code, body.status]
      );

      const created = result.rows[0];

      await logAudit({
        organizationId: user.organizationId,
        userId: user.sub,
        action: 'project.created',
        entityType: 'project',
        entityId: created.id,
        details: { name: created.name, code: created.code, status: created.status },
        source: 'api.projects'
      });

      return created;
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Invalid project request' } }, { status: 400 });
  }
}
