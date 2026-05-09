'use client';

import { useEffect, useState } from 'react';
import {
  fetchCustomers,
  fetchExpenses,
  fetchMenu,
  fetchOrders,
  fetchStock,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import {
  ingredientCost,
  type MenuItem,
  type RecipeIngredient,
} from '@/lib/menu';
import { type Order, type StoredCustomer } from '@/lib/orders';
import { type StockItem } from '@/lib/stock';

type Block = 'massa' | 'molho' | 'cobertura' | 'operacao';

const BLOCK_LABEL: Record<Block, string> = {
  massa: 'Massa',
  molho: 'Molho',
  cobertura: 'Cobertura',
  operacao: 'Operação',
};

const BLOCK_TONE: Record<Block, string> = {
  massa: 'bg-amber-400',
  molho: 'bg-rose-400',
  cobertura: 'bg-emerald-400',
  operacao: 'bg-blue-400',
};

function classifyIngredient(name: string): Block {
  const n = name.toLowerCase();
  if (/farinh|fermento|levedu/.test(n)) return 'massa';
  if (/tomate|molho|manjeric|polp|passata/.test(n)) return 'molho';
  if (/sal\b|azeite|embalag|gás|gas|caixa|papel/.test(n)) return 'operacao';
  return 'cobertura';
}

type BlockBreakdown = {
  massa: number;
  molho: number;
  cobertura: number;
  operacao: number;
  total: number;
};

function emptyBreakdown(): BlockBreakdown {
  return { massa: 0, molho: 0, cobertura: 0, operacao: 0, total: 0 };
}

function costPerPizzaByBlock(
  item: MenuItem,
  stock: StockItem[],
): BlockBreakdown {
  const out = emptyBreakdown();
  if (!item.ingredients || item.ingredients.length === 0) {
    out.cobertura = item.cost;
    out.total = item.cost;
    return out;
  }
  for (const ing of item.ingredients as RecipeIngredient[]) {
    const stk = stock.find((s) => s.id === ing.stockItemId);
    if (!stk) continue;
    const cost = ingredientCost(ing, stk);
    const block = classifyIngredient(stk.name);
    out[block] += cost;
    out.total += cost;
  }
  return out;
}
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';
import { formatDateBR } from '@/lib/utils';

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchExpenses().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
      fetchStock().catch(() => []),
    ]).then(([o, e, c, m, s]) => {
      setOrders(o);
      setExpenses(e);
      setCustomers(c);
      setMenu(m);
      setStock(s);
    });
  }, []);

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

  const totalPizzas = periodOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((s, o) => s + o.items.length, 0);
  const avgTicket =
    periodOrders.filter((o) => o.status !== 'cancelado').length > 0
      ? revenue /
        Math.max(
          periodOrders.filter((o) => o.status === 'pago').length,
          1,
        )
      : 0;

  // Sales by Sunday (date-grouped)
  const byDate = (() => {
    const map: Record<string, { revenue: number; pizzas: number; orders: number }> =
      {};
    periodOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) => {
        if (!map[o.date]) map[o.date] = { revenue: 0, pizzas: 0, orders: 0 };
        map[o.date].revenue += o.status === 'pago' ? o.total : 0;
        map[o.date].pizzas += o.items.length;
        map[o.date].orders += 1;
      });
    return Object.entries(map).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  })();

  // Flavor distribution
  const flavorDist = (() => {
    const c: Record<string, number> = {};
    periodOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => (c[it.flavor] = (c[it.flavor] || 0) + 1)),
      );
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  })();

  // Finish distribution
  const finishDist = (() => {
    const c: Record<string, number> = {};
    periodOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => (c[it.finish] = (c[it.finish] || 0) + 1)),
      );
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  })();

  const maxRevByDate = Math.max(1, ...byDate.map(([, v]) => v.revenue));

  const perPizzaCost = menu
    .filter((m) => m.active)
    .map((m) => ({
      item: m,
      breakdown: costPerPizzaByBlock(m, stock),
    }));

  const productionTotal = (() => {
    const totals = emptyBreakdown();
    periodOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => {
          const m = menu.find(
            (mi) => mi.name.toLowerCase() === it.flavor.toLowerCase(),
          );
          if (!m) return;
          const b = costPerPizzaByBlock(m, stock);
          totals.massa += b.massa;
          totals.molho += b.molho;
          totals.cobertura += b.cobertura;
          totals.operacao += b.operacao;
          totals.total += b.total;
        }),
      );
    return totals;
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Relatórios
          </h1>
          <p className="text-sm text-primary-500/60">
            Métricas consolidadas · {PERIOD_LABEL[period]}
          </p>
          <div className="mt-2 inline-flex rounded-full border border-primary-200 bg-white p-1 text-xs">
            <span className="rounded-full bg-primary-500 px-3 py-1 font-medium text-white">
              Resumo
            </span>
            <a
              href="/admin/relatorios/bi"
              className="rounded-full px-3 py-1 text-primary-500/70 hover:text-primary-500"
            >
              📊 BI →
            </a>
          </div>
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

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Faturamento" value={`R$ ${revenue}`} tone="good" />
        <KPI label="Pizzas vendidas" value={String(totalPizzas)} />
        <KPI label="Ticket médio (pago)" value={`R$ ${avgTicket.toFixed(2)}`} />
        <KPI label="Lucro líquido" value={`R$ ${profit}`} tone={profit >= 0 ? 'good' : 'bad'} />
        <KPI label="Custos pizzas" value={`R$ ${pizzaCost}`} />
        <KPI label="Despesas" value={`R$ ${opEx}`} />
        <KPI label="Pedidos" value={String(periodOrders.length)} />
        <KPI label="Clientes únicos" value={String(new Set(periodOrders.map(o => o.customer.cpf)).size)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Custo por pizza · breakdown
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Custo de cada sabor dividido por bloco de produção (massa,
            molho, cobertura). Inclui também venda, lucro e margem.
          </p>
          {perPizzaCost.length === 0 ? (
            <p className="text-sm text-primary-500/60">
              Nenhum sabor ativo no cardápio.
            </p>
          ) : (
            <ul className="space-y-4">
              {perPizzaCost.map(({ item, breakdown }) => {
                const profit = item.price - breakdown.total;
                const marginPct =
                  item.price > 0 ? (profit / item.price) * 100 : 0;
                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-primary-100 bg-primary-50/30 p-3"
                  >
                    <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <p
                        className="text-base text-primary-500"
                        style={{
                          fontFamily:
                            'var(--font-cormorant), Georgia, serif',
                          fontWeight: 600,
                        }}
                      >
                        {item.name}
                      </p>
                      <p className="text-[11px] text-primary-500/70">
                        Venda R$ {item.price} · Custo R${' '}
                        {breakdown.total.toFixed(2)} · Lucro R${' '}
                        {profit.toFixed(2)} ·{' '}
                        <span
                          className={
                            marginPct >= 50
                              ? 'text-emerald-700'
                              : marginPct >= 30
                                ? 'text-amber-700'
                                : 'text-rose-700'
                          }
                        >
                          {marginPct.toFixed(0)}% margem
                        </span>
                      </p>
                    </header>
                    <BlockBars b={breakdown} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Custo total da produção · {PERIOD_LABEL[period]}
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Soma do custo de ingredientes de TODAS as pizzas vendidas no
            período, agrupado por bloco.
          </p>
          {productionTotal.total === 0 ? (
            <p className="text-sm text-primary-500/60">
              Sem produção no período.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {(['massa', 'molho', 'cobertura', 'operacao'] as Block[]).map(
                  (b) => {
                    const v = productionTotal[b];
                    const pct =
                      productionTotal.total > 0
                        ? (v / productionTotal.total) * 100
                        : 0;
                    return (
                      <li key={b}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="flex items-center gap-2 text-primary-500">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${BLOCK_TONE[b]}`}
                            />
                            {BLOCK_LABEL[b]}
                          </span>
                          <span className="text-primary-500/70">
                            R$ {v.toFixed(2)} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
                          <div
                            className={`h-full ${BLOCK_TONE[b]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  },
                )}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-primary-100 pt-3">
                <span className="text-xs uppercase tracking-widest text-primary-500/60">
                  Custo total
                </span>
                <span
                  className="text-2xl text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    fontWeight: 600,
                  }}
                >
                  R$ {productionTotal.total.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Faturamento por domingo
        </h3>
        {byDate.length === 0 ? (
          <p className="text-sm text-primary-500/60">Sem vendas no período.</p>
        ) : (
          <ul className="space-y-2">
            {byDate.map(([date, v]) => {
              const pct = (v.revenue / maxRevByDate) * 100;
              return (
                <li key={date}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-primary-500">
                      {formatDateBR(new Date(`${date}T12:00:00`))}
                    </span>
                    <span className="text-primary-500/60">
                      R$ {v.revenue} · {v.pizzas} pizzas · {v.orders} pedidos
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-primary-100">
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
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Pizzas mais vendidas
          </h3>
          <BarList entries={flavorDist} unit="pizzas" />
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Acabamento preferido
          </h3>
          <BarList entries={finishDist} unit="" />
        </div>
      </section>

      <p className="text-center text-[11px] text-primary-500/40">
        Total de clientes cadastrados (todos os tempos): {customers.length}
      </p>
    </div>
  );
}

function BlockBars({ b }: { b: BlockBreakdown }) {
  const blocks: Block[] = ['massa', 'molho', 'cobertura', 'operacao'];
  return (
    <ul className="space-y-1.5">
      {blocks.map((bl) => {
        const v = b[bl];
        if (v === 0) return null;
        const pct = b.total > 0 ? (v / b.total) * 100 : 0;
        return (
          <li key={bl} className="grid grid-cols-[80px_1fr_auto] items-center gap-2 text-[11px]">
            <span className="text-primary-500/70">{BLOCK_LABEL[bl]}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full ${BLOCK_TONE[bl]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="tabular-nums text-primary-500/80">
              R$ {v.toFixed(2)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function BarList({ entries, unit }: { entries: [string, number][]; unit: string }) {
  if (entries.length === 0)
    return <p className="text-sm text-primary-500/60">Sem dados no período.</p>;
  const total = entries.reduce((s, [, n]) => s + n, 0);
  return (
    <ul className="space-y-2">
      {entries.map(([k, n]) => {
        const pct = total > 0 ? (n / total) * 100 : 0;
        return (
          <li key={k}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-primary-500">{k}</span>
              <span className="text-primary-500/60">
                {n} {unit} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
              <div className="h-full bg-accent-500" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
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
    </div>
  );
}
