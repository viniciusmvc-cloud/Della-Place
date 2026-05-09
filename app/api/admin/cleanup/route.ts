import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = [
  'orders',
  'customers',
  'purchases',
  'expenses',
  'community_posts',
  'customer_suggestions',
  'push_subscriptions',
  'availability',
] as const;

type CleanupTable = (typeof ALLOWED)[number];

export async function POST(request: Request) {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await safeBody<{ tables: CleanupTable[] }>(request);
    if (!body || !Array.isArray(body.tables) || body.tables.length === 0) {
      return badRequest('Selecione pelo menos uma tabela');
    }

    const results: Record<string, number> = {};

    for (const table of body.tables) {
      if (!ALLOWED.includes(table)) continue;
      try {
        if (table === 'orders') {
          await execute('DELETE FROM order_items', []);
          const r = (await execute('DELETE FROM orders', [])) as unknown as {
            affectedRows: number;
          };
          results.orders = r.affectedRows ?? 0;
        } else {
          const r = (await execute(`DELETE FROM ${table}`, [])) as unknown as {
            affectedRows: number;
          };
          results[table] = r.affectedRows ?? 0;
        }
      } catch (err) {
        results[table] = -1;
      }
    }

    return NextResponse.json({ ok: true, deleted: results });
  } catch (err) {
    return serverError(err);
  }
}
