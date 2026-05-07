export type StockItem = {
  id: string;
  name: string;
  brand: string;
  supplier: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  minQuantity: number;
  notes: string;
  updatedAt: string;
};

const KEY = 'della-pace.stock.v1';

export function loadStock(): StockItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as StockItem[];
  } catch {
    return [];
  }
}

export function saveStock(items: StockItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function newStockId(): string {
  return `stk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isLowStock(item: StockItem): boolean {
  return item.minQuantity > 0 && item.quantity <= item.minQuantity;
}
