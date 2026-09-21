import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { deleteProject, getProjectById, updateProject } from '@/lib/project-data';

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().min(2).max(32).optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'complete']).optional(),
    summary: z.string().trim().min(2).max(240).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.read')) return forbidden();

  const project = await getProjectById(params.projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, project });
}

export async function PATCH(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();

  try {
    const payload = patchSchema.parse(await request.json());
    const project = await updateProject(params.projectId, payload);
    if (!project) {
      return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
    }

    return NextResponse.json({ ok: true, project });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_request', message: 'Unable to update project' } },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!hasPermission(user.permissions, 'project.write')) return forbidden();

  const project = await deleteProject(params.projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 });
  }

  return NextResponse.json({ ok: true, project });
}
