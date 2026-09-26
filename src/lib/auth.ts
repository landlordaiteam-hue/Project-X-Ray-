import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query, withTenant } from './db';
import { logAuditBestEffort } from './audit';

const SESSION_COOKIE = 'capital_xray_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionClaims = { sub: string; sid: string; org?: string };
export type AuthUser = { sub: string; email: string; name: string; organizationId: string; permissions: string[]; roles: string[] };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters');
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function signSession(claims: SessionClaims) {
  return new SignJWT(claims).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt().setExpirationTime(`${SESSION_TTL_SECONDS}s`).sign(secret());
}

export async function createSession(userId: string, organizationId: string) {
  const sessionId = crypto.randomUUID();
  await query('INSERT INTO sessions (id, user_id, organization_id, expires_at) VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL \'1 second\'))', [sessionId, userId, organizationId, SESSION_TTL_SECONDS]);
  const token = await signSession({ sub: userId, sid: sessionId, org: organizationId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
  return { sessionId, expiresIn: SESSION_TTL_SECONDS };
}

export async function destroySession(token?: string) {
  if (!token) return;
  try {
    const verified = await jwtVerify<SessionClaims>(token, secret());
    await query('UPDATE sessions SET revoked_at = NOW() WHERE id = $1', [verified.payload.sid]);
  } catch {
    // Invalid or expired tokens are already unusable.
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(request?: Request) {
  const header = request?.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function currentUserFromRequest(request?: Request): Promise<AuthUser | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = await getSessionToken(request);
  if (!token) return null;
  try {
    const verified = await jwtVerify<SessionClaims>(token, secret());
    const claims = verified.payload;
    if (!claims.sub || !claims.sid) return null;
    const result = await query<{ id: string; email: string; name: string; organization_id: string; permissions: string[]; roles: string[] }>(
      `SELECT u.id::text, u.email, u.name, om.organization_id::text,
        COALESCE(array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions,
        COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM sessions s JOIN users u ON u.id = s.user_id
       JOIN organization_memberships om ON om.user_id = u.id AND om.organization_id = s.organization_id
       LEFT JOIN membership_roles mr ON mr.membership_id = om.id
       LEFT JOIN roles r ON r.id = mr.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE s.id = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
         AND u.status = 'active' AND om.status = 'active'
       GROUP BY u.id, u.email, u.name, om.organization_id`, [claims.sid]);
    const user = result.rows[0];
    if (!user || (claims.org && claims.org !== user.organization_id)) return null;
    return { sub: user.id, email: user.email, name: user.name, organizationId: user.organization_id, permissions: user.permissions, roles: user.roles };
  } catch {
    return null;
  }
}

export async function authenticateCredentials(email: string, password: string, organizationId: string) {
  const result = await query<{ id: string; password_hash: string; status: string }>('SELECT id::text, password_hash, status FROM users WHERE lower(email) = lower($1)', [email]);
  const user = result.rows[0];
  if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) return null;
  const membership = await query<{ organization_id: string }>(`SELECT organization_id::text FROM organization_memberships WHERE user_id = $1 AND organization_id = $2 AND status = 'active'`, [user.id, organizationId]);
  if (!membership.rows[0]) return null;
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  await logAuditBestEffort({ organizationId, actorId: user.id, action: 'auth.login', entityType: 'session', source: 'auth.credentials' });
  return createSession(user.id, organizationId);
}

export { SESSION_COOKIE };
