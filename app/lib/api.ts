import type { Expense } from '@/lib/expenses';
import type { MenuItem, RecipeIngredient } from '@/lib/menu';
import type { Order, OrderStatus, StoredCustomer } from '@/lib/orders';
import type { Product, ProductInput } from '@/lib/products';
import type {
  Purchase,
  PurchaseInput,
  PurchaseStatus,
} from '@/lib/purchases';
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
export async function lookupCustomerByPhone(
  phone: string,
): Promise<StoredCustomer | null> {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  try {
    return await apiFetch<StoredCustomer>(
      `/api/customers/by-phone/${encodeURIComponent(digits)}`,
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
/**
 * Cria um pedido como admin (ex: lançamento manual a partir da ficha do
 * cliente). Envia header X-Admin-Bypass-Deadline pra ignorar o deadline
 * de pedidos do dia (caso o admin esteja criando pós-deadline).
 */
export function createAdminOrder(order: Order) {
  return apiFetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Bypass-Deadline': '1',
    },
    body: JSON.stringify(order),
  });
}
export function setOrderStatus(
  id: string,
  status: OrderStatus,
  cancellationReason?: string | null,
) {
  return apiFetch(`/api/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, cancellationReason }),
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
export function fetchBookedSlots(date: string): Promise<string[]> {
  return apiFetch<string[]>(`/api/availability/${date}/booked-slots`);
}

// ─── Suggestions ────────────────────────────────────────
export type SuggestionStatus = 'new' | 'read' | 'done' | 'archived';
export type Suggestion = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: SuggestionStatus;
  createdAt: string;
};
export function fetchSuggestions(): Promise<Suggestion[]> {
  return apiFetch<Suggestion[]>('/api/suggestions');
}
export function updateSuggestionStatus(id: number, status: SuggestionStatus) {
  return apiFetch(`/api/suggestions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
export function deleteSuggestion(id: number) {
  return apiFetch(`/api/suggestions/${id}`, { method: 'DELETE' });
}

// ─── Community Posts ────────────────────────────────────
export type CommunityPostStatus = 'pending' | 'approved' | 'hidden';
export type CommunityPost = {
  id: number;
  name: string;
  message: string;
  imageData: string | null;
  status: CommunityPostStatus;
  showInHero: boolean;
  createdAt: string;
};
export function fetchCommunityPosts(): Promise<CommunityPost[]> {
  return apiFetch<CommunityPost[]>('/api/community-posts');
}
export function fetchPublicCommunityPosts(): Promise<CommunityPost[]> {
  return apiFetch<CommunityPost[]>('/api/community-posts?scope=public');
}
export function fetchHeroCommunityPosts(): Promise<CommunityPost[]> {
  return apiFetch<CommunityPost[]>('/api/community-posts?scope=hero');
}
export function createCommunityPost(body: {
  name: string;
  message: string;
  imageData?: string | null;
}) {
  return apiFetch('/api/community-posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function updateCommunityPost(
  id: number,
  patch: { status?: CommunityPostStatus; showInHero?: boolean },
) {
  return apiFetch(`/api/community-posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deleteCommunityPost(id: number) {
  return apiFetch(`/api/community-posts/${id}`, { method: 'DELETE' });
}

// ─── Products (catálogo) ────────────────────────────────
export function fetchProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/api/products');
}
export function createProduct(p: ProductInput) {
  return apiFetch<{ ok: boolean; id: number }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(p),
  });
}
export function updateProduct(id: number, patch: Partial<ProductInput>) {
  return apiFetch(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deleteProduct(id: number) {
  return apiFetch<{ ok: boolean; softDeleted?: boolean; message?: string }>(
    `/api/products/${id}`,
    { method: 'DELETE' },
  );
}

// ─── Purchases (compras / ciclo) ────────────────────────
export function fetchPurchases(params?: {
  status?: PurchaseStatus;
  productionDate?: string;
  pendingClose?: boolean;
  carryover?: boolean;
}): Promise<Purchase[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.productionDate) qs.set('productionDate', params.productionDate);
  if (params?.pendingClose) qs.set('pendingClose', '1');
  if (params?.carryover) qs.set('carryover', '1');
  const tail = qs.toString();
  return apiFetch<Purchase[]>(`/api/purchases${tail ? `?${tail}` : ''}`);
}
export function createPurchase(p: PurchaseInput) {
  return apiFetch<{ ok: boolean; id: number }>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(p),
  });
}
export function updatePurchase(
  id: number,
  patch: Partial<PurchaseInput> & { status?: PurchaseStatus },
) {
  return apiFetch(`/api/purchases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deletePurchase(id: number) {
  return apiFetch(`/api/purchases/${id}`, { method: 'DELETE' });
}

// ─── Push notifications ─────────────────────────────────
export type PushSendResult = {
  ok: boolean;
  total: number;
  success: number;
  gone: number;
  failed: number;
};
export function sendPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<PushSendResult> {
  return apiFetch<PushSendResult>('/api/push/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
