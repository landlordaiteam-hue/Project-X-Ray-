import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { createProject, getProjectList } from '@/lib/project-data';

const projectSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(32),
  status: z.enum(['planning', 'active', 'on_hold', 'complete']).default('planning')
});

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();

  const projects = await getProjectList();
  return NextResponse.json({ ok: true, projects });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();

  try {
    const payload = projectSchema.parse(await request.json());
    const project = await createProject(payload);
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to create project' } }, { status: 400 });
  }
}
