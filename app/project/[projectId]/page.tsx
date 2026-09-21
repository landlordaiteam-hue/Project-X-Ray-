import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { withTenant } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string; memberId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project_member.manage')) return forbidden();

  try {
    const deleted = await withTenant(user.organizationId, async (client) => {
      const result = await client.query<{ id: string; user_id: string }>(
        `DELETE FROM project_members WHERE id = $1 AND project_id = $2 AND organization_id = $3 RETURNING id, user_id`,
        [params.memberId, params.projectId, user.organizationId]
      );

      if (!result.rowCount) {
        throw new Error('Member not found');
      }

      await logAudit({
        organizationId: user.organizationId,
        userId: user.sub,
        action: 'project.member.removed',
        entityType: 'project_member',
        entityId: result.rows[0].id,
        details: { projectId: params.projectId, memberId: params.memberId, userId: result.rows[0].user_id },
        source: 'api.project.members'
      });

      return result.rows[0];
    });

    return NextResponse.json({ ok: true, member: deleted });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to remove member' } }, { status: 400 });
  }
}
