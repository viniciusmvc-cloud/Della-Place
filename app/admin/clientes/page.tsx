'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchCustomers, fetchOrders } from '@/lib/api';
import { type Order, type StoredCustomer } from '@/lib/orders';
import { formatDateBR } from '@/lib/utils';

const DAY = 1000 * 60 * 60 * 24;

export default function ClientesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([fetchOrders().catch(() => []), fetchCustomers().catch(() => [])])
      .then(([o, c]) => {
        setOrders(o);
        setCustomers(c);
      });
  }, []);

  const enriched = useMemo(() => {
    return customers
      .map((c) => {
        const cOrders = orders.filter((o) => o.customer.cpf === c.cpf);
        const active = cOrders.filter((o) => o.status !== 'cancelado');
        const paid = cOrders.filter((o) => o.status === 'pago');
        const totalPizzas = active.reduce(
          (sum, o) => sum + o.items.length,
          0,
        );
        const totalSpent = paid.reduce((s, o) => s + o.total, 0);

        const flavorCount: Record<string, number> = {};
        active.forEach((o) =>
          o.items.forEach(
            (it) => (flavorCount[it.flavor] = (flavorCount[it.flavor] || 0) + 1),
          ),
        );
        const favoriteFlavor =
          Object.entries(flavorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

        const lastDate =
          active
            .map((o) => o.date)
            .sort()
            .reverse()[0] ?? '';
        const daysSince = lastDate
          ? Math.floor(
              (Date.now() - new Date(`${lastDate}T12:00:00`).getTime()) / DAY,
            )
          : Infinity;

        const monthSpan = (() => {
          if (active.length < 2) return 1;
          const dates = active.map((o) => new Date(`${o.date}T12:00:00`).getTime()).sort();
          const span = (dates[dates.length - 1] - dates[0]) / (DAY * 30);
          return Math.max(span, 1);
        })();
        const frequency = active.length / monthSpan;

        const tier =
          totalSpent >= 500
            ? 'gold'
            : totalSpent >= 200
              ? 'silver'
              : active.length >= 1
                ? 'starter'
                : 'new';

        return {
          customer: c,
          ordersCount: active.length,
          totalPizzas,
          totalSpent,
          favoriteFlavor,
          lastDate,
          daysSince,
          frequency,
          tier,
        };
      })
      .filter(
        (e) =>
          search.trim() === '' ||
          e.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
          e.customer.cpf.includes(search) ||
          e.customer.phone.includes(search),
      )
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, orders, search]);

  const top5 = enriched.slice(0, 5);
  const inactive = enriched.filter(
    (e) => e.daysSince !== Infinity && e.daysSince >= 30,
  );
  const newOnes = enriched.filter((e) => e.ordersCount <= 1);

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Clientes
        </h1>
        <p className="text-sm text-primary-500/60">
          CRM com histórico, frequência, sabor favorito e alertas.
        </p>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, CPF ou telefone…"
        className="w-full rounded-md border border-primary-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary-500 md:max-w-md"
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Alert
          tone="gold"
          icon="🏆"
          title="Top clientes"
          empty="Sem dados ainda"
          items={top5.slice(0, 3).map(
            (e) => `${e.customer.fullName} — R$ ${e.totalSpent}`,
          )}
        />
        <Alert
          tone="warn"
          icon="🔔"
          title="Inativos (30+ dias)"
          empty="Nenhum cliente inativo"
          items={inactive.slice(0, 3).map(
            (e) => `${e.customer.fullName} — ${e.daysSince}d sem comprar`,
          )}
        />
        <Alert
          tone="info"
          icon="🆕"
          title="Novos clientes"
          empty="Nenhum novo cliente"
          items={newOnes.slice(0, 3).map(
            (e) =>
              `${e.customer.fullName} — ${e.ordersCount === 0 ? 'sem pedido ainda' : '1º pedido'}`,
          )}
        />
      </section>

      {enriched.length === 0 ? (
        <p className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2 text-right">Pizzas</th>
                <th className="px-3 py-2 text-right">Gasto</th>
                <th className="px-3 py-2 text-center">Freq./mês</th>
                <th className="px-3 py-2">Favorito</th>
                <th className="px-3 py-2">Última</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((e) => (
                <tr key={e.customer.cpf} className="border-t border-primary-100 align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium text-primary-500">
                      {e.customer.fullName}
                    </p>
                    <p className="text-[11px] text-primary-500/60">
                      {e.customer.phone} · {e.customer.cpf}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <TierBadge tier={e.tier} />
                  </td>
                  <td className="px-3 py-2 text-right">{e.totalPizzas}</td>
                  <td className="px-3 py-2 text-right font-medium text-primary-500">
                    R$ {e.totalSpent}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-primary-500/70">
                    {e.frequency.toFixed(1)}x
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/80">
                    {e.favoriteFlavor}
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/70">
                    {e.lastDate
                      ? `${formatDateBR(new Date(`${e.lastDate}T12:00:00`))} (${e.daysSince}d)`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Alert({
  tone,
  icon,
  title,
  items,
  empty,
}: {
  tone: 'gold' | 'warn' | 'info';
  icon: string;
  title: string;
  items: string[];
  empty: string;
}) {
  const cls =
    tone === 'gold'
      ? 'border-amber-200 bg-amber-50'
      : tone === 'warn'
        ? 'border-rose-200 bg-rose-50'
        : 'border-blue-200 bg-blue-50';
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary-500/70">
        {icon} {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-primary-500/50">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm text-primary-500/85">
          {items.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    gold: 'bg-amber-100 text-amber-800',
    silver: 'bg-slate-100 text-slate-800',
    starter: 'bg-blue-100 text-blue-800',
    new: 'bg-primary-100 text-primary-700',
  };
  const label: Record<string, string> = {
    gold: 'Ouro',
    silver: 'Prata',
    starter: 'Iniciante',
    new: 'Novo',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] ${map[tier]}`}>
      {label[tier]}
    </span>
  );
}
