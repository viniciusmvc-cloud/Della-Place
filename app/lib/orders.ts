export type OrderStatus = 'pendente' | 'confirmado' | 'pago' | 'cancelado';

export type OrderItem = {
  time: string;
  flavor: string;
  finish: string;
  price: number;
};

export type Order = {
  id: string;
  createdAt: string;
  date: string;
  customer: {
    cpf: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
    blockApt: string;
  };
  items: OrderItem[];
  total: number;
  notes: string;
  status: OrderStatus;
  /** Motivo informado pelo admin ao cancelar. Vazio em pedidos não cancelados. */
  cancellationReason?: string | null;
};

const ORDERS_KEY = 'della-pace.orders.v1';

export function loadOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  const all = loadOrders();
  all.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  if (typeof window === 'undefined') return;
  const all = loadOrders();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return;
  all[idx].status = status;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
}

export function newOrderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const CUSTOMERS_KEY = 'della-pace.customers.v1';

export type StoredCustomer = {
  cpf: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  blockApt: string;
};

export function loadCustomers(): StoredCustomer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw) as Record<string, StoredCustomer>;
    return Object.values(obj);
  } catch {
    return [];
  }
}
