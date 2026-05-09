import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SubscribeBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  customerCpf?: string | null;
  userAgent?: string | null;
};

function hashEndpoint(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<SubscribeBody>(request);
    if (
      !body ||
      typeof body.endpoint !== 'string' ||
      !body.keys?.p256dh ||
      !body.keys?.auth
    ) {
      return badRequest('Subscription inválida');
    }

    const endpointHash = hashEndpoint(body.endpoint);
    const cpf = body.customerCpf?.replace(/\D/g, '') || null;
    const ua = body.userAgent?.slice(0, 500) || null;

    await execute(
      `INSERT INTO push_subscriptions
         (endpoint, endpoint_hash, p256dh, auth, customer_cpf, user_agent, active, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         customer_cpf = COALESCE(VALUES(customer_cpf), customer_cpf),
         user_agent = VALUES(user_agent),
         active = 1,
         last_used_at = NOW()`,
      [body.endpoint, endpointHash, body.keys.p256dh, body.keys.auth, cpf, ua],
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await safeBody<{ endpoint: string }>(request);
    if (!body?.endpoint) return badRequest('endpoint obrigatório');
    const endpointHash = hashEndpoint(body.endpoint);
    await execute(
      'UPDATE push_subscriptions SET active = 0 WHERE endpoint_hash = ?',
      [endpointHash],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
