import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/project-data';

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
