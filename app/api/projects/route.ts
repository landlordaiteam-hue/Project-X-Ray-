import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getProjectList, createProject, updateProject, addProjectMember, removeProjectMember } from '@/lib/project-data';

export async function GET() {
  return NextResponse.json({ ok: true, projects: getProjectList() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = createProject({
      name: body.name,
      code: body.code,
      status: body.status ?? 'planning'
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'Unable to create project' } },
      { status: 400 }
    );
  }
}
