import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, removeProjectMember } from '@/lib/project-data';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const project = getProjectById(params.projectId);

  if (!project) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Project not found' } },
      { status: 404 }
    );
  }

  const member = removeProjectMember(params.projectId, params.memberId);

  if (!member) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Member not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, member });
}
