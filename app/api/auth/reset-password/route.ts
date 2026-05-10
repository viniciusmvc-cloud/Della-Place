import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { sendPasswordChangedEmail } from '@/lib/email';
import {
  consumeMagicToken,
  setPasswordForEmail,
} from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_LENGTH = 8;

// Consome o token de redefinição e seta a nova senha.
// Envia email de confirmação avisando que a senha foi alterada.
export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      token: string;
      newPassword: string;
    }>(request);

    if (!body?.token) return badRequest('Token ausente');
    if (!body.newPassword || body.newPassword.length < MIN_LENGTH) {
      return badRequest(`Senha precisa ter ao menos ${MIN_LENGTH} caracteres`);
    }

    const email = await consumeMagicToken(body.token);
    if (!email) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Solicite um novo email.' },
        { status: 400 },
      );
    }

    await setPasswordForEmail(email, body.newPassword);

    // Aviso de segurança — se não foi o usuário, ele pode reagir
    try {
      await sendPasswordChangedEmail(email);
    } catch {
      // Não bloqueia o reset se o email de confirmação falhar
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
