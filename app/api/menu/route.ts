import { NextResponse } from 'next/server';
import { badRequest, safeBody, serverError } from '@/lib/api-helpers';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  cost: string;
  active: number;
};

type IngredientRow = {
  id: number;
  menu_item_id: string;
  stock_item_id: string;
  product_id: number | null;
  amount: string;
  unit: string;
};

export async function GET() {
  try {
    const items = await query<MenuRow>(
      'SELECT id, name, description, price, cost, active FROM menu_items ORDER BY name',
    );
    const ingredients = await query<IngredientRow>(
      'SELECT id, menu_item_id, stock_item_id, product_id, amount, unit FROM recipe_ingredients',
    );

    const result = items.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      price: Number(m.price),
      cost: Number(m.cost),
      active: m.active === 1,
      ingredients: ingredients
        .filter((ing) => ing.menu_item_id === m.id)
        .map((ing) => ({
          stockItemId: ing.stock_item_id,
          productId: ing.product_id,
          amount: Number(ing.amount),
          unit: ing.unit,
        })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      id: string;
      name: string;
      description?: string;
      price: number;
      cost?: number;
      active?: boolean;
    }>(request);
    if (!body || !body.id || !body.name) return badRequest('Missing id or name');

    await execute(
      'INSERT INTO menu_items (id, name, description, price, cost, active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        body.id,
        body.name,
        body.description ?? '',
        body.price,
        body.cost ?? 0,
        body.active === false ? 0 : 1,
      ],
    );

    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
