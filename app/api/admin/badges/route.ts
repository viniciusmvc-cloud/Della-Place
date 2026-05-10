import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { queryOne } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CountRow = { n: number | string };

async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const row = await queryOne<CountRow>(sql, params);
    if (!row) return 0;
    const v = typeof row.n === 'string' ? Number(row.n) : row.n;
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [pedidos, comunidade, sugestoes, clientes] = await Promise.all([
      safeCount(
        "SELECT COUNT(*) AS n FROM orders WHERE status = 'pendente'",
      ),
      safeCount(
        "SELECT COUNT(*) AS n FROM community_posts WHERE status = 'pending'",
      ),
      safeCount(
        "SELECT COUNT(*) AS n FROM customer_suggestions WHERE status = 'new'",
      ),
      safeCount(
        'SELECT COUNT(*) AS n FROM customers WHERE created_at >= (NOW() - INTERVAL 48 HOUR)',
      ),
    ]);

    const total = pedidos + comunidade + sugestoes + clientes;

    return NextResponse.json({
      pedidos,
      comunidade,
      sugestoes,
      clientes,
      total,
    });
  } catch (err) {
    return serverError(err);
  }
}
