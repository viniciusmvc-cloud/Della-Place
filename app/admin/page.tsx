'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  fetchCustomers,
  fetchExpenses,
  fetchMenu,
  fetchOrders,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import { calcMargin, type MenuItem } from '@/lib/menu';
import { type Order, type StoredCustomer } from '@/lib/orders';
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';

export default function AdminDashboard() {
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

  const inPeriodOrders = orders.filter((o) => inPeriod(o.date, period));
  const inPeriodExpenses = expenses.filter((e) => inPeriod(e.date, period));

  const revenue = inPeriodOrders
    .filter((o) => o.status === 'pago')
    .reduce((s, o) => s + o.total, 0);

  const pizzaCost = inPeriodOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((s, o) => {
      const itemsCost = o.items.reduce((c, it) => {
        const m = menu.find(
          (mi) => mi.name.toLowerCase() === it.flavor.toLowerCase(),
        );
        return c + (m?.cost ?? 0);
      }, 0);
      return s + itemsCost;
    }, 0);

  const opEx = inPeriodExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - pizzaCost - opEx;
  const totalOrders = inPeriodOrders.filter((o) => o.status !== 'cancelado').length;
  const pendentes = orders.filter((o) => o.status === 'pendente').length;
  const aReceber = orders
    .filter((o) => o.status === 'confirmado')
    .reduce((s, o) => s + o.total, 0);

  const topFlavor = (() => {
    const c: Record<string, number> = {};
    inPeriodOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) => o.items.forEach((it) => (c[it.flavor] = (c[it.flavor] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  })();

  const recent = [...orders]
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-primary-500/60">
            Visão geral do negócio · {PERIOD_LABEL[period]}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        ⚠️ Modo demo — dados salvos neste navegador. No banco real (Onda 2),
        tudo aparece em tempo real para o Aurélio em qualquer dispositivo.
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Faturamento" value={`R$ ${revenue}`} hint="pagos no período" />
        <Stat
          label="Lucro líquido"
          value={`R$ ${profit}`}
          hint="receita − custos − despesas"
          tone={profit >= 0 ? 'good' : 'bad'}
        />
        <Stat label="Pedidos" value={String(totalOrders)} hint="ativos no período" />
        <Stat
          label="A receber"
          value={`R$ ${aReceber}`}
          hint="confirmados, ainda não pagos"
        />
        <Stat label="Pendentes" value={String(pendentes)} tone={pendentes > 0 ? 'warn' : undefined} hint="aguardando você confirmar" />
        <Stat label="Custo de pizzas" value={`R$ ${pizzaCost}`} hint="ingredientes" />
        <Stat label="Despesas operacionais" value={`R$ ${opEx}`} hint="gás, entrega, etc" />
        <Stat label="Sabor top" value={topFlavor} hint="mais vendido no período" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Margem por pizza">
          {menu.length === 0 ? (
            <p className="text-sm text-primary-500/60">Nenhum item no cardápio.</p>
          ) : (
            <ul className="space-y-2">
              {menu.map((m) => {
                const mg = calcMargin(m);
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-md border border-primary-100 bg-white p-2 text-sm"
                  >
                    <span className="text-primary-500">{m.name}</span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className="text-primary-500/60">
                        custo R$ {m.cost}
                      </span>
                      <span className="text-primary-500/60">venda R$ {m.price}</span>
                      <span
                        className={
                          mg.marginPct >= 50
                            ? 'rounded bg-emerald-100 px-2 py-0.5 text-emerald-800'
                            : mg.marginPct >= 30
                              ? 'rounded bg-amber-100 px-2 py-0.5 text-amber-800'
                              : 'rounded bg-rose-100 px-2 py-0.5 text-rose-800'
                        }
                      >
                        {mg.marginPct.toFixed(0)}%
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/admin/cardapio"
            className="mt-3 inline-block text-xs text-primary-500/70 hover:text-primary-500"
          >
            Editar cardápio →
          </Link>
        </Card>

        <Card title="Últimos pedidos">
          {recent.length === 0 ? (
            <p className="text-sm text-primary-500/60">Nenhum pedido ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-md border border-primary-100 bg-white p-2 text-sm"
                >
                  <span className="text-primary-500">
                    {o.customer.fullName}
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-primary-500/60">R$ {o.total}</span>
                    <StatusBadge status={o.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/pedidos"
            className="mt-3 inline-block text-xs text-primary-500/70 hover:text-primary-500"
          >
            Ver todos →
          </Link>
        </Card>

        <Card title="Top clientes">
          {customers.length === 0 ? (
            <p className="text-sm text-primary-500/60">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {customers.slice(0, 5).map((c) => {
                const cOrders = orders.filter((o) => o.customer.cpf === c.cpf);
                const totalSpent = cOrders
                  .filter((o) => o.status === 'pago')
                  .reduce((s, o) => s + o.total, 0);
                return (
                  <li
                    key={c.cpf}
                    className="flex items-center justify-between rounded-md border border-primary-100 bg-white p-2 text-sm"
                  >
                    <span className="text-primary-500">{c.fullName}</span>
                    <span className="text-xs text-primary-500/60">
                      {cOrders.length} pedidos · R$ {totalSpent}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/admin/clientes"
            className="mt-3 inline-block text-xs text-primary-500/70 hover:text-primary-500"
          >
            Ver todos →
          </Link>
        </Card>

        <Card title="Distribuição de sabores">
          {(() => {
            const c: Record<string, number> = {};
            inPeriodOrders
              .filter((o) => o.status !== 'cancelado')
              .forEach((o) =>
                o.items.forEach(
                  (it) => (c[it.flavor] = (c[it.flavor] || 0) + 1),
                ),
              );
            const entries = Object.entries(c).sort((a, b) => b[1] - a[1]);
            const total = entries.reduce((s, [, n]) => s + n, 0);
            if (total === 0)
              return (
                <p className="text-sm text-primary-500/60">
                  Sem dados no período.
                </p>
              );
            return (
              <ul className="space-y-2">
                {entries.map(([name, n]) => {
                  const pct = (n / total) * 100;
                  return (
                    <li key={name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-primary-500">{name}</span>
                        <span className="text-primary-500/60">
                          {n} · {pct.toFixed(0)}%
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
            );
          })()}
        </Card>
      </section>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-primary-200 bg-white p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={
            value === p
              ? 'rounded-full bg-primary-500 px-3 py-1 text-xs text-white'
              : 'rounded-full px-3 py-1 text-xs text-primary-500/70 hover:text-primary-500'
          }
        >
          {PERIOD_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const toneCls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'bad'
          ? 'border-rose-200 bg-rose-50'
          : 'border-primary-100 bg-white';
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneCls}`}>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: 'bg-amber-100 text-amber-800',
    confirmado: 'bg-blue-100 text-blue-800',
    pago: 'bg-emerald-100 text-emerald-800',
    cancelado: 'bg-rose-100 text-rose-800',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] ${map[status] ?? 'bg-primary-100 text-primary-700'}`}
    >
      {status}
    </span>
  );
}
