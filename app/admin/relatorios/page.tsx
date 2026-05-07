'use client';

import { useEffect, useState } from 'react';
import {
  fetchCustomers,
  fetchExpenses,
  fetchMenu,
  fetchOrders,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import { type MenuItem } from '@/lib/menu';
import { type Order, type StoredCustomer } from '@/lib/orders';
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

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchExpenses().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
    ]).then(([o, e, c, m]) => {
      setOrders(o);
      setExpenses(e);
      setCustomers(c);
      setMenu(m);
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
