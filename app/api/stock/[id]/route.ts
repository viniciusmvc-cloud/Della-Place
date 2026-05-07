import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await safeBody<{
      name?: string;
      brand?: string;
      supplier?: string;
      unitPrice?: number;
      quantity?: number;
      unit?: string;
      minQuantity?: number;
      notes?: string;
    }>(request);
    if (!body) return badRequest('Invalid body');

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name);
    }
    if (body.brand !== undefined) {
      fields.push('brand = ?');
      values.push(body.brand);
    }
    if (body.supplier !== undefined) {
      fields.push('supplier = ?');
      values.push(body.supplier);
    }
    if (body.unitPrice !== undefined) {
      fields.push('unit_price = ?');
      values.push(body.unitPrice);
    }
    if (body.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(body.quantity);
    }
    if (body.unit !== undefined) {
      fields.push('unit = ?');
      values.push(body.unit);
    }
    if (body.minQuantity !== undefined) {
      fields.push('min_quantity = ?');
      values.push(body.minQuantity);
    }
    if (body.notes !== undefined) {
      fields.push('notes = ?');
      values.push(body.notes);
    }

    if (fields.length === 0) return NextResponse.json({ ok: true });

    await execute(
      `UPDATE stock_items SET ${fields.join(', ')} WHERE id = ?`,
      [...values, id],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await execute('DELETE FROM stock_items WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
