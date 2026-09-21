import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateCredentials, destroySession, getSessionToken } from '@/lib/auth';
import { currentUser, unauthorized } from '@/lib/request-auth';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), organizationId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const session = await authenticateCredentials(input.email, input.password, input.organizationId);
    if (!session) return unauthorized();
    return NextResponse.json({ ok: true, session: { expiresIn: session.expiresIn } });
  } catch {
    return unauthorized();
  }
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  return NextResponse.json({ ok: true, user });
}

export async function DELETE(request: NextRequest) {
  await destroySession(await getSessionToken(request));
  return NextResponse.json({ ok: true });
}
