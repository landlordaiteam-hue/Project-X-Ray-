import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject, removeProjectMember, addProjectMember } from '@/lib/project-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const project = getProjectById(params.projectId);

  if (!project) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Project not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, project });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await request.json();
    const project = updateProject(params.projectId, {
      name: body.name,
      code: body.code,
      status: body.status
    });

    if (!project) {
      return NextResponse.json(
        { ok: false, error: { code: 'not_found', message: 'Project not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, project });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'Unable to update project' } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const project = getProjectById(params.projectId);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Project not found' } },
      { status: 404 }
    );
  }

  const projectList = require('@/lib/project-data');
  delete projectList.PROJECT_CATALOG[params.projectId];

  return NextResponse.json({ ok: true, deleted: project });
}
