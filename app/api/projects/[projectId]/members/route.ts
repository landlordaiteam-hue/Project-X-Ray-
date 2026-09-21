import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { addProjectMember, getProjectById } from '@/lib/project-data';

const memberSchema = z.object({ name: z.string().trim().min(2).max(120), role: z.enum(['exec_admin', 'project_manager', 'field_staff']) });

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) { const user = await currentUser(request); if (!user) return unauthorized(); if (!hasPermission(user.permissions, 'project.read')) return forbidden(); const project = await getProjectById(params.projectId); return project ? NextResponse.json({ ok: true, members: project.members }) : NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 }); }
export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) { const user = await currentUser(request); if (!user) return unauthorized(); if (!hasPermission(user.permissions, 'project_member.manage')) return forbidden(); try { const member = await addProjectMember(params.projectId, memberSchema.parse(await request.json())); return member ? NextResponse.json({ ok: true, member }, { status: 201 }) : NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 }); } catch { return NextResponse.json({ ok: false, error: { code: 'invalid_request', message: 'Unable to add project member' } }, { status: 400 }); } }
