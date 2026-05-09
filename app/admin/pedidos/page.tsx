'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import { fetchOrders, setOrderStatus as apiSetStatus } from '@/lib/api';
import { type Order, type OrderStatus } from '@/lib/orders';
import {
  PERIODS,
  PERIOD_LABEL,
  inPeriod,
  type Period,
} from '@/lib/period';
import { formatDateBR } from '@/lib/utils';

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
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};
const PAY_LABEL: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([]));
  }, [tick]);

  const sundayDates = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.date))).sort().reverse();
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders
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
    [orders, statusFilter, period, dateFilter],
  );

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

  async function setStatus(id: string, status: OrderStatus) {
    setOpenMenuId(null);
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
          Listados em ordem cronológica pelo horário de produção. Use o menu
          de ações pra confirmar, marcar pago ou cancelar.
        </p>
      </header>

      {dateFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
          <p className="flex-1 text-xs text-amber-900/85">
            🍕 Quando terminar de marcar os pagamentos do dia{' '}
            {formatDateBR(new Date(`${dateFilter}T12:00:00`))}, encerre o
            ciclo (estoque + financeiro) na tela própria.
          </p>
          <Link
            href={`/admin/compras/encerrar/${dateFilter}`}
            className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            ✓ Encerrar ciclo de{' '}
            {formatDateBR(new Date(`${dateFilter}T12:00:00`))}
          </Link>
        </div>
      )}

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
                  isMenuOpen={openMenuId === o.id}
                  onToggleMenu={() =>
                    setOpenMenuId(openMenuId === o.id ? null : o.id)
                  }
                  onAction={(s) => setStatus(o.id, s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  isMenuOpen,
  onToggleMenu,
  onAction,
}: {
  order: Order;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onAction: (status: OrderStatus) => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        onToggleMenu();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen, onToggleMenu]);

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
        <p className="font-medium text-primary-500">{order.customer.fullName}</p>
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
        {order.items.length}× ·{' '}
        {order.items.map((it) => it.flavor).join(' / ')}
      </td>
      <td className="px-3 py-2 text-right font-medium text-primary-500">
        R$ {order.total}
      </td>
      <td className="px-3 py-2 text-center">
        {order.status === 'cancelado' ? (
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${CONFIRM_TONE[confirmation]}`}
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
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] transition-colors hover:opacity-80 ${CONFIRM_TONE[confirmation]}`}
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
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] transition-colors hover:opacity-80 ${PAY_TONE[payment]}`}
          >
            {PAY_LABEL[payment]}
          </button>
        )}
      </td>
      <td className="relative px-3 py-2 text-center">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="Ações do pedido"
          className="rounded-full border border-primary-200 px-2 py-1 text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
        >
          ⋯
        </button>
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-3 z-20 mt-1 w-52 rounded-xl border border-primary-100 bg-white p-1 text-left shadow-lg"
          >
            {order.status !== 'cancelado' && (
              <>
                {confirmation === 'pendente' && (
                  <MenuItem
                    icon="✓"
                    label="Confirmar pedido"
                    onClick={() => onAction('confirmado')}
                  />
                )}
                {confirmation === 'confirmado' && payment === 'pendente' && (
                  <MenuItem
                    icon="💰"
                    label="Marcar como pago"
                    onClick={() => onAction('pago')}
                  />
                )}
                {payment === 'recebido' && (
                  <MenuItem
                    icon="↩"
                    label="Voltar para confirmado"
                    onClick={() => onAction('confirmado')}
                  />
                )}
                <MenuItem
                  icon="🗑"
                  label="Cancelar pedido"
                  tone="danger"
                  onClick={() => {
                    if (
                      confirm(
                        'Cancelar este pedido? O horário volta a ficar disponível pra outros clientes.',
                      )
                    ) {
                      onAction('cancelado');
                    }
                  }}
                />
              </>
            )}
            {order.status === 'cancelado' && (
              <MenuItem
                icon="↺"
                label="Reabrir pedido (volta pra pendente)"
                onClick={() => onAction('pendente')}
              />
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function MenuItem({
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
          ? 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50'
          : 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary-500/80 hover:bg-primary-50'
      }
    >
      <span className="w-4 text-center" aria-hidden="true">
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
