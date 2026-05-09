import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = ['new', 'read', 'done', 'archived'] as const;
type SuggestionStatus = (typeof ALLOWED_STATUS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return badRequest('ID inválido');

    const body = await safeBody<{ status?: SuggestionStatus }>(request);
    if (!body || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return badRequest('status inválido');
    }

    await execute('UPDATE customer_suggestions SET status = ? WHERE id = ?', [
      body.status,
      numId,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return badRequest('ID inválido');

    await execute('DELETE FROM customer_suggestions WHERE id = ?', [numId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
