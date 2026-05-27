'use client';

import { useEffect, useMemo, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import { fetchOrders, setOrderStatus as apiSetStatus } from '@/lib/api';
import { formatBRL, titleCase } from '@/lib/format';
import { type Order, type OrderStatus } from '@/lib/orders';
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';
import { formatDateBR, formatDateISO } from '@/lib/utils';

type View = 'atual' | 'historico';

type ConfirmationStatus = 'pendente' | 'confirmado' | 'cancelado';
type PaymentStatus = 'pendente' | 'recebido';

function deriveConfirmation(s: OrderStatus): ConfirmationStatus {
  if (s === 'cancelado') return 'cancelado';
  if (s === 'pendente') return 'pendente';
  return 'confirmado';
}
function derivePayment(s: OrderStatus): PaymentStatus {
  return s === 'pago' ? 'recebido' : 'pendente';
}

const CONFIRM_TONE: Record<ConfirmationStatus, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelado: 'bg-rose-100 text-rose-800 border-rose-200',
};

const PAY_TONE: Record<PaymentStatus, string> = {
  pendente: 'bg-rose-100 text-rose-800 border-rose-200',
  recebido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const CONFIRM_LABEL: Record<ConfirmationStatus, string> = {
  pendente: '○ Pendente',
  confirmado: '✓ Confirmado',
  cancelado: '✗ Cancelado',
};
const PAY_LABEL: Record<PaymentStatus, string> = {
  pendente: '○ A receber',
  recebido: '💰 Recebido',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<View>('atual');
  const [period, setPeriod] = useState<Period>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [actionFor, setActionFor] = useState<Order | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([]));
  }, [tick]);

  const today = useMemo(() => formatDateISO(new Date()), []);

  // Ciclo atual = pedidos com data >= hoje (próximo domingo / em produção)
  // Histórico = pedidos com data < hoje (ciclos passados, pago/cancelado)
  const inView = (o: Order) =>
    view === 'atual' ? o.date >= today : o.date < today;

  const sundayDates = useMemo(() => {
    return Array.from(new Set(orders.filter(inView).map((o) => o.date)))
      .sort()
      .reverse();
  }, [orders, view, today]);

  const filtered = useMemo(
    () =>
      orders
        .filter(inView)
        .filter((o) =>
          statusFilter === 'all' ? true : o.status === statusFilter,
        )
        .filter((o) => (period === 'all' ? true : inPeriod(o.date, period)))
        .filter((o) => (dateFilter ? o.date === dateFilter : true))
        .sort((a, b) => {
          const aTime = a.items[0]?.time ?? '00:00';
          const bTime = b.items[0]?.time ?? '00:00';
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (aTime !== bTime) return aTime.localeCompare(bTime);
          return a.customer.fullName.localeCompare(b.customer.fullName);
        }),
    [orders, view, today, statusFilter, period, dateFilter],
  );

  const stats = useMemo(() => {
    const inScope = filtered.filter((o) => o.status !== 'cancelado');
    const recebido = inScope
      .filter((o) => o.status === 'pago')
      .reduce((s, o) => s + o.total, 0);
    const aReceber = inScope
      .filter((o) => o.status !== 'pago')
      .reduce((s, o) => s + o.total, 0);
    const pizzas = inScope.reduce((s, o) => s + o.items.length, 0);
    return {
      qtd: inScope.length,
      pizzas,
      pendentes: filtered.filter((o) => o.status === 'pendente').length,
      recebido,
      aReceber,
    };
  }, [filtered]);

  async function setStatus(
    id: string,
    status: OrderStatus,
    cancellationReason?: string | null,
  ) {
    setActionFor(null);
    await apiSetStatus(id, status, cancellationReason);
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
          {view === 'atual'
            ? 'Pedidos do ciclo atual e futuros — ainda em produção ou aguardando.'
            : 'Pedidos de ciclos passados — somente leitura.'}
        </p>
      </header>

      <div className="inline-flex rounded-full border border-primary-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setView('atual')}
          className={
            view === 'atual'
              ? 'rounded-full bg-primary-500 px-4 py-1.5 text-xs font-medium text-white'
              : 'rounded-full px-4 py-1.5 text-xs text-primary-500/70 hover:text-primary-500'
          }
        >
          Ciclo atual
        </button>
        <button
          type="button"
          onClick={() => setView('historico')}
          className={
            view === 'historico'
              ? 'rounded-full bg-primary-500 px-4 py-1.5 text-xs font-medium text-white'
              : 'rounded-full px-4 py-1.5 text-xs text-primary-500/70 hover:text-primary-500'
          }
        >
          Histórico
        </button>
      </div>

      <HelpBanner
        id="pedidos"
        title="Pedidos"
        whenToFill="Você não cria pedidos aqui. Eles entram automaticamente quando o cliente reserva pelo site."
        steps={[
          'Confirme o pedido após combinar com o cliente: clique no badge "Pendente" da coluna Confirmação. Vira "Confirmado".',
          'Quando receber o pagamento (na entrega): clique no badge "Pendente" da coluna Pagamento. Vira "Recebido".',
          'Pra alterar (cancelar, reabrir, voltar status): use o menu ⋯ na última coluna.',
          'Clique no telefone do cliente pra abrir direto o WhatsApp dele.',
        ]}
        doNot={[
          'Custos e ingredientes não vão aqui. Vão em Compras (ingredientes) ou Financeiro (gás, luz, água).',
          'Não cancele um pedido só porque o cliente desmarcou. Conversa primeiro pelo WhatsApp.',
        ]}
        notes="Cancelar libera o horário automaticamente pra outro cliente reservar."
      />

      <div className="grid gap-3 md:grid-cols-5">
        <KPI label="Pedidos" value={String(stats.qtd)} />
        <KPI label="Pizzas" value={String(stats.pizzas)} />
        <KPI
          label="Pendentes"
          value={String(stats.pendentes)}
          tone={stats.pendentes > 0 ? 'warn' : undefined}
        />
        <KPI
          label="A receber"
          value={formatBRL(stats.aReceber)}
          tone={stats.aReceber > 0 ? 'warn' : undefined}
        />
        <KPI label="Recebido" value={formatBRL(stats.recebido)} tone="good" />
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
                <th className="px-3 py-2">Horário</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Pizzas</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-center">Confirmação</th>
                <th className="px-3 py-2 text-center">Pagamento</th>
                <th className="px-3 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  onOpenActions={() => setActionFor(o)}
                  onAction={(s) => setStatus(o.id, s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionFor && (
        <ActionsModal
          order={actionFor}
          onClose={() => setActionFor(null)}
          onAction={(status, reason) =>
            setStatus(actionFor.id, status, reason)
          }
        />
      )}
    </div>
  );
}

function OrderRow({
  order,
  onOpenActions,
  onAction,
}: {
  order: Order;
  onOpenActions: () => void;
  onAction: (status: OrderStatus) => void;
}) {
  const firstTime = order.items[0]?.time ?? '—';
  const confirmation = deriveConfirmation(order.status);
  const payment = derivePayment(order.status);

  return (
    <tr className="border-t border-primary-100 align-top">
      <td className="px-3 py-2">
        <span
          className="inline-block rounded bg-primary-500 px-2 py-0.5 text-[12px] text-white"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          {firstTime}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-primary-500/80">
        {formatDateBR(new Date(`${order.date}T12:00:00`))}
      </td>
      <td className="px-3 py-2">
        <p className="font-medium text-primary-500">
          {order.customer.fullName}
        </p>
        <a
          href={`https://wa.me/55${order.customer.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir conversa no WhatsApp"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.45 3.43 1.32 4.93L2 22l5.32-1.4a9.92 9.92 0 0 0 4.72 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7.01A9.83 9.83 0 0 0 12.04 2zm0 1.81c2.16 0 4.18.84 5.71 2.36a8.07 8.07 0 0 1 2.37 5.74c0 4.46-3.62 8.09-8.08 8.09-1.49 0-2.93-.4-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.04 8.04 0 0 1-1.23-4.24c0-4.46 3.62-8.1 8.08-8.1z" />
          </svg>
          {order.customer.phone}
        </a>
      </td>
      <td className="px-3 py-2 text-xs text-primary-500/70">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-primary-500/50">
          {order.items.length} pizza{order.items.length === 1 ? '' : 's'}
        </p>
        {order.items.length === 1 ? (
          <p>🍕 {titleCase(order.items[0].flavor)}</p>
        ) : (
          <ul className="space-y-0.5">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-baseline gap-1">
                <span className="text-[10px] text-primary-500/50">{i + 1}.</span>
                <span>🍕 {titleCase(it.flavor)}</span>
                {it.finish === 'Congelada' && (
                  <span className="text-[10px] text-blue-700">❄</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-3 py-2 text-right font-medium text-primary-500">
        {formatBRL(order.total)}
      </td>
      <td className="px-3 py-2 text-center">
        {order.status === 'cancelado' ? (
          <span
            className={`inline-block rounded-full border px-3 py-1 text-[12px] ${CONFIRM_TONE[confirmation]}`}
          >
            {CONFIRM_LABEL[confirmation]}
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              onAction(
                confirmation === 'pendente' ? 'confirmado' : 'pendente',
              )
            }
            title={
              confirmation === 'pendente'
                ? 'Clique pra confirmar o pedido'
                : 'Clique pra voltar para pendente'
            }
            className={`inline-block cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium shadow-sm transition-all hover:scale-105 hover:shadow-md ${CONFIRM_TONE[confirmation]}`}
          >
            {CONFIRM_LABEL[confirmation]}
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {order.status === 'cancelado' ? (
          <span className="text-[11px] text-primary-500/40">—</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (confirmation === 'pendente' && payment === 'pendente') {
                if (
                  !confirm(
                    'Marcar como Recebido também confirma o pedido. Continuar?',
                  )
                )
                  return;
              }
              onAction(payment === 'pendente' ? 'pago' : 'confirmado');
            }}
            title={
              payment === 'pendente'
                ? 'Clique pra marcar como recebido'
                : 'Clique pra voltar para pendente de pagamento'
            }
            className={`inline-block cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium shadow-sm transition-all hover:scale-105 hover:shadow-md ${PAY_TONE[payment]}`}
          >
            {PAY_LABEL[payment]}
          </button>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={onOpenActions}
          aria-label="Ações do pedido"
          title="Abrir menu de ações (cancelar, alterar status…)"
          className="rounded-full border border-primary-200 px-3 py-1 text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
        >
          ⋯
        </button>
        {order.status === 'cancelado' && order.cancellationReason && (
          <p
            className="mt-1 max-w-[140px] text-[10px] leading-tight text-rose-700"
            title={order.cancellationReason}
          >
            <span className="font-medium">Motivo:</span>{' '}
            {order.cancellationReason.length > 28
              ? `${order.cancellationReason.slice(0, 28)}…`
              : order.cancellationReason}
          </p>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal central de ações (substitui o dropdown antigo, que era
// cortado pelo overflow-x-auto da tabela).
// ─────────────────────────────────────────────────────────────────
function ActionsModal({
  order,
  onClose,
  onAction,
}: {
  order: Order;
  onClose: () => void;
  onAction: (status: OrderStatus, cancellationReason?: string | null) => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirmation = deriveConfirmation(order.status);
  const payment = derivePayment(order.status);
  const customerName = order.customer.fullName;
  const firstTime = order.items[0]?.time ?? '';
  const dateLabel = formatDateBR(new Date(`${order.date}T12:00:00`));

  function handleCancel() {
    const trimmed = reason.trim();
    if (!trimmed) {
      alert('Por favor, escreva o motivo do cancelamento.');
      return;
    }
    onAction('cancelado', trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3
              className="text-xl text-primary-500"
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontWeight: 600,
              }}
            >
              {customerName}
            </h3>
            <p className="text-xs text-primary-500/60">
              {firstTime && `${firstTime} · `}
              {dateLabel} · {order.items.length} pizza
              {order.items.length === 1 ? '' : 's'} · {formatBRL(order.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-primary-500/60 hover:bg-primary-50 hover:text-primary-500"
          >
            ✕
          </button>
        </header>

        {!confirmingCancel ? (
          <div className="space-y-2">
            {order.status !== 'cancelado' && (
              <>
                {confirmation === 'pendente' && (
                  <ActionButton
                    icon="✓"
                    label="Confirmar pedido"
                    onClick={() => onAction('confirmado')}
                  />
                )}
                {confirmation === 'confirmado' && payment === 'pendente' && (
                  <ActionButton
                    icon="💰"
                    label="Marcar como pago"
                    onClick={() => onAction('pago')}
                  />
                )}
                {payment === 'recebido' && (
                  <ActionButton
                    icon="↩"
                    label="Voltar para confirmado"
                    onClick={() => onAction('confirmado')}
                  />
                )}
                <ActionButton
                  icon="🗑"
                  label="Cancelar pedido"
                  tone="danger"
                  onClick={() => setConfirmingCancel(true)}
                />
              </>
            )}
            {order.status === 'cancelado' && (
              <>
                {order.cancellationReason && (
                  <div className="mb-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-rose-600">
                      Motivo do cancelamento
                    </p>
                    {order.cancellationReason}
                  </div>
                )}
                <ActionButton
                  icon="↺"
                  label="Reabrir pedido (volta pra pendente)"
                  onClick={() => onAction('pendente', null)}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="mb-1 font-medium">⚠️ Cancelar este pedido?</p>
              <p>
                O horário {firstTime && <strong>{firstTime}</strong>} de{' '}
                {dateLabel} volta a ficar disponível pra outros clientes.
              </p>
            </div>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                Motivo do cancelamento <span className="text-rose-600">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Ex: cliente desistiu, problema com a massa, viagem do Aurélio…"
                className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
              <p className="mt-1 text-[10px] text-primary-500/60">
                Esse motivo fica salvo no pedido (visível só pra você).
              </p>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmingCancel(false);
                  setReason('');
                }}
                className="rounded-full border border-primary-200 px-4 py-1.5 text-sm text-primary-500/80 hover:border-primary-500"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!reason.trim()}
                className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                🗑 Confirmar cancelamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === 'danger'
          ? 'flex w-full items-center gap-3 rounded-lg border border-rose-200 bg-rose-50/40 px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50'
          : 'flex w-full items-center gap-3 rounded-lg border border-primary-100 bg-white px-4 py-3 text-left text-sm text-primary-500 hover:border-primary-500 hover:bg-primary-50/40'
      }
    >
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
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
