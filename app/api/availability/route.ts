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
  order_deadline_at?: Date | null;
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

/**
 * Converte ISO string vinda do cliente (UTC ou com offset) para
 * o formato MySQL DATETIME ('YYYY-MM-DD HH:MM:SS') em UTC.
 * Aceita também valores datetime-local sem timezone — interpretados como
 * America/Sao_Paulo (UTC-3, sem horário de verão no Brasil atual).
 */
function isoToMysqlDatetime(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const trimmed = v.trim();
  // datetime-local (sem timezone): "2026-05-29T23:59"
  // Trato como America/Sao_Paulo: adiciono "-03:00".
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const isoWithTz = hasTz ? trimmed : `${trimmed}:00-03:00`;
  const d = new Date(isoWithTz);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function GET() {
  try {
    let rows: AvailabilityRow[];
    let hasDeadlineColumn = true;
    try {
      rows = await query<AvailabilityRow>(
        'SELECT date, capacity, notes, start_hour, flavors_json, order_deadline_at FROM availability ORDER BY date',
      );
    } catch {
      // Fallback: coluna order_deadline_at ainda não foi adicionada ao banco.
      hasDeadlineColumn = false;
      rows = await query<AvailabilityRow>(
        'SELECT date, capacity, notes, start_hour, flavors_json FROM availability ORDER BY date',
      );
    }
    return NextResponse.json(
      rows.map((a) => ({
        date: dateToIso(a.date),
        capacity: a.capacity,
        startHour: normalizeHour(a.start_hour),
        notes: a.notes ?? '',
        flavorIds: parseFlavorIds(a.flavors_json),
        orderDeadlineAt:
          hasDeadlineColumn && a.order_deadline_at
            ? new Date(a.order_deadline_at).toISOString()
            : null,
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
      orderDeadlineAt?: string | null;
    }>(request);
    if (!body || !body.date) return badRequest('Missing date');
    const startHour = normalizeHour(body.startHour ?? '18:00');
    const flavorsJson =
      Array.isArray(body.flavorIds) && body.flavorIds.length > 0
        ? JSON.stringify(body.flavorIds.filter((x) => typeof x === 'string'))
        : null;
    const deadlineMysql = isoToMysqlDatetime(body.orderDeadlineAt);
    try {
      await execute(
        `INSERT INTO availability (date, capacity, notes, start_hour, flavors_json, order_deadline_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           capacity = VALUES(capacity),
           notes = VALUES(notes),
           start_hour = VALUES(start_hour),
           flavors_json = VALUES(flavors_json),
           order_deadline_at = VALUES(order_deadline_at)`,
        [
          body.date,
          body.capacity ?? 8,
          body.notes ?? null,
          `${startHour}:00`,
          flavorsJson,
          deadlineMysql,
        ],
      );
    } catch (err) {
      // Fallback: coluna order_deadline_at ainda não migrada. Salva sem deadline.
      const msg = err instanceof Error ? err.message : String(err);
      if (/order_deadline_at|Unknown column/i.test(msg)) {
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
      } else {
        throw err;
      }
    }
    return NextResponse.json({ ok: true, date: body.date }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
