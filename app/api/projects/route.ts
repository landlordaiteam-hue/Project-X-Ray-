import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { createProject, getProjectList } from '@/lib/project-data';

const projectSchema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().min(2).max(32), status: z.enum(['planning', 'active', 'on_hold', 'complete']).default('planning') });

export async function GET(request: NextRequest) {
  const user = await currentUser(request); if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();
  return NextResponse.json({ ok: true, projects: await getProjectList() });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request); if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();
  try { const project = await createProject(projectSchema.parse(await request.json())); return NextResponse.json({ ok: true, project }, { status: 201 }); }
  catch { return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to create project' } }, { status: 400 }); }
}
