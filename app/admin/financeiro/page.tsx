'use client';

import { useEffect, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  createExpense,
  fetchExpenses,
  fetchMenu,
  fetchOrders,
  removeExpense,
} from '@/lib/api';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  newExpenseId,
  type Expense,
  type ExpenseCategory,
} from '@/lib/expenses';
import { type MenuItem } from '@/lib/menu';
import { type Order } from '@/lib/orders';
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';
import { formatDateBR, formatDateISO } from '@/lib/utils';

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tick, setTick] = useState(0);

  const [date, setDate] = useState<string>(() => formatDateISO(new Date()));
  const [category, setCategory] = useState<ExpenseCategory>('gas');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetchExpenses().catch(() => []),
      fetchOrders().catch(() => []),
      fetchMenu().catch(() => []),
    ]).then(([e, o, m]) => {
      setExpenses(e);
      setOrders(o);
      setMenu(m);
    });
  }, [tick]);

  const periodOrders = orders.filter((o) => inPeriod(o.date, period));
  const periodExp = expenses.filter((e) => inPeriod(e.date, period));

  const revenue = periodOrders
    .filter((o) => o.status === 'pago')
    .reduce((s, o) => s + o.total, 0);
  const pizzaCost = periodOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => {
      return (
        sum +
        o.items.reduce((c, it) => {
          const m = menu.find((mi) => mi.name.toLowerCase() === it.flavor.toLowerCase());
          return c + (m?.cost ?? 0);
        }, 0)
      );
    }, 0);
  const opEx = periodExp.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - pizzaCost - opEx;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  const byCategory = (() => {
    const out: Record<string, number> = {};
    periodExp.forEach((e) => {
      out[e.category] = (out[e.category] || 0) + e.amount;
    });
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  })();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    await createExpense({
      id: newExpenseId(),
      date,
      category,
      description: description.trim(),
      amount,
      recurring: false,
    });
    setDescription('');
    setAmount(0);
    setTick((t) => t + 1);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return;
    await removeExpense(id);
    setTick((t) => t + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Financeiro
          </h1>
          <p className="text-sm text-primary-500/60">
            Receita, custos das pizzas, despesas operacionais e lucro líquido.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-primary-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={
                period === p
                  ? 'rounded-full bg-primary-500 px-3 py-1 text-xs text-white'
                  : 'rounded-full px-3 py-1 text-xs text-primary-500/70 hover:text-primary-500'
              }
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </header>

      <HelpBanner
        id="financeiro"
        title="Financeiro"
        whenToFill="Sempre que pagar uma conta operacional (gás, luz, água, limpeza, manutenção, transporte). Compras de ingredientes NÃO vão aqui."
        steps={[
          'Use "Adicionar despesa" pra registrar cada conta paga.',
          'Escolha a categoria certa: Gás, Energia, Água, Limpeza, Manutenção, Transporte, etc.',
          'Os KPIs no topo somam tudo: receita (de pedidos pagos), custo de pizzas (de Compras), despesas operacionais e lucro líquido.',
          'Use o seletor de período pra ver Hoje / Semana / Mês / Tudo.',
        ]}
        doNot={[
          'Ingredientes (farinha, mussarela, calabresa, etc) NÃO vão em despesa. Vão em Compras.',
          'Pagamento de pedido NÃO se lança aqui. É automático quando você marca o pedido como "Recebido" em Pedidos.',
        ]}
        notes='Regra de bolso: se vira pizza, é Compras. Se faz a pizzaria funcionar, é Despesa.'
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Faturamento" value={`R$ ${revenue}`} tone="good" />
        <KPI label="Custos pizzas" value={`R$ ${pizzaCost}`} />
        <KPI label="Despesas" value={`R$ ${opEx}`} />
        <KPI
          label="Lucro líquido"
          value={`R$ ${profit}`}
          hint={`Margem: ${marginPct.toFixed(0)}%`}
          tone={profit >= 0 ? 'good' : 'bad'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Adicionar despesa
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Data
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Categoria
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
                Descrição
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Botijão 13kg"
                className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
                Valor R$
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
            >
              Registrar despesa
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Despesas por categoria · {PERIOD_LABEL[period]}
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-primary-500/60">
              Sem despesas no período.
            </p>
          ) : (
            <ul className="space-y-2">
              {byCategory.map(([cat, val]) => {
                const pct = opEx > 0 ? (val / opEx) * 100 : 0;
                return (
                  <li key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-primary-500">
                        {CATEGORY_LABEL[cat as ExpenseCategory] ?? cat}
                      </span>
                      <span className="text-primary-500/60">
                        R$ {val} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Histórico de despesas · {PERIOD_LABEL[period]}
        </h3>
        {periodExp.length === 0 ? (
          <p className="text-sm text-primary-500/60">
            Nenhuma despesa registrada no período.
          </p>
        ) : (
          <ul className="space-y-1">
            {periodExp
              .sort((a, b) => (b.date > a.date ? 1 : -1))
              .map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary-100 bg-white p-2 text-sm"
                >
                  <span className="text-xs text-primary-500/60">
                    {formatDateBR(new Date(`${e.date}T12:00:00`))}
                  </span>
                  <span className="text-xs">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-primary-700">
                      {CATEGORY_LABEL[e.category]}
                    </span>{' '}
                    {e.description}
                  </span>
                  <span className="font-medium text-primary-500">
                    R$ {e.amount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    excluir
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad';
}) {
  const cls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'bad'
        ? 'border-rose-200 bg-rose-50'
        : 'border-primary-100 bg-white';
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </p>
      <p
        className="mt-1 text-2xl text-primary-500"
        style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 600,
        }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-primary-500/50">{hint}</p>}
    </div>
  );
}
