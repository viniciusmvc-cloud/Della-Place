import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SuggestionRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'done' | 'archived';
  created_at: Date;
};

export async function GET() {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = await query<SuggestionRow>(
      'SELECT id, name, email, phone, message, status, created_at FROM customer_suggestions ORDER BY created_at DESC',
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        message: r.message,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      name: string;
      email?: string;
      phone?: string;
      message: string;
    }>(request);
    if (!body || !body.name?.trim() || !body.message?.trim()) {
      return badRequest('Nome e mensagem são obrigatórios');
    }
    await execute(
      'INSERT INTO customer_suggestions (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [
        body.name.trim(),
        body.email?.trim() || null,
        body.phone?.trim() || null,
        body.message.trim(),
      ],
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
