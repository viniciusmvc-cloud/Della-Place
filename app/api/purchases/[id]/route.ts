import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { PURCHASE_STATUSES, type PurchaseStatus } from '@/lib/purchases';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLOSE_STATUSES: PurchaseStatus[] = [
  'used',
  'kept',
  'discarded',
  'personal',
];

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

    const body = await safeBody<{
      status?: PurchaseStatus;
      quantity?: number;
      brand?: string | null;
      totalCost?: number;
      productionDate?: string;
      notes?: string | null;
    }>(request);
    if (!body) return badRequest('Corpo vazio');

    const fragments: string[] = [];
    const values: unknown[] = [];

    if (body.status !== undefined) {
      if (!PURCHASE_STATUSES.includes(body.status)) {
        return badRequest('status inválido');
      }
      fragments.push('status = ?');
      values.push(body.status);
      if (CLOSE_STATUSES.includes(body.status)) {
        fragments.push('closed_at = NOW()');
      } else {
        fragments.push('closed_at = NULL');
      }
    }
    if (body.quantity !== undefined) {
      if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
        return badRequest('Quantidade inválida');
      }
      fragments.push('quantity = ?');
      values.push(body.quantity);
    }
    if (body.brand !== undefined) {
      fragments.push('brand = ?');
      values.push(body.brand?.trim() || null);
    }
    if (body.totalCost !== undefined) {
      if (!Number.isFinite(body.totalCost) || body.totalCost < 0) {
        return badRequest('Valor inválido');
      }
      fragments.push('total_cost = ?');
      values.push(body.totalCost);
    }
    if (body.productionDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.productionDate)) {
        return badRequest('Data inválida');
      }
      fragments.push('production_date = ?');
      values.push(body.productionDate);
    }
    if (body.notes !== undefined) {
      fragments.push('notes = ?');
      values.push(body.notes?.trim() || null);
    }
    if (fragments.length === 0) return badRequest('Nada para atualizar');

    values.push(numId);
    await execute(
      `UPDATE purchases SET ${fragments.join(', ')} WHERE id = ?`,
      values,
    );
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

    await execute('DELETE FROM purchases WHERE id = ?', [numId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
