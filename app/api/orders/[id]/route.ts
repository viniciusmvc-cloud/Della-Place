import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUS = ['pendente', 'confirmado', 'pago', 'cancelado'] as const;
type Status = (typeof VALID_STATUS)[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await safeBody<{ status: Status }>(request);
    if (!body || !VALID_STATUS.includes(body.status)) {
      return badRequest('Invalid status');
    }
    await execute('UPDATE orders SET status = ? WHERE id = ?', [body.status, id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
