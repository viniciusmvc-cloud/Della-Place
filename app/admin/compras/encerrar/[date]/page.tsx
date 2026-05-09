'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import {
  fetchExpenses,
  fetchOrders,
  fetchPurchases,
  setOrderStatus,
  updatePurchase,
} from '@/lib/api';
import { type Expense } from '@/lib/expenses';
import { type Order } from '@/lib/orders';
import { CATEGORY_LABEL, type ProductCategory } from '@/lib/products';
import {
  STATUS_HINT,
  STATUS_LABEL,
  type Purchase,
  type PurchaseStatus,
} from '@/lib/purchases';
import { formatDateBR } from '@/lib/utils';

const CATEGORY_DOT: Record<ProductCategory, string> = {
  massa: 'bg-amber-400',
  molho: 'bg-rose-400',
  cobertura: 'bg-emerald-400',
  operacao: 'bg-blue-400',
};

const ACTIONS: Array<{
  status: PurchaseStatus;
  label: string;
  hint: string;
  color: string;
}> = [
  {
    status: 'used',
    label: '✓ Acabou',
    hint: 'Foi todo consumido na produção (caso comum)',
    color: 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50',
  },
  {
    status: 'kept',
    label: '📦 Guardar',
    hint: 'Sobrou bom, vai pra estoque do próximo ciclo',
    color: 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50',
  },
  {
    status: 'personal',
    label: '🍽 Uso pessoal',
    hint: 'Foi pra casa do Aurélio (não vendido)',
    color: 'border-purple-300 bg-white text-purple-700 hover:bg-purple-50',
  },
  {
    status: 'discarded',
    label: '🗑 Descarte',
    hint: 'Estragou ou foi jogado fora',
    color: 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50',
  },
];

export default function EncerrarPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [purchaseList, allOrders, allExpenses] = await Promise.all([
        fetchPurchases({ productionDate: date }),
        fetchOrders().catch(() => []),
        fetchExpenses().catch(() => []),
      ]);
      setPurchases(purchaseList);
      setOrders(allOrders.filter((o) => o.date === date));
      setExpenses(allExpenses.filter((e) => e.date === date));
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

  const pending = useMemo(
    () => purchases.filter((p) => p.status === 'pending'),
    [purchases],
  );
  const closed = useMemo(
    () => purchases.filter((p) => p.status !== 'pending'),
    [purchases],
  );

  const totals = useMemo(() => {
    const t = { used: 0, kept: 0, personal: 0, discarded: 0, pending: 0 };
    purchases.forEach((p) => {
      t[p.status] += p.totalCost;
    });
    return t;
  }, [purchases]);

  // ─── Pendências de pagamento e resumo financeiro ───
  const pendingPayments = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'pendente' || o.status === 'confirmado',
      ),
    [orders],
  );
  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === 'pago'),
    [orders],
  );
  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === 'cancelado'),
    [orders],
  );

  const financial = useMemo(() => {
    const receita = paidOrders.reduce((s, o) => s + o.total, 0);
    const aReceber = pendingPayments.reduce((s, o) => s + o.total, 0);
    // Custo de produção: usado (foi pra pizza). Guardado vira ativo, não custo do ciclo.
    const custoProducao = totals.used;
    // Prejuízo: pessoal e descarte (compras que não viraram receita)
    const prejuizo = totals.personal + totals.discarded;
    const despesasOp = expenses.reduce((s, e) => s + e.amount, 0);
    const lucro = receita - custoProducao - prejuizo - despesasOp;
    return { receita, aReceber, custoProducao, prejuizo, despesasOp, lucro };
  }, [paidOrders, pendingPayments, totals, expenses]);

  const canCloseCycle =
    pending.length === 0 && pendingPayments.length === 0;

  async function markOrderPaid(o: Order) {
    setBusyOrderId(o.id);
    try {
      await setOrderStatus(o.id, 'pago');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyOrderId(null);
    }
  }

  async function decide(p: Purchase, status: PurchaseStatus) {
    setBusyId(p.id);
    setPurchases((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, status, closedAt: new Date().toISOString() }
          : x,
      ),
    );
    try {
      await updatePurchase(p.id, { status });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function bulkUsed() {
    if (!confirm('Marcar TODAS as compras pendentes como "Acabou"?')) return;
    setBusyId(-1);
    try {
      await Promise.all(
        pending.map((p) => updatePurchase(p.id, { status: 'used' })),
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  function done() {
    router.push('/admin/compras');
  }

  const dateLabel = formatDateBR(new Date(`${date}T12:00:00`));

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/admin/compras"
          className="text-xs text-primary-500/60 hover:text-primary-500"
        >
          ← Voltar pra Compras
        </Link>
        <h1
          className="mt-1 text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Encerrar ciclo · {dateLabel}
        </h1>
        <p className="text-sm text-primary-500/60">
          Pra cada compra desse domingo, escolha o que aconteceu. Vai sumir
          dessa tela e ser arquivada como histórico.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KPI label="Pendente" value={`R$ ${totals.pending.toFixed(2)}`} tone="warn" />
        <KPI label="Usado" value={`R$ ${totals.used.toFixed(2)}`} tone="good" />
        <KPI label="Guardado" value={`R$ ${totals.kept.toFixed(2)}`} />
        <KPI label="Pessoal" value={`R$ ${totals.personal.toFixed(2)}`} />
        <KPI label="Descarte" value={`R$ ${totals.discarded.toFixed(2)}`} tone="bad" />
      </section>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-primary-500/60">Carregando…</p>
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-3xl text-emerald-600">✓</p>
          <p className="mt-2 font-medium text-primary-500">Ciclo encerrado.</p>
          <p className="mt-2 text-sm text-primary-500/70">
            Todas as compras desse domingo já têm destino. Pode descansar.
          </p>
          <button
            type="button"
            onClick={done}
            className="mt-4 rounded-full bg-primary-500 px-5 py-2 text-sm text-white"
          >
            Voltar pra Compras
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={bulkUsed}
              disabled={busyId === -1}
              className="rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              title='Caso normal: tudo o que comprou foi usado na produção.'
            >
              ✓ Marcar tudo como "Acabou"
            </button>
          </div>

          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"
              >
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-base font-medium text-primary-500">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[p.productCategory]}`}
                      />
                      {p.productName}
                      <span className="text-[11px] font-normal text-primary-500/60">
                        ({CATEGORY_LABEL[p.productCategory]})
                      </span>
                    </p>
                    <p className="text-[11px] text-primary-500/70">
                      {p.quantity} {p.unit}
                      {p.brand && ` · ${p.brand}`} · R$ {p.totalCost.toFixed(2)}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                </header>
                <div className="grid gap-2 md:grid-cols-4">
                  {ACTIONS.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => decide(p, a.status)}
                      title={a.hint}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${a.color}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-primary-500/50">
                  {ACTIONS.map((a) => `${a.label}: ${a.hint}`).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {closed.length > 0 && (
        <section className="rounded-xl border border-primary-100 bg-white p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Já decidido neste ciclo ({closed.length})
          </h2>
          <ul className="space-y-1.5">
            {closed.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-primary-100 px-3 py-1.5 text-xs"
              >
                <span className="flex-1 text-primary-500/80">
                  <strong className="text-primary-500">{p.productName}</strong>
                  {' · '}
                  {p.quantity} {p.unit} · R$ {p.totalCost.toFixed(2)}
                </span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] text-primary-700">
                  {STATUS_LABEL[p.status]}
                </span>
                <button
                  type="button"
                  onClick={() => decide(p, 'pending')}
                  className="text-[10px] text-primary-500/60 hover:text-primary-500"
                  title={STATUS_HINT[p.status]}
                >
                  desfazer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── ENCERRAMENTO FINANCEIRO ─────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border-2 border-primary-300 bg-primary-50/30 p-5">
        <header>
          <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
            Encerramento financeiro
          </p>
          <h2
            className="text-2xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Encontro de contas · {dateLabel}
          </h2>
        </header>

        {/* Pendências de pagamento */}
        <div className="rounded-xl border border-primary-100 bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary-500/70">
            💰 Pagamentos do dia
            {pendingPayments.length > 0 ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">
                {pendingPayments.length} a receber
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                tudo recebido ✓
              </span>
            )}
          </p>
          {pendingPayments.length > 0 ? (
            <ul className="space-y-1.5">
              {pendingPayments.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-rose-100 bg-rose-50/40 px-3 py-1.5 text-xs"
                >
                  <span className="flex-1 text-primary-500/85">
                    <strong className="text-primary-500">
                      {o.customer.fullName}
                    </strong>{' '}
                    · {o.items.length} pizza
                    {o.items.length > 1 ? 's' : ''} · R$ {o.total}
                    <a
                      href={`https://wa.me/55${o.customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-emerald-600 hover:underline"
                    >
                      cobrar via WhatsApp
                    </a>
                  </span>
                  <button
                    type="button"
                    disabled={busyOrderId === o.id}
                    onClick={() => markOrderPaid(o)}
                    className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ✓ Recebi
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-primary-500/60">
              Nenhum pedido pendente de pagamento neste ciclo.
            </p>
          )}
        </div>

        {/* Resumo financeiro */}
        <div className="grid gap-3 md:grid-cols-3">
          <KPI
            label="Receita (recebido)"
            value={`R$ ${financial.receita.toFixed(2)}`}
            tone="good"
          />
          <KPI
            label="A receber"
            value={`R$ ${financial.aReceber.toFixed(2)}`}
            tone={financial.aReceber > 0 ? 'warn' : undefined}
          />
          <KPI
            label="Custo de produção"
            value={`R$ ${financial.custoProducao.toFixed(2)}`}
          />
          <KPI
            label="Prejuízo (pessoal+descarte)"
            value={`R$ ${financial.prejuizo.toFixed(2)}`}
            tone={financial.prejuizo > 0 ? 'bad' : undefined}
          />
          <KPI
            label="Despesas operacionais"
            value={`R$ ${financial.despesasOp.toFixed(2)}`}
          />
          <KPI
            label="Lucro líquido"
            value={`R$ ${financial.lucro.toFixed(2)}`}
            tone={financial.lucro >= 0 ? 'good' : 'bad'}
          />
        </div>

        {paidOrders.length + cancelledOrders.length > 0 && (
          <p className="text-[11px] text-primary-500/60">
            {paidOrders.length} pedido{paidOrders.length === 1 ? '' : 's'} pago
            {paidOrders.length === 1 ? '' : 's'}
            {cancelledOrders.length > 0 &&
              ` · ${cancelledOrders.length} cancelado${cancelledOrders.length === 1 ? '' : 's'}`}
            .
          </p>
        )}

        {/* Pendências bloqueando o encerramento */}
        {!canCloseCycle && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="mb-2 text-sm font-medium text-amber-900">
              ⚠️ Não dá pra encerrar o ciclo ainda. Pendências:
            </p>
            <ul className="ml-4 list-disc text-xs text-amber-900/85">
              {pending.length > 0 && (
                <li>
                  {pending.length}{' '}
                  {pending.length === 1 ? 'compra' : 'compras'} sem destino
                  decidido (acima).
                </li>
              )}
              {pendingPayments.length > 0 && (
                <li>
                  {pendingPayments.length}{' '}
                  {pendingPayments.length === 1 ? 'pedido' : 'pedidos'}{' '}
                  aguardando pagamento.
                </li>
              )}
            </ul>
          </div>
        )}

        <button
          type="button"
          disabled={!canCloseCycle}
          onClick={() => {
            if (!canCloseCycle) return;
            alert(
              `Ciclo de ${dateLabel} encerrado!\n\n` +
                `Receita: R$ ${financial.receita.toFixed(2)}\n` +
                `Custo de produção: R$ ${financial.custoProducao.toFixed(2)}\n` +
                `Prejuízo: R$ ${financial.prejuizo.toFixed(2)}\n` +
                `Despesas: R$ ${financial.despesasOp.toFixed(2)}\n` +
                `Lucro líquido: R$ ${financial.lucro.toFixed(2)}`,
            );
            done();
          }}
          className={
            canCloseCycle
              ? 'w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-600'
              : 'w-full cursor-not-allowed rounded-full bg-primary-200 px-5 py-3 text-sm text-primary-500/60'
          }
        >
          {canCloseCycle
            ? `✓ Confirmar encerramento do ciclo · Lucro R$ ${financial.lucro.toFixed(2)}`
            : `🔒 Resolva as pendências acima pra encerrar`}
        </button>
      </section>
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
  tone?: 'good' | 'warn' | 'bad';
}) {
  const cls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'bad'
          ? 'border-rose-200 bg-rose-50'
          : 'border-primary-100 bg-white';
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </p>
      <p
        className="mt-1 text-lg text-primary-500"
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
