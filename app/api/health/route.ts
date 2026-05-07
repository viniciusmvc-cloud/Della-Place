import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await query<{ count: number }>(
      'SELECT COUNT(*) AS count FROM menu_items',
    );
    return NextResponse.json({
      ok: true,
      database: 'connected',
      menu_items_count: rows[0]?.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Database connection failed',
        detail: message,
      },
      { status: 500 },
    );
  }
}
