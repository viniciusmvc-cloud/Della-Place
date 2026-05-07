const HASH_KEY = 'della-pace.admin-hash.v1';
const SESSION_KEY = 'della-pace.admin-session';

export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasPasswordSet(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(HASH_KEY);
}

export async function setPassword(password: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const h = await sha256(password);
  localStorage.setItem(HASH_KEY, h);
}

export async function login(password: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(HASH_KEY);
  if (!stored) return false;
  const h = await sha256(password);
  if (h === stored) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return false;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export async function changePassword(
  current: string,
  next: string,
): Promise<boolean> {
  const ok = await login(current);
  if (!ok) return false;
  await setPassword(next);
  return true;
}

export function resetAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HASH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
