import { NextRequest, NextResponse } from 'next/server';
import { addProjectMember, getProjectById } from '@/lib/project-data';

export async function GET(_request: NextRequest, { params }: { params: { projectId: string } }) {
  const project = getProjectById(params.projectId);

  if (!project) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, members: project.members });
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const body = await request.json();

    if (!body.name || !body.role) {
      return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Name and role are required' } }, { status: 400 });
    }

    const member = addProjectMember(params.projectId, {
      name: body.name,
      role: body.role
    });

    if (!member) {
      return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
    }

    return NextResponse.json({ ok: true, member }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to add member' } }, { status: 400 });
  }
}
