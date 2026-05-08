import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';
import { query } from '@/lib/db';
import { convertAmount, isCompatible } from '@/lib/units';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OrderItemFlat = { flavor: string; finish: string };
type IngredientRow = {
  menu_item_id: string;
  menu_name: string;
  stock_item_id: string;
  stock_name: string;
  stock_brand: string;
  amount: string;
  unit: string;
  stock_unit: string;
  stock_qty: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Missing ?date=YYYY-MM-DD' }, { status: 400 });
    }

    const items = await query<OrderItemFlat>(
      `SELECT oi.flavor, oi.finish
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
        WHERE o.delivery_date = ?
          AND o.status IN ('pendente','confirmado','pago')`,
      [date],
    );

    const flavorCount: Record<string, number> = {};
    items.forEach((it) => {
      flavorCount[it.flavor] = (flavorCount[it.flavor] || 0) + 1;
    });

    if (Object.keys(flavorCount).length === 0) {
      return NextResponse.json({
        date,
        totalPizzas: 0,
        byFlavor: [],
        ingredients: [],
      });
    }

    const ingredients = await query<IngredientRow>(
      `SELECT m.id AS menu_item_id, m.name AS menu_name,
              s.id AS stock_item_id, s.name AS stock_name, s.brand AS stock_brand,
              ri.amount, ri.unit,
              s.unit AS stock_unit, s.quantity AS stock_qty
         FROM recipe_ingredients ri
         JOIN menu_items m ON m.id = ri.menu_item_id
         JOIN stock_items s ON s.id = ri.stock_item_id`,
    );

    const aggMap = new Map<
      string,
      {
        stockItemId: string;
        stockName: string;
        stockBrand: string;
        unit: string;
        needed: number;
        inStock: number;
      }
    >();

    ingredients.forEach((ing) => {
      const pizzasOfThisFlavor = flavorCount[ing.menu_name] || 0;
      if (pizzasOfThisFlavor === 0) return;
      const ingAmount = Number(ing.amount) * pizzasOfThisFlavor;
      let amountInStockUnit = ingAmount;
      if (isCompatible(ing.unit, ing.stock_unit) && ing.unit !== ing.stock_unit) {
        amountInStockUnit = convertAmount(ingAmount, ing.unit, ing.stock_unit);
      }
      const key = ing.stock_item_id;
      const existing = aggMap.get(key);
      if (existing) {
        existing.needed += amountInStockUnit;
      } else {
        aggMap.set(key, {
          stockItemId: ing.stock_item_id,
          stockName: ing.stock_name,
          stockBrand: ing.stock_brand,
          unit: ing.stock_unit,
          needed: amountInStockUnit,
          inStock: Number(ing.stock_qty),
        });
      }
    });

    const totalPizzas = Object.values(flavorCount).reduce((s, n) => s + n, 0);

    return NextResponse.json({
      date,
      totalPizzas,
      byFlavor: Object.entries(flavorCount).map(([name, count]) => ({ name, count })),
      ingredients: Array.from(aggMap.values()).map((ing) => ({
        ...ing,
        deficit: Math.max(0, ing.needed - ing.inStock),
        ok: ing.inStock >= ing.needed,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
