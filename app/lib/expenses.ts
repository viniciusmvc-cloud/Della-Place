export type ExpenseCategory =
  | 'gas'
  | 'entrega'
  | 'funcionario'
  | 'aluguel'
  | 'embalagem'
  | 'marketing'
  | 'outros';

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  gas: 'Gás',
  entrega: 'Entrega',
  funcionario: 'Funcionário',
  aluguel: 'Aluguel',
  embalagem: 'Embalagem',
  marketing: 'Marketing',
  outros: 'Outros',
};

export const CATEGORIES: ExpenseCategory[] = [
  'gas',
  'entrega',
  'funcionario',
  'aluguel',
  'embalagem',
  'marketing',
  'outros',
];

export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  recurring: boolean;
};

const KEY = 'della-pace.expenses.v1';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Expense[];
  } catch {
    return [];
  }
}

export function saveExpense(e: Expense): void {
  if (typeof window === 'undefined') return;
  const all = loadExpenses();
  all.push(e);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteExpense(id: string): void {
  if (typeof window === 'undefined') return;
  const all = loadExpenses().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function newExpenseId(): string {
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
