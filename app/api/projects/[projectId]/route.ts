import { NextResponse } from 'next/server';
import { createProject, getProjectList } from '@/lib/project-data';

export async function GET() {
  return NextResponse.json({ ok: true, projects: getProjectList() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Name and code are required' } }, { status: 400 });
    }

    const project = createProject({
      name: body.name,
      code: body.code,
      status: body.status ?? 'planning'
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to create project' } }, { status: 400 });
  }
}
