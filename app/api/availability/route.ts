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
  flavors_json: string | null;
};

function parseFlavorIds(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

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
      'SELECT date, capacity, notes, start_hour, flavors_json FROM availability ORDER BY date',
    );
    return NextResponse.json(
      rows.map((a) => ({
        date: dateToIso(a.date),
        capacity: a.capacity,
        startHour: normalizeHour(a.start_hour),
        notes: a.notes ?? '',
        flavorIds: parseFlavorIds(a.flavors_json),
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
      flavorIds?: string[];
    }>(request);
    if (!body || !body.date) return badRequest('Missing date');
    const startHour = normalizeHour(body.startHour ?? '18:00');
    const flavorsJson =
      Array.isArray(body.flavorIds) && body.flavorIds.length > 0
        ? JSON.stringify(body.flavorIds.filter((x) => typeof x === 'string'))
        : null;
    await execute(
      `INSERT INTO availability (date, capacity, notes, start_hour, flavors_json)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         capacity = VALUES(capacity),
         notes = VALUES(notes),
         start_hour = VALUES(start_hour),
         flavors_json = VALUES(flavors_json)`,
      [
        body.date,
        body.capacity ?? 8,
        body.notes ?? null,
        `${startHour}:00`,
        flavorsJson,
      ],
    );
    return NextResponse.json({ ok: true, date: body.date }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
