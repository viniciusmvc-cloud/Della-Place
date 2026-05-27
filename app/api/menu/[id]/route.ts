import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, transaction } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await safeBody<{
      name?: string;
      description?: string;
      price?: number;
      cost?: number;
      active?: boolean;
      category?: string | null;
      ingredients?: {
        stockItemId?: string | null;
        productId?: number | null;
        componentMenuId?: string | null;
        amount: number;
        unit: string;
      }[];
    }>(request);
    if (!body) return badRequest('Invalid body');

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description);
    }
    if (body.price !== undefined) {
      fields.push('price = ?');
      values.push(body.price);
    }
    if (body.cost !== undefined) {
      fields.push('cost = ?');
      values.push(body.cost);
    }
    if (body.active !== undefined) {
      fields.push('active = ?');
      values.push(body.active ? 1 : 0);
    }
    if (body.category !== undefined) {
      fields.push('category = ?');
      values.push(body.category || null);
    }

    await transaction(async (conn) => {
      if (fields.length > 0) {
        await conn.query(
          `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
          [...values, id],
        );
      }
      if (body.ingredients) {
        await conn.query(
          'DELETE FROM recipe_ingredients WHERE menu_item_id = ?',
          [id],
        );
        for (const ing of body.ingredients) {
          // Sanitiza stockItemId: '' / undefined → NULL (depende da migration v11
          // que tornou stock_item_id NULLABLE; se ainda não foi rodada, MySQL
          // vai falhar e o catch abaixo faz fallback pra '' string vazia, que
          // funcionava no schema antigo).
          const stockItemId =
            typeof ing.stockItemId === 'string' && ing.stockItemId.length > 0
              ? ing.stockItemId
              : null;
          try {
            await conn.query(
              'INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, component_menu_id, amount, unit) VALUES (?, ?, ?, ?, ?, ?)',
              [
                id,
                stockItemId,
                ing.productId ?? null,
                ing.componentMenuId ?? null,
                ing.amount,
                ing.unit,
              ],
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (/component_menu_id|Unknown column/i.test(msg)) {
              // Fallback: schema antigo sem component_menu_id
              await conn.query(
                'INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, amount, unit) VALUES (?, ?, ?, ?, ?)',
                [id, stockItemId, ing.productId ?? null, ing.amount, ing.unit],
              );
            } else if (/stock_item_id|cannot be null/i.test(msg)) {
              // Fallback: migration v11 ainda não rodada, stock_item_id NOT NULL.
              // Usa string vazia (admin precisa rodar migration logo).
              await conn.query(
                'INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, component_menu_id, amount, unit) VALUES (?, ?, ?, ?, ?, ?)',
                [
                  id,
                  stockItemId ?? '',
                  ing.productId ?? null,
                  ing.componentMenuId ?? null,
                  ing.amount,
                  ing.unit,
                ],
              );
            } else {
              throw err;
            }
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await execute('DELETE FROM menu_items WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
