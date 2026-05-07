import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StockRow = {
  id: string;
  name: string;
  brand: string;
  supplier: string;
  unit_price: string;
  quantity: string;
  unit: string;
  min_quantity: string;
  notes: string | null;
  updated_at: Date;
};

export async function GET() {
  try {
    const rows = await query<StockRow>(
      'SELECT id, name, brand, supplier, unit_price, quantity, unit, min_quantity, notes, updated_at FROM stock_items ORDER BY name',
    );
    return NextResponse.json(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        brand: s.brand,
        supplier: s.supplier,
        unitPrice: Number(s.unit_price),
        quantity: Number(s.quantity),
        unit: s.unit,
        minQuantity: Number(s.min_quantity),
        notes: s.notes ?? '',
        updatedAt: new Date(s.updated_at).toISOString(),
      })),
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      id: string;
      name: string;
      brand?: string;
      supplier?: string;
      unitPrice: number;
      quantity?: number;
      unit?: string;
      minQuantity?: number;
      notes?: string;
    }>(request);
    if (!body || !body.id || !body.name) return badRequest('Missing id or name');
    await execute(
      'INSERT INTO stock_items (id, name, brand, supplier, unit_price, quantity, unit, min_quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        body.id,
        body.name,
        body.brand ?? '',
        body.supplier ?? '',
        body.unitPrice,
        body.quantity ?? 0,
        body.unit ?? 'un',
        body.minQuantity ?? 0,
        body.notes ?? null,
      ],
    );
    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
