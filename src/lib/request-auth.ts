import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type AuthenticatedUser } from './auth';
import { hasPermission } from './rbac';
export async function currentUser(request: NextRequest): Promise<AuthenticatedUser | null> { const header = request.headers.get('authorization'); if (!header?.startsWith('Bearer ')) return null; try { return await verifyToken(header.slice(7)); } catch { return null; } }
export function unauthorized() { return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 }); }
export function forbidden() { return NextResponse.json({ ok: false, error: { code: 'forbidden', message: 'Forbidden' } }, { status: 403 }); }
export async function requirePermission(request: NextRequest, permission: string): Promise<AuthenticatedUser | null> { const user = await currentUser(request); return user && hasPermission(user.permissions, permission) ? user : null; }
