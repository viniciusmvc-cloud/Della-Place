'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  createPurchase,
  deletePurchase,
  fetchProducts,
  fetchPurchases,
  updatePurchase,
} from '@/lib/api';
import {
  CATEGORY_LABEL,
  type Product,
  type ProductCategory,
} from '@/lib/products';
import {
  STATUS_LABEL,
  STATUS_TONE,
  nextSundayISO,
  todayISO,
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

type Draft = {
  productId: number | '';
  quantity: string;
  unit: string;
  brand: string;
  totalCost: string;
  purchaseDate: string;
  productionDate: string;
  notes: string;
};

function emptyDraft(productionDate: string): Draft {
  return {
    productId: '',
    quantity: '',
    unit: 'kg',
    brand: '',
    totalCost: '',
    purchaseDate: todayISO(),
    productionDate,
    notes: '',
  };
}

export default function ComprasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [carryover, setCarryover] = useState<Purchase[]>([]);
  const [pendingClose, setPendingClose] = useState<Purchase[]>([]);
  const [productionDate, setProductionDate] = useState<string>(() =>
    nextSundayISO(),
  );
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(nextSundayISO()));
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function notify(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  }

  async function reload() {
    setLoading(true);
    try {
      const [prods, all, carry, pending] = await Promise.all([
        fetchProducts().catch(() => []),
        fetchPurchases().catch(() => []),
        fetchPurchases({ carryover: true }).catch(() => []),
        fetchPurchases({ pendingClose: true }).catch(() => []),
      ]);
      setProducts(prods.filter((p) => p.active));
      setAllPurchases(all);
      setCarryover(carry);
      setPendingClose(pending);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const cycleList = useMemo(() => {
    return allPurchases
      .filter(
        (p) =>
          p.status === 'pending' && p.productionDate === productionDate,
      )
      .sort((a, b) => a.productCategory.localeCompare(b.productCategory));
  }, [allPurchases, productionDate]);

  const cycleTotal = useMemo(
    () => cycleList.reduce((s, p) => s + p.totalCost, 0),
    [cycleList],
  );

  const productionDates = useMemo(() => {
    const set = new Set<string>();
    set.add(productionDate);
    allPurchases.forEach((p) => {
      if (p.status === 'pending') set.add(p.productionDate);
    });
    return Array.from(set).sort();
  }, [allPurchases, productionDate]);

  const closedHistory = useMemo(
    () =>
      allPurchases
        .filter((p) => p.status !== 'pending')
        .sort((a, b) =>
          (b.closedAt ?? b.createdAt).localeCompare(
            a.closedAt ?? a.createdAt,
          ),
        )
        .slice(0, 50),
    [allPurchases],
  );

  function selectProduct(id: number) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setDraft((d) => ({ ...d, productId: id, unit: p.defaultUnit }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.productId) {
      setError('Escolha o produto.');
      return;
    }
    const qty = parseFloat(draft.quantity.replace(',', '.'));
    const cost = parseFloat(draft.totalCost.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantidade inválida.');
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError('Valor inválido.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createPurchase({
        productId: Number(draft.productId),
        quantity: qty,
        unit: draft.unit,
        brand: draft.brand.trim() || null,
        totalCost: cost,
        purchaseDate: draft.purchaseDate,
        productionDate: draft.productionDate,
        notes: draft.notes.trim() || null,
      });
      setDraft(emptyDraft(draft.productionDate));
      await reload();
      notify('Compra registrada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: Purchase) {
    if (!confirm(`Apagar a compra de "${p.productName}"?`)) return;
    try {
      await deletePurchase(p.id);
      await reload();
      notify('Compra apagada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleQuickClose(p: Purchase, status: PurchaseStatus) {
    try {
      await updatePurchase(p.id, { status });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Compras
          </h1>
          <p className="text-sm text-primary-500/60">
            Lance aqui as compras dessa semana, amarradas a um domingo de
            produção. Domingo à noite, encerre o ciclo dizendo o destino de
            cada compra.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest text-primary-500/60">
            Domingo alvo
          </label>
          <select
            value={productionDate}
            onChange={(e) => {
              setProductionDate(e.target.value);
              setDraft((d) => ({ ...d, productionDate: e.target.value }));
            }}
            className="rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
          >
            {productionDates.map((d) => (
              <option key={d} value={d}>
                {formatDateBR(new Date(`${d}T12:00:00`))}
              </option>
            ))}
          </select>
        </div>
      </header>

      <HelpBanner
        id="compras"
        title="Compras"
        whenToFill="Sexta e sábado, conforme você for fazendo o mercado. Cada item comprado vira uma linha aqui."
        steps={[
          '1) Escolha o produto (vem da aba Produtos, agrupado por categoria).',
          '2) Informe quantidade, valor pago e data da compra.',
          '3) Confirme o "domingo de produção" (default = próximo domingo).',
          '4) Clique "Adicionar compra".',
          'Domingo à noite ou segunda: clique em "Encerrar ciclo" e diga o destino de cada compra (Acabou / Guardar / Pessoal / Descarte).',
        ]}
        doNot={[
          'Não lance gás, luz, água, limpeza aqui. Esses vão em Financeiro como Despesas Operacionais.',
          'Não esqueça de encerrar o ciclo. Sem isso, fica acumulando "Pendente" e atrapalha as métricas.',
        ]}
        notes='Itens marcados "Guardar" no encerramento aparecem na próxima semana como "Estoque carregado" no topo desta tela.'
      />

      {pendingClose.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            ⏰ Você tem compras de domingos passados que ainda não foram
            encerradas.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900/80">
            {Array.from(new Set(pendingClose.map((p) => p.productionDate)))
              .sort()
              .map((d) => {
                const count = pendingClose.filter(
                  (p) => p.productionDate === d,
                ).length;
                return (
                  <li key={d}>
                    <Link
                      href={`/admin/compras/encerrar/${d}`}
                      className="inline-flex items-center gap-1 underline hover:text-amber-700"
                    >
                      {formatDateBR(new Date(`${d}T12:00:00`))} · {count}{' '}
                      compras pra encerrar →
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {notice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
          ✓ {notice}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {carryover.length > 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-900/70">
            📦 Estoque carregado de ciclos anteriores
          </h2>
          <p className="mb-3 text-[11px] text-blue-900/60">
            Itens guardados no encerramento de ciclos passados. Eles
            descontam do que você precisa comprar nessa semana.
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {carryover.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-primary-500">
                    {p.productName}{' '}
                    <span className="text-[11px] text-primary-500/60">
                      · {p.quantity} {p.unit}
                    </span>
                  </p>
                  <p className="text-[11px] text-primary-500/60">
                    Guardado em{' '}
                    {p.closedAt
                      ? new Date(p.closedAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickClose(
                      p,
                      'used',
                    )
                  }
                  className="rounded-full border border-blue-300 px-3 py-1 text-[11px] text-blue-700 hover:bg-blue-50"
                  title="Marcar como consumido (sai do estoque)"
                >
                  Consumir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Registrar compra
        </h2>
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-3">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Produto
            </span>
            <select
              required
              value={draft.productId}
              onChange={(e) => selectProduct(Number(e.target.value))}
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">— escolha —</option>
              {(['massa', 'molho', 'cobertura', 'operacao'] as ProductCategory[]).map(
                (cat) => {
                  const items = products.filter((p) => p.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                      {items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.defaultUnit})
                        </option>
                      ))}
                    </optgroup>
                  );
                },
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Quantidade
            </span>
            <div className="flex">
              <input
                type="text"
                inputMode="decimal"
                required
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                placeholder="ex: 1.2"
                className="flex-1 rounded-l-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
              <input
                type="text"
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                className="w-16 rounded-r-md border border-l-0 border-primary-200 bg-primary-50 px-2 py-2 text-center text-sm"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Marca (opcional)
            </span>
            <input
              type="text"
              value={draft.brand}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="ex: Tirolez"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Valor total R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={draft.totalCost}
              onChange={(e) => setDraft({ ...draft, totalCost: e.target.value })}
              placeholder="ex: 38.50"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Data da compra
            </span>
            <input
              type="date"
              required
              value={draft.purchaseDate}
              onChange={(e) =>
                setDraft({ ...draft, purchaseDate: e.target.value })
              }
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Domingo de produção
            </span>
            <input
              type="date"
              required
              value={draft.productionDate}
              onChange={(e) =>
                setDraft({ ...draft, productionDate: e.target.value })
              }
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block md:col-span-3">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Observação (opcional)
            </span>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="ex: comprado no Hortifruti, validade 12/05"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary-500 px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? 'Salvando…' : 'Adicionar compra'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <header className="mb-3 flex items-end justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-primary-500/60">
            Ciclo atual ·{' '}
            {formatDateBR(new Date(`${productionDate}T12:00:00`))}
          </h2>
          <p className="text-xs text-primary-500/70">
            {cycleList.length} compras · total R$ {cycleTotal.toFixed(2)}
          </p>
        </header>
        {loading ? (
          <p className="text-sm text-primary-500/60">Carregando compras…</p>
        ) : cycleList.length === 0 ? (
          <p className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-primary-500/60">
            Nenhuma compra registrada para este domingo ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
                <tr>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Comprado</th>
                  <th className="px-3 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cycleList.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-primary-100 align-top"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[11px] text-primary-500/70">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[p.productCategory]}`}
                        />
                        {CATEGORY_LABEL[p.productCategory]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-primary-500">
                      {p.productName}
                      {p.notes && (
                        <p className="text-[11px] text-primary-500/60">
                          {p.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-primary-500/80">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-3 py-2 text-xs text-primary-500/70">
                      {p.brand ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-primary-500">
                      R$ {p.totalCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-primary-500/70">
                      {formatDateBR(new Date(`${p.purchaseDate}T12:00:00`))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded-full border border-rose-200 px-2 py-1 text-[11px] text-rose-600 hover:border-rose-500"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {cycleList.length > 0 && (
          <div className="mt-3 flex justify-end">
            <Link
              href={`/admin/compras/encerrar/${productionDate}`}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              ✓ Encerrar ciclo de{' '}
              {formatDateBR(new Date(`${productionDate}T12:00:00`))}
            </Link>
          </div>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs text-primary-500/60 hover:text-primary-500"
        >
          {showHistory ? '▲ Esconder' : '▼ Mostrar'} histórico de compras
          encerradas ({closedHistory.length})
        </button>
        {showHistory && closedHistory.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {closedHistory.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-md border border-primary-100 bg-white px-3 py-2 text-xs"
              >
                <span className="flex-1 text-primary-500/80">
                  <span
                    className={`mr-1 rounded-full border px-2 py-0.5 ${STATUS_TONE[p.status]}`}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                  {p.productName} · {p.quantity} {p.unit} · R${' '}
                  {p.totalCost.toFixed(2)}
                </span>
                <span className="text-[11px] text-primary-500/60">
                  produção{' '}
                  {formatDateBR(new Date(`${p.productionDate}T12:00:00`))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
