'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  fetchCustomers,
  fetchExpenses,
  fetchMenu,
  fetchOrders,
  fetchPurchases,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import { type MenuItem } from '@/lib/menu';
import { type Order, type StoredCustomer } from '@/lib/orders';
import { type Purchase } from '@/lib/purchases';
import { formatDateBR } from '@/lib/utils';
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
  const [pendingClose, setPendingClose] = useState<Purchase[]>([]);

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchExpenses().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
      fetchPurchases({ pendingClose: true }).catch(() => []),
    ]).then(([o, e, c, m, pc]) => {
      setOrders(o);
      setExpenses(e);
      setCustomers(c);
      setMenu(m);
      setPendingClose(pc);
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

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...orders]
    .filter(
      (o) =>
        (o.status === 'pendente' || o.status === 'confirmado') &&
        o.date >= today,
    )
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const at = a.items[0]?.time ?? '00:00';
      const bt = b.items[0]?.time ?? '00:00';
      return at.localeCompare(bt);
    })
    .slice(0, 6);

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

      <HelpBanner
        id="dashboard"
        title="Painel principal"
        whenToFill="Você não preenche nada aqui. Esta tela só LÊ as informações lançadas em outras abas e mostra o resumo."
        steps={[
          'Use o seletor (Hoje / Semana / Mês / Tudo) no canto superior direito pra mudar o período.',
          'Os 8 KPIs mostram faturamento, lucro, pedidos, pendências, custo de pizzas, despesas e sabor mais vendido.',
          'O card "Próximos pedidos" lista os pedidos futuros em ordem cronológica de produção.',
          'Se aparecer um banner amarelo "Encerrar ciclo", clique para fechar as compras de domingos passados.',
        ]}
        notes="Linha do tempo da semana: Cliente reserva (Pedidos) → Mise en place calcula o que comprar → Aurélio lança Compras → Domingo: produção → Encerrar ciclo decide o destino do que sobrou."
      />

      {pendingClose.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-900">
                ⏰ Encerrar ciclo de produção
              </p>
              <p className="mt-1 text-xs text-amber-900/80">
                {pendingClose.length}{' '}
                {pendingClose.length === 1 ? 'compra' : 'compras'} de
                domingo(s) já passados aguardando você decidir o destino.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(pendingClose.map((p) => p.productionDate)),
              )
                .sort()
                .map((d) => {
                  const count = pendingClose.filter(
                    (p) => p.productionDate === d,
                  ).length;
                  return (
                    <Link
                      key={d}
                      href={`/admin/compras/encerrar/${d}`}
                      className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                    >
                      Encerrar{' '}
                      {formatDateBR(new Date(`${d}T12:00:00`))} ({count})
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}

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
        <Card title="Próximos pedidos">
          {upcoming.length === 0 ? (
            <p className="text-sm text-primary-500/60">
              Nenhum pedido futuro. Quando clientes reservarem, eles aparecem
              aqui em ordem cronológica de produção.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-primary-100 bg-white p-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="rounded bg-primary-500 px-2 py-0.5 text-[11px] text-white"
                      style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                      }}
                    >
                      {o.items[0]?.time ?? '—'}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="text-primary-500">
                        {o.customer.fullName}
                      </span>
                      <span className="text-[10px] text-primary-500/60">
                        {new Date(`${o.date}T12:00:00`).toLocaleDateString('pt-BR')}
                        {' · '}
                        {o.items.length}× pizza
                      </span>
                    </span>
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
