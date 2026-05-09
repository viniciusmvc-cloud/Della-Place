'use client';

const STORAGE_KEY = 'della-pace.push.dismissed';
const SW_PATH = '/sw.js';

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function pushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function dismiss() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, '1');
}

export function clearDismissed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration(SW_PATH)) ||
      (await navigator.serviceWorker.register(SW_PATH));
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('SW register failed', err);
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

export type PushRole = 'customer' | 'admin';

export async function subscribeToPush(
  vapidPublicKey: string,
  opts?: { customerCpf?: string; role?: PushRole },
): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(vapidPublicKey),
    }));

  const json = sub.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      customerCpf: opts?.customerCpf || null,
      role: opts?.role ?? 'customer',
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }),
  });

  return sub;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return false;
  try {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {}
  return await sub.unsubscribe();
}
