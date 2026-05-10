import type { StockItem } from '@/lib/stock';
import { convertAmount, isCompatible } from '@/lib/units';

export type RecipeIngredient = {
  stockItemId: string;
  productId?: number | null;
  componentMenuId?: string | null;
  amount: number;
  unit: string;
};

export type MenuItemType = 'pizza' | 'base';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  ingredients: RecipeIngredient[];
  active: boolean;
  type?: MenuItemType;
  category?: string | null;
};

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'marguerita',
    name: 'Marguerita',
    description:
      'Molho de tomate San Marzano, mussarela, tomate cereja, pesto de manjericão e parmesão.',
    price: 58,
    cost: 18,
    ingredients: [],
    active: true,
  },
  {
    id: 'calabria',
    name: 'Calabria',
    description:
      'Molho de tomate San Marzano, mussarela, calabresa, cebola e azeitonas pretas.',
    price: 60,
    cost: 19,
    ingredients: [],
    active: true,
  },
  {
    id: 'portuguesa',
    name: 'Portuguesa',
    description:
      'Molho de tomate San Marzano, mussarela, presunto cozido, cebola, tomate, ovos, ervilhas e azeitonas pretas.',
    price: 62,
    cost: 22,
    ingredients: [],
    active: true,
  },
  {
    id: 'toscana',
    name: 'Toscana',
    description:
      'Molho de tomate San Marzano, mussarela, cogumelos refogados, bacon e azeitona.',
    price: 62,
    cost: 24,
    ingredients: [],
    active: true,
  },
];

const KEY = 'della-pace.menu.v1';

export function loadMenu(): MenuItem[] {
  if (typeof window === 'undefined') return DEFAULT_MENU;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_MENU;
    const parsed = JSON.parse(raw) as MenuItem[];
    return parsed.length > 0
      ? parsed.map((m) => ({ ...m, ingredients: m.ingredients ?? [] }))
      : DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

export function saveMenu(menu: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(menu));
}

export function ingredientCost(
  ing: RecipeIngredient,
  stock: StockItem,
): number {
  if (!isCompatible(ing.unit, stock.unit)) return 0;
  const amountInStockUnit = convertAmount(ing.amount, ing.unit, stock.unit);
  return amountInStockUnit * stock.unitPrice;
}

export function calcRecipeCost(
  item: MenuItem,
  stock: StockItem[],
  menu: MenuItem[] = [],
  visited: Set<string> = new Set(),
): number {
  if (!item.ingredients || item.ingredients.length === 0) return item.cost;
  if (visited.has(item.id)) return 0; // proteção contra ciclos
  visited.add(item.id);
  return item.ingredients.reduce((sum, ing) => {
    // Sub-receita (componente como Disco/Concha): expande recursivamente
    if (ing.componentMenuId) {
      const comp = menu.find((m) => m.id === ing.componentMenuId);
      if (!comp) return sum;
      return sum + ing.amount * calcRecipeCost(comp, stock, menu, visited);
    }
    // Ingrediente normal (vinculado ao stock_items)
    const stk = stock.find((s) => s.id === ing.stockItemId);
    if (!stk) return sum;
    return sum + ingredientCost(ing, stk);
  }, 0);
}

export function effectiveCost(
  item: MenuItem,
  stock: StockItem[],
  menu: MenuItem[] = [],
): number {
  if (item.ingredients && item.ingredients.length > 0) {
    return calcRecipeCost(item, stock, menu);
  }
  return item.cost;
}

export function calcMargin(item: { price: number; cost: number }) {
  const profit = item.price - item.cost;
  const marginPct = item.price > 0 ? (profit / item.price) * 100 : 0;
  const markup = item.cost > 0 ? item.price / item.cost : 0;
  return { profit, marginPct, markup };
}

export function findByName(menu: MenuItem[], name: string): MenuItem | undefined {
  return menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
}

export function newMenuId(): string {
  return `pizza-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
