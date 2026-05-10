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
  stock_item_id: string | null;
  stock_name: string | null;
  stock_brand: string | null;
  amount: string;
  unit: string;
  stock_unit: string | null;
  stock_qty: string | null;
  component_menu_id: string | null;
  product_category: string | null;
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

    // Carrega TODAS as receitas (LEFT JOIN pra incluir componentes,
    // que têm component_menu_id mas stock_item_id=NULL)
    const ingredients = await query<IngredientRow>(
      `SELECT ri.menu_item_id, m.name AS menu_name,
              ri.stock_item_id,
              s.name AS stock_name, s.brand AS stock_brand,
              ri.amount, ri.unit,
              s.unit AS stock_unit, s.quantity AS stock_qty,
              ri.component_menu_id,
              p.category AS product_category
         FROM recipe_ingredients ri
         JOIN menu_items m ON m.id = ri.menu_item_id
         LEFT JOIN stock_items s ON s.id = ri.stock_item_id
         LEFT JOIN products p ON p.id = ri.product_id`,
    );

    // Indexa por menu_item_id pra resolver componentes recursivamente
    const recipesByMenu = new Map<string, IngredientRow[]>();
    ingredients.forEach((ing) => {
      const list = recipesByMenu.get(ing.menu_item_id) ?? [];
      list.push(ing);
      recipesByMenu.set(ing.menu_item_id, list);
    });

    const menuIdByName = new Map<string, string>();
    ingredients.forEach((ing) => {
      menuIdByName.set(ing.menu_name.toLowerCase(), ing.menu_item_id);
    });

    const aggMap = new Map<
      string,
      {
        stockItemId: string;
        stockName: string;
        stockBrand: string;
        unit: string;
        category: string;
        needed: number;
        inStock: number;
      }
    >();

    function addIngredient(
      stockId: string,
      stockName: string,
      stockBrand: string,
      stockUnit: string,
      stockQty: number,
      amountInStockUnit: number,
      category: string,
    ) {
      const existing = aggMap.get(stockId);
      if (existing) {
        existing.needed += amountInStockUnit;
      } else {
        aggMap.set(stockId, {
          stockItemId: stockId,
          stockName,
          stockBrand,
          unit: stockUnit,
          category,
          needed: amountInStockUnit,
          inStock: stockQty,
        });
      }
    }

    function expand(menuId: string, multiplier: number, depth = 0) {
      if (depth > 5) return; // proteção contra loops
      const recipe = recipesByMenu.get(menuId) ?? [];
      for (const ing of recipe) {
        const ingAmount = Number(ing.amount) * multiplier;
        if (ing.component_menu_id) {
          // Recursão: expande sub-receita (Disco/Concha)
          expand(ing.component_menu_id, ingAmount, depth + 1);
          continue;
        }
        if (!ing.stock_item_id || !ing.stock_unit) continue;
        let amountInStockUnit = ingAmount;
        if (
          isCompatible(ing.unit, ing.stock_unit) &&
          ing.unit !== ing.stock_unit
        ) {
          amountInStockUnit = convertAmount(ingAmount, ing.unit, ing.stock_unit);
        }
        addIngredient(
          ing.stock_item_id,
          ing.stock_name ?? ing.stock_item_id,
          ing.stock_brand ?? '',
          ing.stock_unit,
          Number(ing.stock_qty ?? 0),
          amountInStockUnit,
          ing.product_category ?? 'cobertura',
        );
      }
    }

    Object.entries(flavorCount).forEach(([flavor, count]) => {
      const menuId = menuIdByName.get(flavor.toLowerCase());
      if (!menuId) return;
      expand(menuId, count);
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
