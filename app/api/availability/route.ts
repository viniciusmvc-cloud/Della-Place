// /api/availability/route.ts - VERSÃO CORRIGIDA COM DEADLINE
// Mudanças: Adiciona suporte a order_deadline_at em GET e POST

import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

// ✅ NOVO: Tipo com order_deadline_at
type AvailabilityRow = {
  date: Date;
  capacity: number;
  notes: string | null;
  start_hour: string | null;
  flavors_json: string | null;
  order_deadline_at: Date | null;  // ✅ NOVO CAMPO
};

// Helper functions (mantém as existentes)
const dateToIso = (d: Date) => d.toISOString().split('T')[0];
const normalizeHour = (h?: string) => h?.slice(0, 5) ?? '18:00';
const parseFlavorIds = (json: string | null) =>
  json ? JSON.parse(json).filter((x: unknown) => typeof x === 'string') : [];

export async function GET() {
  try {
    const rows = await query<AvailabilityRow>(
      `SELECT date, capacity, notes, start_hour, flavors_json, order_deadline_at
       FROM availability
       ORDER BY date`,
    );

    return NextResponse.json(
      rows.map((a) => ({
        date: dateToIso(a.date),
        capacity: a.capacity,
        startHour: normalizeHour(a.start_hour),
        notes: a.notes ?? '',
        flavorIds: parseFlavorIds(a.flavors_json),
        // ✅ NOVO: Retornar deadline
        orderDeadlineAt: a.order_deadline_at
          ? new Date(a.order_deadline_at).toISOString()
          : null,
      })),
    );
  } catch (err) {
    console.error('GET /api/availability error:', err);
    return NextResponse.json(
      { error: 'Erro ao carregar disponibilidades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pegar body
    const body = (await request.json()) as {
      date: string;
      capacity?: number;
      startHour?: string;
      notes?: string;
      flavorIds?: string[];
      orderDeadlineAt?: string;  // ✅ NOVO - formato ISO: "2026-05-29T23:59:00Z"
    };

    if (!body || !body.date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    const startHour = normalizeHour(body.startHour);
    const flavorsJson =
      Array.isArray(body.flavorIds) && body.flavorIds.length > 0
        ? JSON.stringify(body.flavorIds.filter((x) => typeof x === 'string'))
        : null;

    // ✅ NOVO: Converter ISO para MySQL DATETIME format
    const deadlineAt = body.orderDeadlineAt
      ? new Date(body.orderDeadlineAt).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await execute(
      `INSERT INTO availability (date, capacity, notes, start_hour, flavors_json, order_deadline_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         capacity = VALUES(capacity),
         notes = VALUES(notes),
         start_hour = VALUES(start_hour),
         flavors_json = VALUES(flavors_json),
         order_deadline_at = VALUES(order_deadline_at)`,  // ✅ NOVO
      [
        body.date,
        body.capacity ?? 8,
        body.notes ?? null,
        `${startHour}:00`,
        flavorsJson,
        deadlineAt,  // ✅ NOVO
      ],
    );

    return NextResponse.json({ ok: true, date: body.date }, { status: 201 });
  } catch (err) {
    console.error('POST /api/availability error:', err);
    return NextResponse.json(
      { error: 'Erro ao salvar disponibilidade' },
      { status: 500 }
    );
  }
}
