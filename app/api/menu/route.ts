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
  type: string | null;
  category: string | null;
};

type IngredientRow = {
  id: number;
  menu_item_id: string;
  stock_item_id: string;
  product_id: number | null;
  component_menu_id: string | null;
  amount: string;
  unit: string;
};

export async function GET() {
  try {
    let items: MenuRow[];
    let ingredients: IngredientRow[];
    try {
      items = await query<MenuRow>(
        'SELECT id, name, description, price, cost, active, type, category FROM menu_items ORDER BY name',
      );
      ingredients = await query<IngredientRow>(
        'SELECT id, menu_item_id, stock_item_id, product_id, component_menu_id, amount, unit FROM recipe_ingredients',
      );
    } catch {
      // Fallback: schema antigo sem type/category/component_menu_id
      items = await query<MenuRow>(
        'SELECT id, name, description, price, cost, active FROM menu_items ORDER BY name',
      );
      ingredients = await query<IngredientRow>(
        'SELECT id, menu_item_id, stock_item_id, product_id, amount, unit FROM recipe_ingredients',
      );
    }

    const result = items.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? '',
      price: Number(m.price),
      cost: Number(m.cost),
      active: m.active === 1,
      type: (m.type === 'base' ? 'base' : 'pizza') as 'pizza' | 'base',
      category: m.category ?? null,
      ingredients: ingredients
        .filter((ing) => ing.menu_item_id === m.id)
        .map((ing) => ({
          stockItemId: ing.stock_item_id,
          productId: ing.product_id,
          componentMenuId: ing.component_menu_id ?? null,
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
