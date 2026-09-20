import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const tokenSchema = z.object({ sub: z.string(), email: z.string().email(), organizationId: z.string().uuid(), role: z.string(), permissions: z.array(z.string()) });
export type AuthenticatedUser = z.infer<typeof tokenSchema>;

function secret() { return new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-change-me'); }
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
export const signToken = (user: AuthenticatedUser) => new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('12h').sign(secret());
export async function verifyToken(token: string): Promise<AuthenticatedUser> { return tokenSchema.parse((await jwtVerify(token, secret())).payload); }
