import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { getCurrentAdmin, listAdmins } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const users = await listAdmins();
    return NextResponse.json(users);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<{ email: string; name?: string }>(request);
    const email = body?.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) return badRequest('Email inválido');

    await execute(
      'INSERT INTO admin_users (email, name, active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1',
      [email, body?.name?.trim() || null],
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
