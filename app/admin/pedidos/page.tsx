'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchOrders, setOrderStatus as apiSetStatus } from '@/lib/api';
import { type Order, type OrderStatus } from '@/lib/orders';
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';
import { formatDateBR } from '@/lib/utils';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  pago: 'Recebido',
  cancelado: 'Cancelado',
};

const STATUS_BG: Record<OrderStatus, string> = {
  pendente: 'bg-amber-400 text-amber-950 hover:bg-amber-500',
  confirmado: 'bg-blue-500 text-white hover:bg-blue-600',
  pago: 'bg-emerald-500 text-white hover:bg-emerald-600',
  cancelado: 'bg-rose-500 text-white hover:bg-rose-600',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([]));
  }, [tick]);

  const sundayDates = useMemo(() => {
    const all = Array.from(new Set(orders.map((o) => o.date))).sort().reverse();
    return all;
  }, [orders]);

  const filtered = orders
    .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
    .filter((o) => (period === 'all' ? true : inPeriod(o.date, period)))
    .filter((o) => (dateFilter ? o.date === dateFilter : true))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const aTime = a.items[0]?.time ?? '00:00';
      const bTime = b.items[0]?.time ?? '00:00';
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      return a.customer.fullName.localeCompare(b.customer.fullName);
    });

  const stats = useMemo(() => {
    const inScope = filtered.filter((o) => o.status !== 'cancelado');
    const recebido = inScope
      .filter((o) => o.status === 'pago')
      .reduce((s, o) => s + o.total, 0);
    const aReceber = inScope
      .filter((o) => o.status !== 'pago')
      .reduce((s, o) => s + o.total, 0);
    return {
      qtd: inScope.length,
      pendentes: filtered.filter((o) => o.status === 'pendente').length,
      recebido,
      aReceber,
    };
  }, [filtered]);

  async function cycleStatus(o: Order) {
    const next: Record<OrderStatus, OrderStatus> = {
      pendente: 'confirmado',
      confirmado: 'pago',
      pago: 'pendente',
      cancelado: 'pendente',
    };
    await apiSetStatus(o.id, next[o.status]);
    setTick((t) => t + 1);
  }

  async function setStatus(id: string, status: OrderStatus) {
    await apiSetStatus(id, status);
    setTick((t) => t + 1);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Pedidos
        </h1>
        <p className="text-sm text-primary-500/60">
          Lista completa de pedidos. Clique no status para avançar (pendente →
          confirmado → recebido).
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <KPI label="Pedidos" value={String(stats.qtd)} />
        <KPI
          label="Pendentes"
          value={String(stats.pendentes)}
          tone={stats.pendentes > 0 ? 'warn' : undefined}
        />
        <KPI label="Recebido" value={`R$ ${stats.recebido}`} tone="good" />
        <KPI label="A receber" value={`R$ ${stats.aReceber}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary-100 bg-white p-3">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/60">
            Período
          </p>
          <div className="flex flex-wrap gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  setDateFilter('');
                }}
                className={
                  period === p
                    ? 'rounded-full bg-primary-500 px-3 py-1 text-xs text-white'
                    : 'rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70 hover:border-primary-500'
                }
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/60">
            Domingo específico
          </p>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPeriod('all');
            }}
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">— todos —</option>
            {sundayDates.map((d) => (
              <option key={d} value={d}>
                {formatDateBR(new Date(`${d}T12:00:00`))}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/60">
            Status
          </p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">— todos —</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="pago">Recebido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
          Nenhum pedido neste filtro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Pizzas</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-center">Pagamento</th>
                <th className="px-3 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-primary-100 align-top"
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-primary-500">
                      {o.customer.fullName}
                    </p>
                    <p className="text-[11px] text-primary-500/60">
                      {o.customer.phone}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-primary-500/60">
                    {o.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/70">
                    {formatDateBR(new Date(`${o.date}T12:00:00`))}
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/70">
                    {o.items.length}× ·{' '}
                    {o.items.map((it) => `${it.time} ${it.flavor}`).join(' / ')}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-primary-500">
                    R$ {o.total}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => cycleStatus(o)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${STATUS_BG[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {o.status !== 'cancelado' ? (
                      <button
                        type="button"
                        onClick={() => setStatus(o.id, 'cancelado')}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        cancelar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStatus(o.id, 'pendente')}
                        className="text-[11px] text-primary-500/60 hover:underline"
                      >
                        reabrir
                      </button>
                    )}
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

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn';
}) {
  const cls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
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
