import { NextResponse } from 'next/server';
import { currentUserFromRequest, type AuthUser } from './auth';

export { type AuthUser } from './auth';

export async function currentUser(request: Request | { headers?: Headers }): Promise<AuthUser | null> {
  const headers = request instanceof Request ? request.headers : new Headers(request.headers ?? {});
  const requestObject = new Request('http://localhost', { headers });
  return currentUserFromRequest(requestObject);
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Unauthorized' } }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ ok: false, error: { code: 'forbidden', message: 'Forbidden' } }, { status: 403 });
}
