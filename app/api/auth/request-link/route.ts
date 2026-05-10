import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { sendPasswordResetEmail } from '@/lib/email';
import { createMagicToken, isAllowedAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Endpoint mantido pra compatibilidade. Agora envia email de redefinição
// de senha (não mais login mágico). Frontend chama daqui o "Esqueci a senha".
export async function POST(request: Request) {
  try {
    const body = await safeBody<{ email: string }>(request);
    const email = body?.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) return badRequest('Email inválido');

    // Resposta uniforme — não vaza se o email está cadastrado ou não
    if (!(await isAllowedAdmin(email))) {
      return NextResponse.json({ ok: true });
    }

    const token = await createMagicToken(email);
    const origin = new URL(request.url).origin;
    const link = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, link);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
