import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import {
  findAdminByEmail,
  getPasswordHash,
  setSessionCookie,
  verifyPasswordHash,
} from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await safeBody<{ email: string; password: string }>(request);
    if (!body?.email || !body?.password) {
      return badRequest('Email e senha são obrigatórios');
    }
    const email = body.email.trim().toLowerCase();
    const admin = await findAdminByEmail(email);
    if (!admin || !admin.active) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 },
      );
    }
    const hash = await getPasswordHash(email);
    const ok = await verifyPasswordHash(body.password, hash);
    if (!ok) {
      return NextResponse.json(
        {
          error: hash
            ? 'Email ou senha inválidos'
            : 'Senha não definida. Use "Receber link por email" pra entrar e configure a senha em Configurações.',
        },
        { status: 401 },
      );
    }
    await setSessionCookie(email);
    return NextResponse.json({
      ok: true,
      user: { email: admin.email, name: admin.name },
    });
  } catch (err) {
    return serverError(err);
  }
}
