import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { execute, query, queryOne } from './db';

const SESSION_COOKIE = 'della-pace.session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias
const TOKEN_TTL_MS = 1000 * 60 * 15; // 15 min

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('NEXTAUTH_SECRET must be set (32+ chars recommended)');
  }
  return new TextEncoder().encode(secret);
}

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
};

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const row = await queryOne<{
    id: number;
    email: string;
    name: string | null;
    active: number;
  }>(
    'SELECT id, email, name, active FROM admin_users WHERE email = ?',
    [email.toLowerCase()],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    active: row.active === 1,
  };
}

export async function isAllowedAdmin(email: string): Promise<boolean> {
  const user = await findAdminByEmail(email);
  return !!user && user.active;
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createMagicToken(email: string): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  await execute(
    'INSERT INTO verification_tokens (token, email, expires_at, used) VALUES (?, ?, ?, 0)',
    [token, email.toLowerCase(), expires],
  );
  return token;
}

export async function consumeMagicToken(token: string): Promise<string | null> {
  const row = await queryOne<{
    email: string;
    expires_at: Date;
    used: number;
  }>(
    'SELECT email, expires_at, used FROM verification_tokens WHERE token = ?',
    [token],
  );
  if (!row || row.used === 1) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  await execute(
    'UPDATE verification_tokens SET used = 1 WHERE token = ?',
    [token],
  );
  await execute(
    'UPDATE admin_users SET last_login_at = NOW() WHERE email = ?',
    [row.email],
  );
  return row.email;
}

export async function cleanExpiredTokens(): Promise<void> {
  await execute(
    'DELETE FROM verification_tokens WHERE expires_at < NOW() OR used = 1',
  );
}

export async function createSessionToken(email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(email: string): Promise<void> {
  const token = await createSessionToken(email);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const email = await getSessionEmail();
  if (!email) return null;
  const admin = await findAdminByEmail(email);
  if (!admin || !admin.active) return null;
  return admin;
}

export async function listAdmins(): Promise<AdminUser[]> {
  const rows = await query<{
    id: number;
    email: string;
    name: string | null;
    active: number;
  }>('SELECT id, email, name, active FROM admin_users ORDER BY email');
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    active: r.active === 1,
  }));
}
