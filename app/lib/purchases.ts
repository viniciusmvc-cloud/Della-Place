export const PURCHASE_STATUSES = [
  'pending',
  'used',
  'kept',
  'discarded',
  'personal',
] as const;

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const STATUS_LABEL: Record<PurchaseStatus, string> = {
  pending: 'Pendente',
  used: 'Usado',
  kept: 'Guardado',
  discarded: 'Descartado',
  personal: 'Uso pessoal',
};

export const STATUS_TONE: Record<PurchaseStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  used: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  kept: 'border-blue-200 bg-blue-50 text-blue-800',
  discarded: 'border-rose-200 bg-rose-50 text-rose-800',
  personal: 'border-purple-200 bg-purple-50 text-purple-800',
};

export const STATUS_HINT: Record<PurchaseStatus, string> = {
  pending: 'Aguardando encerramento.',
  used: 'Consumido na produção.',
  kept: 'Guardado para a próxima edição (vira estoque).',
  discarded: 'Descartado (prejuízo).',
  personal: 'Uso pessoal (prejuízo).',
};

export type Purchase = {
  id: number;
  productId: number;
  productName: string;
  productCategory: 'massa' | 'molho' | 'cobertura' | 'operacao';
  quantity: number;
  unit: string;
  brand: string | null;
  totalCost: number;
  purchaseDate: string;
  productionDate: string;
  status: PurchaseStatus;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type PurchaseInput = {
  productId: number;
  quantity: number;
  unit: string;
  brand?: string | null;
  totalCost: number;
  purchaseDate: string;
  productionDate: string;
  notes?: string | null;
};

export function nextSundayISO(from: Date = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const days = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
