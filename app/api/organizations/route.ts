import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { runQuery, withTenant } from '@/lib/db';

const orgSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100)
});

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();

  const result = await runQuery<{ id: string; name: string; slug: string }>(
    `SELECT o.id, o.name, o.slug
     FROM organizations o
     INNER JOIN organization_memberships om ON om.organization_id = o.id
     WHERE om.user_id = $1
     ORDER BY o.name`,
    [user.sub]
  );

  return NextResponse.json({ ok: true, organizations: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'organization.write')) return forbidden();

  try {
    const input = orgSchema.parse(await request.json());

    const result = await withTenant(user.organizationId, async (client) => {
      const org = await client.query<{ id: string; name: string; slug: string }>(
        `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug`,
        [input.name, input.slug]
      );

      const orgId = org.rows[0].id;

      await client.query(
        `INSERT INTO organization_memberships (organization_id, user_id, role_id)
         SELECT $1, $2, id FROM roles WHERE name = 'exec_admin'
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [orgId, user.sub]
      );

      await logAudit({
        organizationId: orgId,
        userId: user.sub,
        action: 'organization.created',
        entityType: 'organization',
        entityId: orgId,
        details: { name: input.name, slug: input.slug },
        source: 'api.organizations'
      });

      return org.rows[0];
    });

    return NextResponse.json({ ok: true, organization: result }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Invalid organization request' } }, { status: 400 });
  }
}
