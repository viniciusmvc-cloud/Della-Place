import type { Expense } from '@/lib/expenses';
import type { MenuItem, RecipeIngredient } from '@/lib/menu';
import type { Order, OrderStatus, StoredCustomer } from '@/lib/orders';
import type { StockItem } from '@/lib/stock';
import type { AvailableDate } from '@/lib/availability';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${url}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ─── Menu ────────────────────────────────────────────────
export function fetchMenu(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>('/api/menu');
}
export function createMenuItem(item: MenuItem) {
  return apiFetch('/api/menu', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}
export function updateMenuItem(
  id: string,
  patch: Partial<MenuItem> & { ingredients?: RecipeIngredient[] },
) {
  return apiFetch(`/api/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deleteMenuItem(id: string) {
  return apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
}

// ─── Customers ──────────────────────────────────────────
export function fetchCustomers(): Promise<StoredCustomer[]> {
  return apiFetch<StoredCustomer[]>('/api/customers');
}
export async function lookupCustomer(cpf: string): Promise<StoredCustomer | null> {
  try {
    return await apiFetch<StoredCustomer>(
      `/api/customers/${encodeURIComponent(cpf)}`,
    );
  } catch {
    return null;
  }
}
export function upsertCustomer(c: StoredCustomer) {
  return apiFetch('/api/customers', {
    method: 'POST',
    body: JSON.stringify(c),
  });
}

// ─── Orders ─────────────────────────────────────────────
export function fetchOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/api/orders');
}
export function createOrder(order: Order) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}
export function setOrderStatus(id: string, status: OrderStatus) {
  return apiFetch(`/api/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ─── Expenses ───────────────────────────────────────────
export function fetchExpenses(): Promise<Expense[]> {
  return apiFetch<Expense[]>('/api/expenses');
}
export function createExpense(e: Expense) {
  return apiFetch('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(e),
  });
}
export function removeExpense(id: string) {
  return apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
}

// ─── Stock ──────────────────────────────────────────────
export function fetchStock(): Promise<StockItem[]> {
  return apiFetch<StockItem[]>('/api/stock');
}
export function createStockItem(item: StockItem) {
  return apiFetch('/api/stock', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}
export function updateStockItem(id: string, patch: Partial<StockItem>) {
  return apiFetch(`/api/stock/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deleteStockItem(id: string) {
  return apiFetch(`/api/stock/${id}`, { method: 'DELETE' });
}

// ─── Availability ───────────────────────────────────────
export function fetchAvailability(): Promise<AvailableDate[]> {
  return apiFetch<AvailableDate[]>('/api/availability');
}
export function upsertAvailability(a: AvailableDate) {
  return apiFetch('/api/availability', {
    method: 'POST',
    body: JSON.stringify(a),
  });
}
export function removeAvailability(date: string) {
  return apiFetch(`/api/availability/${date}`, { method: 'DELETE' });
}
