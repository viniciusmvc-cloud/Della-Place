import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AvailabilityRow = {
  date: Date;
  capacity: number;
  notes: string | null;
};

function dateToIso(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const rows = await query<AvailabilityRow>(
      'SELECT date, capacity, notes FROM availability ORDER BY date',
    );
    return NextResponse.json(
      rows.map((a) => ({
        date: dateToIso(a.date),
        capacity: a.capacity,
        notes: a.notes ?? '',
      })),
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      date: string;
      capacity?: number;
      notes?: string;
    }>(request);
    if (!body || !body.date) return badRequest('Missing date');
    await execute(
      `INSERT INTO availability (date, capacity, notes)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         capacity = VALUES(capacity),
         notes = VALUES(notes)`,
      [body.date, body.capacity ?? 8, body.notes ?? null],
    );
    return NextResponse.json({ ok: true, date: body.date }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
