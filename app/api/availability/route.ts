import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AvailabilityRow = {
  date: Date;
  capacity: number;
  notes: string | null;
  start_hour: string | null;
};

function normalizeHour(v: unknown): string {
  if (typeof v !== 'string') return '18:00';
  const m = /^(\d{1,2}):(\d{2})/.exec(v.trim());
  if (!m) return '18:00';
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

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
      'SELECT date, capacity, notes, start_hour FROM availability ORDER BY date',
    );
    return NextResponse.json(
      rows.map((a) => ({
        date: dateToIso(a.date),
        capacity: a.capacity,
        startHour: normalizeHour(a.start_hour),
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
      startHour?: string;
      notes?: string;
    }>(request);
    if (!body || !body.date) return badRequest('Missing date');
    const startHour = normalizeHour(body.startHour ?? '18:00');
    await execute(
      `INSERT INTO availability (date, capacity, notes, start_hour)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         capacity = VALUES(capacity),
         notes = VALUES(notes),
         start_hour = VALUES(start_hour)`,
      [body.date, body.capacity ?? 8, body.notes ?? null, `${startHour}:00`],
    );
    return NextResponse.json({ ok: true, date: body.date }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
