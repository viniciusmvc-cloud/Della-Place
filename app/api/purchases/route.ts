import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';
import {
  PURCHASE_STATUSES,
  type PurchaseStatus,
} from '@/lib/purchases';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  product_id: number;
  product_name: string;
  product_category: 'massa' | 'molho' | 'cobertura' | 'operacao';
  quantity: string;
  unit: string;
  brand: string | null;
  total_cost: string;
  purchase_date: Date;
  production_date: Date;
  status: PurchaseStatus;
  closed_at: Date | null;
  notes: string | null;
  created_at: Date;
};

function dateToIso(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rowToJson(r: Row) {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productCategory: r.product_category,
    quantity: Number(r.quantity),
    unit: r.unit,
    brand: r.brand,
    totalCost: Number(r.total_cost),
    purchaseDate: dateToIso(r.purchase_date),
    productionDate: dateToIso(r.production_date),
    status: r.status,
    closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : null,
    notes: r.notes,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const productionDate = url.searchParams.get('productionDate');
    const pendingClose = url.searchParams.get('pendingClose');
    const carryover = url.searchParams.get('carryover');

    const where: string[] = [];
    const values: unknown[] = [];

    if (status && PURCHASE_STATUSES.includes(status as PurchaseStatus)) {
      where.push('p.status = ?');
      values.push(status);
    }
    if (productionDate && /^\d{4}-\d{2}-\d{2}$/.test(productionDate)) {
      where.push('p.production_date = ?');
      values.push(productionDate);
    }
    if (pendingClose === '1') {
      where.push("p.status = 'pending'");
      where.push('p.production_date <= CURDATE()');
    }
    if (carryover === '1') {
      where.push("p.status = 'kept'");
    }

    const sql = `
      SELECT p.id, p.product_id, p.quantity, p.unit, p.brand, p.total_cost,
             p.purchase_date, p.production_date, p.status, p.closed_at,
             p.notes, p.created_at,
             pr.name AS product_name, pr.category AS product_category
        FROM purchases p
        JOIN products pr ON pr.id = p.product_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.production_date DESC, p.purchase_date DESC, p.id DESC
    `;
    const rows = await query<Row>(sql, values);
    return NextResponse.json(rows.map(rowToJson));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<{
      productId: number;
      quantity: number;
      unit: string;
      brand?: string | null;
      totalCost: number;
      purchaseDate: string;
      productionDate: string;
      notes?: string | null;
    }>(request);
    if (!body) return badRequest('Corpo vazio');
    if (!Number.isFinite(body.productId)) return badRequest('Produto inválido');
    if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
      return badRequest('Quantidade inválida');
    }
    if (!Number.isFinite(body.totalCost) || body.totalCost < 0) {
      return badRequest('Valor inválido');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.purchaseDate)) {
      return badRequest('Data de compra inválida');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.productionDate)) {
      return badRequest('Data de produção inválida');
    }

    const result = await execute(
      `INSERT INTO purchases
         (product_id, quantity, unit, brand, total_cost,
          purchase_date, production_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        body.productId,
        body.quantity,
        body.unit.trim().slice(0, 16),
        body.brand?.trim() || null,
        body.totalCost,
        body.purchaseDate,
        body.productionDate,
        body.notes?.trim() || null,
      ],
    );
    return NextResponse.json(
      { ok: true, id: (result as unknown as { insertId: number }).insertId },
      { status: 201 },
    );
  } catch (err) {
    return serverError(err);
  }
}
