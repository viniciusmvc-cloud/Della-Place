import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { sendMagicLinkEmail } from '@/lib/email';
import { createMagicToken, isAllowedAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await safeBody<{ email: string }>(request);
    const email = body?.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) return badRequest('Email inválido');

    if (!(await isAllowedAdmin(email))) {
      return NextResponse.json({ ok: true });
    }

    const token = await createMagicToken(email);
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/verify?token=${token}`;
    await sendMagicLinkEmail(email, link);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
