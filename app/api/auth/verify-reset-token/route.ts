import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { queryOne } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Valida se o token de redefinição de senha ainda é utilizável,
// SEM consumi-lo. Usado pela página /reset-password.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return NextResponse.json({ ok: false });

    const row = await queryOne<{
      email: string;
      expires_at: Date;
      used: number;
    }>(
      'SELECT email, expires_at, used FROM verification_tokens WHERE token = ?',
      [token],
    );

    if (!row || row.used === 1) return NextResponse.json({ ok: false });
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ ok: false });

    return NextResponse.json({ ok: true, email: row.email });
  } catch (err) {
    return serverError(err);
  }
}
