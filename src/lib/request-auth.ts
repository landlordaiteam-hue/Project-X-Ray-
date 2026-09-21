import { NextResponse } from 'next/server';

export type AuthUser = {
  sub: string;
  organizationId: string;
  permissions: string[];
  roles: string[];
};

export async function currentUser(request: Request | { headers?: Headers }): Promise<AuthUser | null> {
  const headers = request instanceof Request ? request.headers : new Headers(request.headers ?? {});
  const userId = headers.get('x-user-id');
  const authHeader = headers.get('authorization');

  if (!userId && !authHeader) {
    return null;
  }

  return {
    sub: userId ?? 'demo-user',
    organizationId: headers.get('x-organization-id') ?? 'demo-organization',
    permissions: headers.get('x-permissions')?.split(',').filter(Boolean) ?? ['project.read'],
    roles: headers.get('x-roles')?.split(',').filter(Boolean) ?? ['project_manager']
  };
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Unauthorized' } }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ ok: false, error: { code: 'forbidden', message: 'Forbidden' } }, { status: 403 });
}
