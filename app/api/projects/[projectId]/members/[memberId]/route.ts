import { NextRequest, NextResponse } from 'next/server';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { getProjectById, removeProjectMember } from '@/lib/project-data';

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string; memberId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project_member.manage')) return forbidden();

  const project = await getProjectById(params.projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
  }

  const member = await removeProjectMember(params.projectId, params.memberId);
  if (!member) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Member not found' } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, member });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: { code: 'method_not_allowed', message: 'Use the collection route to list members' } },
    { status: 405 }
  );
}
