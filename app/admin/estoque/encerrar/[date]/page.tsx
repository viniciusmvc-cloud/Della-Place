'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { fetchPurchases, updatePurchase } from '@/lib/api';
import { CATEGORY_LABEL, type ProductCategory } from '@/lib/products';
import { type Purchase, type PurchaseStatus } from '@/lib/purchases';
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

export default function EncerrarEstoquePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchPurchases({ productionDate: date });
      setPurchases(list);
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

  function backToDashboard() {
    router.push('/admin');
  }

  const dateLabel = formatDateBR(new Date(`${date}T12:00:00`));
  const allDone = pending.length === 0;

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
          Tarefa 1 de 2 · Encerramento do ciclo
        </p>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          📦 Encerrar estoque · {dateLabel}
        </h1>
        <p className="text-sm text-primary-500/60">
          Pra cada compra desse domingo, escolha o destino. Quando terminar,
          clique em "Salvar e voltar pro Dashboard".
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-3xl text-emerald-600">✓</p>
          <p className="mt-2 font-medium text-primary-500">
            Todas as compras já têm destino.
          </p>
          <p className="mt-1 text-sm text-primary-500/70">
            Pode voltar pro Dashboard pra encerrar a tarefa 2 (pagamentos).
          </p>
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
              </li>
            ))}
          </ul>
        </>
      )}

      {closed.length > 0 && (
        <details className="rounded-xl border border-primary-100 bg-white p-3 text-xs">
          <summary className="cursor-pointer font-medium text-primary-500/70">
            Já decidido neste ciclo ({closed.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {closed.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-primary-100 px-3 py-1.5"
              >
                <span className="flex-1 text-primary-500/80">
                  <strong className="text-primary-500">{p.productName}</strong>{' '}
                  · {p.quantity} {p.unit} · R$ {p.totalCost.toFixed(2)}
                </span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] text-primary-700">
                  {p.status}
                </span>
                <button
                  type="button"
                  onClick={() => decide(p, 'pending')}
                  className="text-[10px] text-primary-500/60 hover:text-primary-500"
                >
                  desfazer
                </button>
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
            ? `✓ Tarefa 1 concluída · Voltar pro Dashboard`
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
