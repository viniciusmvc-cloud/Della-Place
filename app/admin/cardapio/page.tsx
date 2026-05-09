'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenu,
  fetchProducts,
  fetchStock,
  updateMenuItem,
} from '@/lib/api';
import { CATEGORY_LABEL, type Product } from '@/lib/products';
import {
  calcMargin,
  calcRecipeCost,
  ingredientCost,
  newMenuId,
  type MenuItem,
  type RecipeIngredient,
} from '@/lib/menu';
import { type StockItem } from '@/lib/stock';
import { RECIPE_UNITS, isCompatible } from '@/lib/units';

export default function CardapioPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchMenu(),
      fetchStock(),
      fetchProducts().catch(() => [] as Product[]),
    ])
      .then(([m, s, p]) => {
        setMenu(m);
        setStock(s);
        setProducts(p.filter((x) => x.active));
      })
      .catch(() => {});
  }, []);

  function notify() {
    setSavedNotice('Cardápio atualizado.');
    setTimeout(() => setSavedNotice(null), 2000);
  }

  async function update(id: string, patch: Partial<MenuItem>) {
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    try {
      await updateMenuItem(id, patch);
      notify();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este sabor do cardápio?')) return;
    setMenu((prev) => prev.filter((m) => m.id !== id));
    await deleteMenuItem(id);
    notify();
  }

  async function add() {
    const novo: MenuItem = {
      id: newMenuId(),
      name: 'Novo sabor',
      description: '',
      price: 0,
      cost: 0,
      ingredients: [],
      active: true,
    };
    setMenu((prev) => [...prev, novo]);
    setExpanded(novo.id);
    await createMenuItem(novo);
    notify();
  }

  function addIngredient(itemId: string) {
    const it = menu.find((m) => m.id === itemId);
    if (!it) return;
    const firstStock = stock[0];
    if (!firstStock) return;
    const nextIngredient: RecipeIngredient = {
      stockItemId: firstStock.id,
      amount: 0,
      unit: firstStock.unit,
    };
    update(itemId, { ingredients: [...(it.ingredients ?? []), nextIngredient] });
  }

  function updateIngredient(
    itemId: string,
    idx: number,
    patch: Partial<RecipeIngredient>,
  ) {
    const it = menu.find((m) => m.id === itemId);
    if (!it) return;
    const nextIngs = (it.ingredients ?? []).map((ing, i) =>
      i === idx ? { ...ing, ...patch } : ing,
    );
    update(itemId, { ingredients: nextIngs });
  }

  function removeIngredient(itemId: string, idx: number) {
    const it = menu.find((m) => m.id === itemId);
    if (!it) return;
    update(itemId, {
      ingredients: (it.ingredients ?? []).filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Cardápio
          </h1>
          <p className="text-sm text-primary-500/60">
            Monte cada pizza com ingredientes do estoque. O custo real é
            calculado automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-full bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
        >
          + Adicionar sabor
        </button>
      </header>

      <HelpBanner
        id="cardapio"
        title="Cardápio"
        whenToFill="Sempre que quiser criar um sabor novo, alterar preço, descrição ou trocar a receita."
        steps={[
          'Clique "+ Adicionar sabor" pra criar um novo.',
          'Clique no nome do sabor pra abrir o editor (nome, descrição, preço).',
          'Adicione ingredientes da receita (vinculados ao Estoque) pra calcular o custo real automaticamente.',
          'Use o botão Excluir pra remover um sabor que não vai mais oferecer.',
          'Sabor inativo (toggle "ativo") fica salvo mas some do site público.',
        ]}
        doNot={[
          'Aqui é o catálogo de SABORES (Marguerita, Calabria…), NÃO de ingredientes. Ingredientes vão em Produtos.',
        ]}
        notes='Margem >=50% verde, >=30% amarelo, abaixo vermelho. Use isso pra ajustar o preço.'
      />

      {stock.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ Você ainda não tem produtos no estoque. Para montar receitas com
          custo real, primeiro cadastre os ingredientes em{' '}
          <Link
            href="/admin/estoque"
            className="font-medium underline hover:no-underline"
          >
            Estoque
          </Link>
          . Enquanto isso, o "custo manual" é usado como fallback.
        </div>
      )}

      {savedNotice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
          ✓ {savedNotice}
        </p>
      )}

      <div className="space-y-4">
        {menu.map((m) => {
          const recipeCost = calcRecipeCost(m, stock);
          const usingRecipe = (m.ingredients?.length ?? 0) > 0;
          const cost = usingRecipe ? recipeCost : m.cost;
          const margin = calcMargin({ price: m.price, cost });
          const isExpanded = expanded === m.id;

          return (
            <article
              key={m.id}
              className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-primary-100 p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : m.id)}
                  className="flex-1 text-left"
                >
                  <p
                    className="text-xl text-primary-500"
                    style={{
                      fontFamily: 'var(--font-cormorant), Georgia, serif',
                      fontWeight: 600,
                    }}
                  >
                    {m.name}
                  </p>
                  <p className="text-xs text-primary-500/60">
                    R$ {m.price} · custo R$ {cost.toFixed(2)} · margem{' '}
                    {margin.marginPct.toFixed(0)}%
                  </p>
                </button>
                <span
                  className={
                    margin.marginPct >= 50
                      ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800'
                      : margin.marginPct >= 30
                        ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800'
                        : 'rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800'
                  }
                >
                  {margin.marginPct.toFixed(0)}%
                </span>
                <label className="flex items-center gap-2 text-xs text-primary-500/70">
                  <input
                    type="checkbox"
                    checked={m.active}
                    onChange={(e) => update(m.id, { active: e.target.checked })}
                  />
                  ativo
                </label>
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : m.id)}
                  className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
                >
                  {isExpanded ? '▲ recolher' : '▼ editar'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:border-rose-500 hover:bg-rose-50"
                  title="Excluir este sabor do cardápio"
                >
                  🗑 Excluir
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-4 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="Nome"
                      value={m.name}
                      onChange={(v) => update(m.id, { name: v })}
                    />
                    <NumField
                      label="Preço de venda R$"
                      value={m.price}
                      onChange={(v) => update(m.id, { price: v })}
                    />
                    <div className="md:col-span-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                          Descrição
                        </span>
                        <textarea
                          rows={2}
                          value={m.description}
                          onChange={(e) =>
                            update(m.id, { description: e.target.value })
                          }
                          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-widest text-primary-500/60">
                        Ingredientes (custo real)
                      </p>
                      <button
                        type="button"
                        onClick={() => addIngredient(m.id)}
                        disabled={stock.length === 0}
                        className="rounded-full border border-primary-500 px-3 py-1 text-xs text-primary-500 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary-500 hover:text-white"
                      >
                        + Ingrediente
                      </button>
                    </div>

                    {(m.ingredients ?? []).length === 0 ? (
                      <p className="text-xs text-primary-500/60">
                        Nenhum ingrediente. {stock.length === 0
                          ? 'Cadastre produtos no Estoque primeiro.'
                          : 'Clique em "+ Ingrediente" para adicionar.'}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {(m.ingredients ?? []).map((ing, idx) => {
                          const stk = stock.find((s) => s.id === ing.stockItemId);
                          const cost = stk ? ingredientCost(ing, stk) : 0;
                          const incompat = stk && !isCompatible(ing.unit, stk.unit);
                          return (
                            <li
                              key={idx}
                              className="grid grid-cols-12 items-center gap-2 rounded-md border border-primary-100 bg-white p-2 text-sm"
                            >
                              <select
                                value={ing.stockItemId}
                                onChange={(e) => {
                                  const newStock = stock.find(
                                    (s) => s.id === e.target.value,
                                  );
                                  updateIngredient(m.id, idx, {
                                    stockItemId: e.target.value,
                                    unit: newStock?.unit ?? ing.unit,
                                  });
                                }}
                                className="col-span-5 rounded-md border border-primary-200 bg-white px-2 py-1.5 text-sm"
                              >
                                {stock.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                    {s.brand ? ` · ${s.brand}` : ''}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min={0}
                                step="0.5"
                                value={ing.amount || ''}
                                onChange={(e) =>
                                  updateIngredient(m.id, idx, {
                                    amount: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="col-span-2 rounded-md border border-primary-200 bg-white px-2 py-1.5 text-sm"
                                placeholder="0"
                              />
                              <select
                                value={ing.unit}
                                onChange={(e) =>
                                  updateIngredient(m.id, idx, {
                                    unit: e.target.value,
                                  })
                                }
                                className="col-span-2 rounded-md border border-primary-200 bg-white px-2 py-1.5 text-sm"
                              >
                                {RECIPE_UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                              <span
                                className={`col-span-2 text-right text-xs ${
                                  incompat ? 'text-rose-600' : 'text-primary-500/80'
                                }`}
                              >
                                {incompat
                                  ? '⚠ unidade'
                                  : `R$ ${cost.toFixed(2)}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeIngredient(m.id, idx)}
                                className="col-span-1 text-right text-xs text-rose-600 hover:underline"
                              >
                                ×
                              </button>
                              <div className="col-span-12 mt-1 flex items-center gap-2 border-t border-primary-100 pt-2">
                                <span className="text-[10px] uppercase tracking-widest text-primary-500/60">
                                  ↳ Liga ao produto:
                                </span>
                                <select
                                  value={ing.productId ?? ''}
                                  onChange={(e) =>
                                    updateIngredient(m.id, idx, {
                                      productId: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                  className="flex-1 rounded-md border border-primary-200 bg-white px-2 py-1 text-xs"
                                >
                                  <option value="">— sem ligação (estoque não decrementa) —</option>
                                  {(['massa', 'molho', 'cobertura', 'operacao'] as const).map(
                                    (cat) => {
                                      const items = products.filter(
                                        (p) =>
                                          p.category === cat ||
                                          p.categories?.includes(cat),
                                      );
                                      if (items.length === 0) return null;
                                      return (
                                        <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                                          {items.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.name}
                                              {p.brand ? ` · ${p.brand}` : ''}
                                            </option>
                                          ))}
                                        </optgroup>
                                      );
                                    },
                                  )}
                                </select>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {usingRecipe && (
                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-white p-3 text-center">
                        <Stat
                          label="Custo real"
                          value={`R$ ${recipeCost.toFixed(2)}`}
                        />
                        <Stat
                          label="Lucro/un"
                          value={`R$ ${(m.price - recipeCost).toFixed(2)}`}
                          tone={
                            m.price - recipeCost >= 0 ? 'good' : 'bad'
                          }
                        />
                        <Stat
                          label="Margem"
                          value={`${calcMargin({ price: m.price, cost: recipeCost }).marginPct.toFixed(0)}%`}
                          tone={
                            margin.marginPct >= 50
                              ? 'good'
                              : margin.marginPct >= 30
                                ? 'warn'
                                : 'bad'
                          }
                        />
                      </div>
                    )}
                  </div>

                  {!usingRecipe && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      Sem ingredientes cadastrados. Usando <strong>custo
                      manual de fallback</strong>:
                      <NumField
                        label="Custo manual R$"
                        value={m.cost}
                        onChange={(v) => update(m.id, { cost: v })}
                      />
                    </div>
                  )}

                  <div className="flex justify-between border-t border-primary-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(null)}
                      className="text-xs text-primary-500/60 hover:text-primary-500"
                    >
                      Recolher
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:border-rose-500 hover:bg-rose-50"
                    >
                      🗑 Excluir sabor permanentemente
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {menu.length === 0 && (
        <p className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
          Nenhum sabor cadastrado. Clique em "+ Adicionar sabor".
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="0.5"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}

function Stat({
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
      ? 'text-emerald-700'
      : tone === 'warn'
        ? 'text-amber-700'
        : tone === 'bad'
          ? 'text-rose-700'
          : 'text-primary-500';
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-primary-500/50">
        {label}
      </p>
      <p
        className={`text-sm font-medium ${cls}`}
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        {value}
      </p>
    </div>
  );
}
