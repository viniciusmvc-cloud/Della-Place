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
    const body = await safeBody<{
      status: Status;
      cancellationReason?: string | null;
    }>(request);
    if (!body || !VALID_STATUS.includes(body.status)) {
      return badRequest('Invalid status');
    }
    const reason =
      body.status === 'cancelado' && typeof body.cancellationReason === 'string'
        ? body.cancellationReason.trim() || null
        : body.status === 'cancelado'
          ? null
          : null; // Limpa motivo se status muda pra qualquer coisa que não seja cancelado

    try {
      await execute(
        'UPDATE orders SET status = ?, cancellation_reason = ? WHERE id = ?',
        [body.status, reason, id],
      );
    } catch (err) {
      // Fallback: coluna cancellation_reason ainda não foi migrada.
      const msg = err instanceof Error ? err.message : String(err);
      if (/cancellation_reason|Unknown column/i.test(msg)) {
        await execute('UPDATE orders SET status = ? WHERE id = ?', [
          body.status,
          id,
        ]);
      } else {
        throw err;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
