'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import { fetchMenu, fetchOrders, fetchPurchases } from '@/lib/api';
import { type MenuItem } from '@/lib/menu';
import { type Order } from '@/lib/orders';
import { CATEGORY_LABEL, type ProductCategory } from '@/lib/products';
import { nextSundayISO, type Purchase } from '@/lib/purchases';
import { convertAmount, isCompatible } from '@/lib/units';
import { formatDateBR } from '@/lib/utils';

const CATEGORY_DOT: Record<ProductCategory, string> = {
  massa: 'bg-amber-400',
  molho: 'bg-rose-400',
  cobertura: 'bg-emerald-400',
  operacao: 'bg-blue-400',
};

type Aggregate = {
  productId: number;
  productName: string;
  productCategory: ProductCategory;
  unit: string;
  quantity: number;
  totalCost: number;
  origins: { date: string; qty: number; status: 'pending' | 'kept' }[];
};

export default function EstoquePage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cycleDate = useMemo(() => nextSundayISO(), []);

  async function reload() {
    setLoading(true);
    try {
      const [purchaseList, orderList, menuList] = await Promise.all([
        fetchPurchases(),
        fetchOrders().catch(() => []),
        fetchMenu().catch(() => []),
      ]);
      setPurchases(purchaseList);
      setOrders(orderList);
      setMenu(menuList);
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

  const inStock = useMemo(
    () =>
      purchases.filter((p) => p.status === 'pending' || p.status === 'kept'),
    [purchases],
  );

  const cycleList = useMemo(
    () => inStock.filter((p) => p.productionDate === cycleDate),
    [inStock, cycleDate],
  );

  // Consumo por produto = pedidos pagos × ingredientes da receita
  const consumptionByProduct = useMemo(() => {
    const map = new Map<number, number>();
    orders
      .filter((o) => o.status === 'pago')
      .forEach((o) => {
        o.items.forEach((it) => {
          const m = menu.find(
            (mi) => mi.name.toLowerCase() === it.flavor.toLowerCase(),
          );
          if (!m?.ingredients) return;
          m.ingredients.forEach((ing) => {
            if (!ing.productId) return;
            map.set(
              ing.productId,
              (map.get(ing.productId) ?? 0) + ing.amount,
            );
          });
        });
      });
    return map;
  }, [orders, menu]);

  const consumptionUnitByProduct = useMemo(() => {
    const map = new Map<number, string>();
    menu.forEach((m) => {
      m.ingredients?.forEach((ing) => {
        if (ing.productId && !map.has(ing.productId)) {
          map.set(ing.productId, ing.unit);
        }
      });
    });
    return map;
  }, [menu]);

  const aggregates = useMemo(() => {
    const map = new Map<number, Aggregate>();
    inStock.forEach((p) => {
      let agg = map.get(p.productId);
      if (!agg) {
        agg = {
          productId: p.productId,
          productName: p.productName,
          productCategory: p.productCategory,
          unit: p.unit,
          quantity: 0,
          totalCost: 0,
          origins: [],
        };
        map.set(p.productId, agg);
      }
      agg.quantity += p.quantity;
      agg.totalCost += p.totalCost;
      agg.origins.push({
        date: p.productionDate,
        qty: p.quantity,
        status: p.status as 'pending' | 'kept',
      });
    });

    // Subtrai consumo dos pedidos pagos
    map.forEach((agg) => {
      const consumedRaw = consumptionByProduct.get(agg.productId) ?? 0;
      const consumedUnit = consumptionUnitByProduct.get(agg.productId);
      if (consumedRaw > 0 && consumedUnit) {
        const converted = isCompatible(consumedUnit, agg.unit)
          ? convertAmount(consumedRaw, consumedUnit, agg.unit)
          : consumedRaw;
        agg.quantity = Math.max(0, agg.quantity - converted);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.productCategory !== b.productCategory) {
        return a.productCategory.localeCompare(b.productCategory);
      }
      return a.productName.localeCompare(b.productName, 'pt-BR');
    });
  }, [inStock, consumptionByProduct, consumptionUnitByProduct]);

  const carryoverCount = useMemo(
    () => inStock.filter((p) => p.status === 'kept').length,
    [inStock],
  );

  const totals = useMemo(() => {
    return inStock.reduce(
      (acc, p) => ({
        items: acc.items + 1,
        cost: acc.cost + p.totalCost,
      }),
      { items: 0, cost: 0 },
    );
  }, [inStock]);

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Estoque
        </h1>
        <p className="text-sm text-primary-500/60">
          O que existe agora pra produzir. É a soma das compras que ainda
          não foram consumidas mais o que sobrou de ciclos passados marcado
          como "Guardar".
        </p>
      </header>

      <HelpBanner
        id="estoque"
        title="Estoque"
        whenToFill="Você não preenche aqui. É calculado automaticamente das compras."
        steps={[
          'Olhe quanto tem de cada ingrediente antes de produzir.',
          'Confronte com Mise en place pra decidir o que ainda falta comprar.',
          'Domingo à noite, "Encerrar ciclo" pra dar destino aos itens que sobraram.',
        ]}
        doNot={[
          'Não confunda com Compras (lançamento manual).',
          'Não confunda com Produtos (catálogo de tipos).',
        ]}
        notes='Cada item aqui veio de uma compra. "📦 carregado" = guardado em ciclo passado. "🛒 ciclo" = comprado para um domingo específico.'
      />

      {/* Ciclo atual em destaque */}
      <section className="rounded-2xl border-2 border-primary-300 bg-primary-50/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
              Ciclo atual · próximo domingo
            </p>
            <h2
              className="text-2xl italic text-primary-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              {formatDateBR(new Date(`${cycleDate}T12:00:00`))}
            </h2>
          </div>
          <div className="text-right text-xs text-primary-500/70">
            <p>{cycleList.length} compras pra essa data</p>
            <p>
              R${' '}
              {cycleList.reduce((s, p) => s + p.totalCost, 0).toFixed(2)}{' '}
              investido
            </p>
          </div>
        </div>
        {cycleList.length === 0 ? (
          <p className="mt-3 text-xs text-primary-500/60">
            Nenhuma compra registrada pra esse domingo ainda.{' '}
            <Link
              href="/admin/compras"
              className="underline hover:text-primary-500"
            >
              Lançar compras →
            </Link>
          </p>
        ) : (
          <ul className="mt-3 grid gap-1 md:grid-cols-2">
            {cycleList.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border border-primary-100 bg-white px-3 py-1.5 text-xs"
              >
                <span className="flex items-center gap-2 text-primary-500/85">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[p.productCategory]}`}
                  />
                  {p.productName}
                </span>
                <span className="text-primary-500/60">
                  {p.quantity} {p.unit} · R$ {p.totalCost.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <KPI label="Itens em estoque" value={String(totals.items)} />
        <KPI
          label="Valor investido"
          value={`R$ ${totals.cost.toFixed(2)}`}
          tone="good"
        />
        <KPI
          label="Carregado (kept)"
          value={String(carryoverCount)}
          tone={carryoverCount > 0 ? 'good' : undefined}
          hint="sobras de ciclos passados"
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Estoque por tipo de produto ({aggregates.length})
        </h2>
        {loading ? (
          <p className="text-sm text-primary-500/60">Carregando…</p>
        ) : aggregates.length === 0 ? (
          <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
            Estoque vazio. Comece registrando suas compras em{' '}
            <Link
              href="/admin/compras"
              className="font-medium text-primary-500 underline"
            >
              Compras
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
                <tr>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2 text-right">Quantidade</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Origem</th>
                </tr>
              </thead>
              <tbody>
                {aggregates.map((a) => (
                  <tr
                    key={a.productId}
                    className="border-t border-primary-100 align-top"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[11px] text-primary-500/70">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[a.productCategory]}`}
                        />
                        {CATEGORY_LABEL[a.productCategory]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-primary-500">
                      {a.productName}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-primary-500/85">
                      {a.quantity} {a.unit}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-primary-500/85">
                      R$ {a.totalCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-primary-500/60">
                      {a.origins.map((o, i) => (
                        <span key={i}>
                          {o.status === 'kept' ? '📦 carregado' : '🛒 ciclo'}{' '}
                          {formatDateBR(new Date(`${o.date}T12:00:00`))} ·{' '}
                          {o.qty} {a.unit}
                          {i < a.origins.length - 1 && <br />}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary-100 bg-white p-4">
        <p className="flex-1 text-sm text-primary-500/80">
          Domingo à noite, encerre o ciclo decidindo o destino de cada item:
          consumido, guardado, uso pessoal ou descarte.
        </p>
        <Link
          href={`/admin/compras/encerrar/${cycleDate}`}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          ✓ Encerrar ciclo de{' '}
          {formatDateBR(new Date(`${cycleDate}T12:00:00`))}
        </Link>
      </div>
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
      {hint && <p className="mt-1 text-[10px] text-primary-500/50">{hint}</p>}
    </div>
  );
}
