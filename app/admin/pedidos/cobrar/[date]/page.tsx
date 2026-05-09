'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { fetchOrders, setOrderStatus as apiSetStatus } from '@/lib/api';
import { type Order } from '@/lib/orders';
import { formatDateBR } from '@/lib/utils';

export default function CobrarPedidosPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const all = await fetchOrders();
      setOrders(all.filter((o) => o.date === date));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [date]);

  const pendingPayment = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'pendente' || o.status === 'confirmado',
      ),
    [orders],
  );
  const paid = useMemo(
    () => orders.filter((o) => o.status === 'pago'),
    [orders],
  );
  const cancelled = useMemo(
    () => orders.filter((o) => o.status === 'cancelado'),
    [orders],
  );

  const totals = useMemo(() => {
    return {
      received: paid.reduce((s, o) => s + o.total, 0),
      pending: pendingPayment.reduce((s, o) => s + o.total, 0),
    };
  }, [paid, pendingPayment]);

  async function markPaid(o: Order) {
    setBusyId(o.id);
    try {
      await apiSetStatus(o.id, 'pago');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOrder(o: Order) {
    if (
      !confirm(
        `Cancelar o pedido de ${o.customer.fullName}? O horário libera pra outro cliente reservar.`,
      )
    )
      return;
    setBusyId(o.id);
    try {
      await apiSetStatus(o.id, 'cancelado');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  function backToDashboard() {
    router.push('/admin');
  }

  const dateLabel = formatDateBR(new Date(`${date}T12:00:00`));
  const allDone = pendingPayment.length === 0;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/admin"
          className="text-xs text-primary-500/60 hover:text-primary-500"
        >
          ← Voltar pro Dashboard
        </Link>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-primary-500/60">
          Tarefa 2 de 2 · Encerramento do ciclo
        </p>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          💰 Cobrar pagamentos · {dateLabel}
        </h1>
        <p className="text-sm text-primary-500/60">
          Para cada pedido que ainda não pagou: cobre via WhatsApp, marque
          como recebido ou cancele se o cliente desistiu.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <KPI
          label="A receber"
          value={`R$ ${totals.pending.toFixed(2)}`}
          tone={totals.pending > 0 ? 'warn' : undefined}
          hint={`${pendingPayment.length} pedido${pendingPayment.length === 1 ? '' : 's'}`}
        />
        <KPI
          label="Recebido"
          value={`R$ ${totals.received.toFixed(2)}`}
          tone="good"
          hint={`${paid.length} pago${paid.length === 1 ? '' : 's'}`}
        />
        <KPI
          label="Cancelado"
          value={String(cancelled.length)}
          hint={cancelled.length === 1 ? 'pedido' : 'pedidos'}
        />
      </section>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-primary-500/60">Carregando pedidos…</p>
      ) : pendingPayment.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-3xl text-emerald-600">✓</p>
          <p className="mt-2 font-medium text-primary-500">
            Todos os pedidos foram pagos.
          </p>
          <p className="mt-1 text-sm text-primary-500/70">
            Pode voltar pro Dashboard pra encerrar o ciclo definitivamente.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pendingPayment.map((o) => {
            const phoneDigits = o.customer.phone.replace(/\D/g, '');
            const greet = o.customer.fullName.trim().split(/\s+/)[0];
            const itemsList = o.items
              .map(
                (it) =>
                  `${it.time} · ${it.flavor} · R$ ${it.price}`,
              )
              .join('\n');
            const message = encodeURIComponent(
              `Olá, ${greet}! Tudo bem? 👋\n\n` +
                `Sobre seu pedido na Della Pace de ${dateLabel}:\n${itemsList}\n\n` +
                `Total: R$ ${o.total}\n\n` +
                `Como prefere pagar? Pix ou dinheiro na entrega.`,
            );
            const waLink = `https://wa.me/55${phoneDigits}?text=${message}`;

            return (
              <li
                key={o.id}
                className="rounded-xl border border-rose-200 bg-rose-50/30 p-4"
              >
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-base font-medium text-primary-500">
                      {o.customer.fullName}
                    </p>
                    <p className="text-[11px] text-primary-500/70">
                      {o.customer.phone} · {o.items.length} pizza
                      {o.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-xl font-medium text-primary-500">
                    R$ {o.total}
                  </span>
                </header>

                <details className="mb-3 text-xs">
                  <summary className="cursor-pointer text-primary-500/70 hover:text-primary-500">
                    Ver itens do pedido
                  </summary>
                  <ul className="mt-2 space-y-1 text-primary-500/80">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        🕒 {it.time} · 🍕 {it.flavor} ({it.finish}) · R$ {it.price}
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="grid gap-2 md:grid-cols-3">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    📨 Cobrar via WhatsApp
                  </a>
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => markPaid(o)}
                    className="rounded-lg border border-emerald-500 bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ✓ Recebi
                  </button>
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => cancelOrder(o)}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    🗑 Cancelar pedido
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paid.length > 0 && (
        <details className="rounded-xl border border-primary-100 bg-white p-3 text-xs">
          <summary className="cursor-pointer font-medium text-primary-500/70">
            Já pagos neste ciclo ({paid.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {paid.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-md border border-primary-100 px-3 py-1.5"
              >
                <span className="text-primary-500/80">
                  <strong className="text-primary-500">
                    {o.customer.fullName}
                  </strong>{' '}
                  · R$ {o.total}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                  Recebido
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <footer className="rounded-2xl border-2 border-primary-300 bg-primary-50/30 p-4">
        <button
          type="button"
          onClick={backToDashboard}
          className={
            allDone
              ? 'block w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-medium text-white hover:bg-emerald-600'
              : 'block w-full rounded-full bg-primary-500 px-5 py-3 text-center text-sm font-medium text-white hover:bg-primary-600'
          }
        >
          {allDone
            ? `✓ Tarefa 2 concluída · Voltar pro Dashboard`
            : `← Salvar progresso e voltar pro Dashboard`}
        </button>
      </footer>
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn';
  hint?: string;
}) {
  const cls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : 'border-primary-100 bg-white';
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
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
