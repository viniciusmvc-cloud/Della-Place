import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import {
  getCurrentAdmin,
  getPasswordHash,
  setPasswordForEmail,
  verifyPasswordHash,
} from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<{
      currentPassword?: string;
      newPassword: string;
    }>(request);
    if (!body?.newPassword || body.newPassword.length < MIN_LENGTH) {
      return badRequest(`Senha precisa ter ao menos ${MIN_LENGTH} caracteres`);
    }

    const existingHash = await getPasswordHash(me.email);
    if (existingHash) {
      if (!body.currentPassword) {
        return badRequest('Informe a senha atual');
      }
      const ok = await verifyPasswordHash(body.currentPassword, existingHash);
      if (!ok) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 401 },
        );
      }
    }

    await setPasswordForEmail(me.email, body.newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
