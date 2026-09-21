import { NextResponse } from 'next/server';

export type AuthUser = {
  sub: string;
  organizationId: string;
  permissions: string[];
  roles: string[];
};

export async function currentUser(
  request: Request | { headers?: Headers }
): Promise<AuthUser | null> {
  const headers = request instanceof Request ? request.headers : new Headers(request.headers ?? {});

  const userId = headers.get('x-user-id') ?? 'demo-user';
  const organizationId = headers.get('x-organization-id') ?? 'demo-organization';
  const permissions = headers.get('x-permissions')?.split(',').filter(Boolean) ?? ['project.read'];
  const roles = headers.get('x-roles')?.split(',').filter(Boolean) ?? ['project_manager'];

  if (headers.get('authorization') || headers.get('x-user-id')) {
    return { sub: userId, organizationId, permissions, roles };
  }

  return null;
}

export function unauthorized() {
  return NextResponse.json(
    { ok: false, error: { code: 'unauthorized', message: 'Unauthorized' } },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { ok: false, error: { code: 'forbidden', message: 'Forbidden' } },
    { status: 403 }
  );
}
