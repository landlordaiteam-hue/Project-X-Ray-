import { NextRequest, NextResponse } from 'next/server';
import { currentUser, forbidden, unauthorized } from '@/lib/request-auth';
import { hasPermission } from '@/lib/rbac';
import { getProjectById, removeProjectMember } from '@/lib/project-data';

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string; memberId: string } }) { const user = await currentUser(request); if (!user) return unauthorized(); if (!hasPermission(user.permissions, 'project_member.manage')) return forbidden(); if (!await getProjectById(params.projectId)) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Project not found' } }, { status: 404 }); const member = await removeProjectMember(params.projectId, params.memberId); return member ? NextResponse.json({ ok: true, member }) : NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Member not found' } }, { status: 404 }); }
