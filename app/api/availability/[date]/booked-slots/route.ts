import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = { time_slot: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json([]);
    }
    const rows = await query<Row>(
      `SELECT oi.time_slot
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
        WHERE o.delivery_date = ?
          AND o.status <> 'cancelado'`,
      [date],
    );
    return NextResponse.json(
      Array.from(new Set(rows.map((r) => r.time_slot.slice(0, 5)))),
    );
  } catch (err) {
    return serverError(err);
  }
}
