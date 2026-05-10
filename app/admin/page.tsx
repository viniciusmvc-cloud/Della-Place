'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  fetchExpenses,
  fetchMenu,
  fetchOrders,
  fetchPurchases,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import { type MenuItem } from '@/lib/menu';
import { type Order } from '@/lib/orders';
import { type Purchase } from '@/lib/purchases';
import { formatBRL, titleCase } from '@/lib/format';
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
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchExpenses().catch(() => []),
      fetchMenu().catch(() => []),
      fetchPurchases().catch(() => []),
    ]).then(([o, e, m, ps]) => {
      setOrders(o);
      setExpenses(e);
      setMenu(m);
      setAllPurchases(ps);
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
  const totalPizzas = inPeriodOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((s, o) => s + o.items.length, 0);
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

      <AttentionPanel />

      <CycleClosingWidget
        purchases={allPurchases}
        orders={orders}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Faturamento"
          value={formatBRL(revenue)}
          hint="pagos no período"
          href="/admin/relatorios"
        />
        <Stat
          label="Lucro líquido"
          value={formatBRL(profit)}
          hint="receita − custos − despesas"
          tone={profit >= 0 ? 'good' : 'bad'}
          href="/admin/relatorios"
        />
        <Stat
          label="Pedidos"
          value={String(totalOrders)}
          hint="ativos no período"
          href="/admin/pedidos"
        />
        <Stat
          label="Pizzas"
          value={String(totalPizzas)}
          hint="unidades vendidas"
          href="/admin/pedidos"
        />
        <Stat
          label="A receber"
          value={formatBRL(aReceber)}
          hint="confirmados, ainda não pagos"
          href="/admin/pedidos"
        />
        <Stat
          label="Pendentes"
          value={String(pendentes)}
          tone={pendentes > 0 ? 'warn' : undefined}
          hint="aguardando você confirmar"
          href="/admin/pedidos"
        />
        <Stat
          label="Custo de pizzas"
          value={formatBRL(pizzaCost)}
          hint="ingredientes"
          href="/admin/relatorios"
        />
        <Stat
          label="Despesas operacionais"
          value={formatBRL(opEx)}
          hint="gás, entrega, etc"
          href="/admin/financeiro"
        />
        <Stat
          label="Sabor top"
          value={titleCase(topFlavor)}
          hint="mais vendido no período"
          href="/admin/cardapio"
        />
      </section>

    </div>
  );
}

function CycleClosingWidget({
  purchases,
  orders,
}: {
  purchases: Purchase[];
  orders: Order[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  // Datas com pendência: agrupa por production_date
  const dateBuckets = new Map<
    string,
    {
      stockPending: number;
      stockPendingValue: number;
      stockTotal: number;
      paymentPending: number;
      paymentPendingValue: number;
    }
  >();
  const ensure = (date: string) => {
    let b = dateBuckets.get(date);
    if (!b) {
      b = {
        stockPending: 0,
        stockPendingValue: 0,
        stockTotal: 0,
        paymentPending: 0,
        paymentPendingValue: 0,
      };
      dateBuckets.set(date, b);
    }
    return b;
  };

  purchases.forEach((p) => {
    const e = ensure(p.productionDate);
    e.stockTotal += 1;
    if (p.status === 'pending') {
      e.stockPending += 1;
      e.stockPendingValue += p.totalCost;
    }
  });

  orders
    .filter((o) => o.status === 'pendente' || o.status === 'confirmado')
    .forEach((o) => {
      const e = ensure(o.date);
      e.paymentPending += 1;
      e.paymentPendingValue += o.total;
    });

  // Pega a data com pendências mais antiga (urgente primeiro)
  // Inclui também ciclos com paymentPending > 0 mas stockTotal = 0
  // (Aurélio precisa lançar as compras antes de encerrar)
  const dates = Array.from(dateBuckets.entries())
    .filter(([, v]) => v.stockPending > 0 || v.paymentPending > 0 || v.stockTotal === 0)
    .filter(([, v]) => v.paymentPending > 0 || v.stockPending > 0) // só mostra se realmente tem o que fazer
    .sort(([a], [b]) => a.localeCompare(b));

  if (dates.length === 0) {
    return (
      <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-5">
        <p className="text-3xl text-emerald-600">✓</p>
        <p
          className="mt-1 text-xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Nenhum ciclo a encerrar
        </p>
        <p className="mt-1 text-xs text-primary-500/70">
          Tudo em dia. Quando você lançar compras ou clientes reservarem,
          eles aparecem aqui pra fechamento.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {dates.map(([date, b]) => {
        const isPast = date <= today;
        const dateLabel = formatDateBR(new Date(`${date}T12:00:00`));
        const canClose = b.stockPending === 0 && b.paymentPending === 0 && b.stockTotal > 0;
        return (
          <div
            key={date}
            className={`rounded-2xl border-2 p-5 ${
              isPast
                ? 'border-amber-300 bg-amber-50/40'
                : 'border-primary-300 bg-primary-50/40'
            }`}
          >
            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
                  {isPast ? '⏰ Encerrar ciclo' : 'Ciclo em curso'}
                </p>
                <h2
                  className="text-2xl italic text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                  }}
                >
                  Domingo · {dateLabel}
                </h2>
              </div>
              {canClose && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
                  ✓ Pronto pra encerrar
                </span>
              )}
            </header>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <Link
                href={
                  b.stockTotal === 0
                    ? `/admin/compras`
                    : `/admin/estoque/encerrar/${date}`
                }
                className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                  b.stockTotal === 0
                    ? 'border-rose-300 bg-rose-50/40'
                    : b.stockPending === 0
                      ? 'border-emerald-300 bg-white'
                      : 'border-amber-300 bg-white'
                }`}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
                    1️⃣ Estoque
                  </p>
                  <p
                    className="text-2xl text-primary-500"
                    style={{
                      fontFamily:
                        'var(--font-cormorant), Georgia, serif',
                      fontWeight: 600,
                    }}
                  >
                    {b.stockTotal === 0 ? (
                      <span className="text-rose-600">⚠ Lançar compras</span>
                    ) : b.stockPending === 0 ? (
                      <span className="text-emerald-600">✓ Encerrado</span>
                    ) : (
                      <>
                        {b.stockPending}{' '}
                        <span className="text-sm font-normal text-primary-500/70">
                          {b.stockPending === 1 ? 'compra' : 'compras'} sem destino
                        </span>
                      </>
                    )}
                  </p>
                  {b.stockTotal === 0 && (
                    <p className="text-xs text-rose-700/80">
                      Nada lançado pra este ciclo
                    </p>
                  )}
                  {b.stockPending > 0 && (
                    <p className="text-xs text-primary-500/70">
                      {formatBRL(b.stockPendingValue)} pra decidir
                    </p>
                  )}
                </div>
                <span className="text-2xl text-primary-500/40">→</span>
              </Link>

              <Link
                href={`/admin/pedidos/cobrar/${date}`}
                className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                  b.paymentPending === 0
                    ? 'border-emerald-300 bg-white'
                    : 'border-rose-300 bg-white'
                }`}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
                    2️⃣ Pagamentos
                  </p>
                  <p
                    className="text-2xl text-primary-500"
                    style={{
                      fontFamily:
                        'var(--font-cormorant), Georgia, serif',
                      fontWeight: 600,
                    }}
                  >
                    {b.paymentPending === 0 ? (
                      <span className="text-emerald-600">✓ Tudo recebido</span>
                    ) : (
                      <>
                        {b.paymentPending}{' '}
                        <span className="text-sm font-normal text-primary-500/70">
                          {b.paymentPending === 1 ? 'pedido' : 'pedidos'} a receber
                        </span>
                      </>
                    )}
                  </p>
                  {b.paymentPending > 0 && (
                    <p className="text-xs text-primary-500/70">
                      R$ {b.paymentPendingValue.toFixed(2)} a cobrar
                    </p>
                  )}
                </div>
                <span className="text-2xl text-primary-500/40">→</span>
              </Link>
            </div>

            {canClose ? (
              <FinalCloseButton
                date={date}
                dateLabel={dateLabel}
                purchases={purchases}
                orders={orders}
              />
            ) : (
              <p className="rounded-md bg-white px-4 py-2 text-center text-xs text-primary-500/60">
                🔒 Resolva as 2 tarefas acima pra liberar o encerramento
                definitivo do ciclo
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

function FinalCloseButton({
  date,
  dateLabel,
  purchases,
  orders,
}: {
  date: string;
  dateLabel: string;
  purchases: Purchase[];
  orders: Order[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const cyclePurchases = purchases.filter((p) => p.productionDate === date);
  const cycleOrders = orders.filter((o) => o.date === date);

  const receita = cycleOrders
    .filter((o) => o.status === 'pago')
    .reduce((s, o) => s + o.total, 0);
  const custoProducao = cyclePurchases
    .filter((p) => p.status === 'used')
    .reduce((s, p) => s + p.totalCost, 0);
  const guardado = cyclePurchases
    .filter((p) => p.status === 'kept')
    .reduce((s, p) => s + p.totalCost, 0);
  const prejuizo = cyclePurchases
    .filter((p) => p.status === 'personal' || p.status === 'discarded')
    .reduce((s, p) => s + p.totalCost, 0);
  const lucro = receita - custoProducao - prejuizo;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-medium text-white hover:bg-emerald-600"
      >
        🎉 Encerrar ciclo definitivamente · {dateLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-6 shadow-2xl"
          >
            {confirmed ? (
              <div className="text-center">
                <p className="text-5xl">🎉</p>
                <p
                  className="mt-3 text-2xl italic text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                  }}
                >
                  Ciclo encerrado
                </p>
                <p className="mt-2 text-sm text-primary-500/70">
                  Os dados deste ciclo já estão disponíveis em Relatórios
                  e BI. Você pode descansar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmed(false);
                  }}
                  className="mt-5 rounded-full bg-primary-500 px-5 py-2 text-sm text-white hover:bg-primary-600"
                >
                  Voltar pro Dashboard
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
                  Encerramento definitivo
                </p>
                <h2
                  className="text-2xl italic text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                  }}
                >
                  {dateLabel}
                </h2>

                <ul className="mt-5 space-y-2 border-y border-primary-100 py-4 text-sm">
                  <li className="flex justify-between">
                    <span className="text-primary-500/70">Receita</span>
                    <span className="font-medium text-emerald-700">
                      R$ {receita.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-primary-500/70">
                      Custo de produção
                    </span>
                    <span className="text-primary-500">
                      − R$ {custoProducao.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-primary-500/70">
                      Prejuízo (pessoal + descarte)
                    </span>
                    <span className="text-rose-700">
                      − R$ {prejuizo.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-primary-500/70">
                      Estoque guardado
                    </span>
                    <span className="text-blue-700">
                      R$ {guardado.toFixed(2)} (pra próxima)
                    </span>
                  </li>
                  <li className="flex justify-between border-t border-primary-200 pt-2">
                    <span
                      className="text-base text-primary-500"
                      style={{
                        fontFamily:
                          'var(--font-cormorant), Georgia, serif',
                        fontWeight: 600,
                      }}
                    >
                      Lucro líquido
                    </span>
                    <span
                      className={
                        lucro >= 0
                          ? 'text-xl font-bold text-emerald-700'
                          : 'text-xl font-bold text-rose-700'
                      }
                      style={{
                        fontFamily:
                          'var(--font-cormorant), Georgia, serif',
                      }}
                    >
                      R$ {lucro.toFixed(2)}
                    </span>
                  </li>
                </ul>

                <p className="mt-3 text-[11px] text-primary-500/60">
                  Os dados ficam disponíveis em Relatórios e BI.
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-500/70 hover:border-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmed(true)}
                    className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    🎉 Confirmar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
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
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad';
  href?: string;
}) {
  const toneCls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'bad'
          ? 'border-rose-200 bg-rose-50'
          : 'border-primary-100 bg-white';
  const inner = (
    <>
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
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={`block rounded-xl border p-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${toneCls}`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneCls}`}>
      {inner}
    </div>
  );
}

// ─── Painel "Precisa de atenção" (badges agregados) ───
type Badges = {
  pedidos: number;
  clientes: number;
  comunidade: number;
  sugestoes: number;
  total: number;
};

function AttentionPanel() {
  const [badges, setBadges] = useState<Badges | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/badges', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Badges;
        if (!cancelled) setBadges(data);
      } catch {
        /* silencioso */
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!badges || badges.total === 0) return null;

  type BadgeKey = keyof Omit<Badges, 'total'>;
  type Item = { key: BadgeKey; label: string; icon: string; href: string; suffix: string };
  const items: Item[] = (
    [
      { key: 'pedidos',    label: 'pedido pendente',  icon: '🍕', href: '/admin/pedidos',    suffix: 'pendentes' },
      { key: 'comunidade', label: 'foto pra aprovar', icon: '📷', href: '/admin/comunidade', suffix: 'fotos pra aprovar' },
      { key: 'sugestoes',  label: 'sugestão nova',    icon: '💬', href: '/admin/sugestoes',  suffix: 'sugestões novas' },
      { key: 'clientes',   label: 'cadastro recente', icon: '👥', href: '/admin/clientes',   suffix: 'cadastros recentes' },
    ] as Item[]
  ).filter((i) => badges[i.key] > 0);

  return (
    <section className="rounded-2xl border-2 border-rose-300 bg-rose-50/40 p-5">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-rose-700/80">
            🔔 Precisa de atenção
          </p>
          <h2
            className="text-2xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            {badges.total} {badges.total === 1 ? 'item aguardando você' : 'itens aguardando você'}
          </h2>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const count = badges[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center justify-between rounded-xl border border-rose-200 bg-white p-4 transition-all hover:border-rose-400 hover:shadow-md"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
                  {item.icon} {count === 1 ? item.label : item.suffix}
                </p>
                <p
                  className="mt-1 text-3xl text-rose-600"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    fontWeight: 600,
                  }}
                >
                  {count}
                </p>
              </div>
              <span className="text-rose-400 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

