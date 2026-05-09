'use client';

import { useEffect, useMemo, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '@/lib/api';
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  COMMON_UNITS,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
} from '@/lib/products';

const CATEGORY_BG: Record<ProductCategory, string> = {
  massa: 'bg-amber-100 border-amber-300 text-amber-900',
  molho: 'bg-rose-100 border-rose-300 text-rose-900',
  cobertura: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  operacao: 'bg-blue-100 border-blue-300 text-blue-900',
};

const CATEGORY_ACTIVE: Record<ProductCategory, string> = {
  massa: 'bg-amber-500 border-amber-600 text-white',
  molho: 'bg-rose-500 border-rose-600 text-white',
  cobertura: 'bg-emerald-500 border-emerald-600 text-white',
  operacao: 'bg-blue-500 border-blue-600 text-white',
};

const CATEGORY_DOT: Record<ProductCategory, string> = {
  massa: 'bg-amber-400',
  molho: 'bg-rose-400',
  cobertura: 'bg-emerald-400',
  operacao: 'bg-blue-400',
};

type Draft = {
  name: string;
  category: ProductCategory;
  categories: ProductCategory[];
  defaultUnit: string;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  category: 'cobertura',
  categories: ['cobertura'],
  defaultUnit: 'kg',
  notes: '',
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [activeCat, setActiveCat] = useState<ProductCategory>('massa');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function notify(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  }

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchProducts();
      setProducts(list);
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

  const counts = useMemo(() => {
    const map: Record<ProductCategory, number> = {
      massa: 0,
      molho: 0,
      cobertura: 0,
      operacao: 0,
    };
    products
      .filter((p) => showInactive || p.active)
      .forEach((p) => {
        const cats = p.categories?.length ? p.categories : [p.category];
        cats.forEach((c) => {
          map[c] += 1;
        });
      });
    return map;
  }, [products, showInactive]);

  const visibleList = useMemo(() => {
    return products
      .filter((p) => showInactive || p.active)
      .filter((p) => {
        const cats = p.categories?.length ? p.categories : [p.category];
        return cats.includes(activeCat);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [products, activeCat, showInactive]);

  function toggleDraftCategory(cat: ProductCategory) {
    const has = draft.categories.includes(cat);
    if (has) {
      if (draft.categories.length <= 1) return;
      const next = draft.categories.filter((c) => c !== cat);
      setDraft({
        ...draft,
        categories: next,
        category:
          draft.category === cat ? next[0] : draft.category,
      });
    } else {
      setDraft({ ...draft, categories: [...draft.categories, cat] });
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || draft.categories.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await createProduct({
        name: draft.name.trim(),
        category: draft.category,
        categories: draft.categories,
        defaultUnit: draft.defaultUnit,
        notes: draft.notes.trim() || undefined,
      });
      setDraft({ ...EMPTY_DRAFT, category: activeCat, categories: [activeCat] });
      await reload();
      notify('Produto adicionado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePatch(p: Product, patch: Partial<Product>) {
    setError(null);
    try {
      await updateProduct(p.id, {
        name: patch.name,
        category: patch.category,
        categories: patch.categories,
        defaultUnit: patch.defaultUnit,
        notes: patch.notes,
        active: patch.active,
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Apagar "${p.name}"?`)) return;
    setError(null);
    try {
      const result = await deleteProduct(p.id);
      await reload();
      if (result.softDeleted) {
        notify(result.message || 'Produto desativado (tem compras vinculadas).');
      } else {
        notify('Produto apagado.');
      }
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
            Produtos
          </h1>
          <p className="text-sm text-primary-500/60">
            Catálogo de ingredientes. Clique em uma categoria pra ver e
            editar a lista. Um produto pode estar em mais de uma categoria.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-primary-500/70">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inativos
        </label>
      </header>

      <HelpBanner
        id="produtos"
        title="Produtos"
        whenToFill="Sempre que comprar um ingrediente NOVO. Os 16 itens iniciais já vêm cadastrados."
        steps={[
          'Clique numa das 4 abas coloridas pra abrir a categoria.',
          'Use "Adicionar produto" pra cadastrar (ex: Burrata, Rúcula).',
          'Marque uma OU MAIS categorias se o produto for usado em vários blocos (ex: tomate em molho + cobertura).',
          'Pra editar, clique em "Editar" no item. Pra apagar, ⊘ desativa, 🗑 apaga (vira inativo se tiver compras vinculadas).',
        ]}
        doNot={[
          'Aqui é o CATÁLOGO de tipos. Não é onde você lança o que comprou (isso vai em Compras).',
        ]}
        notes='Operação é pra itens transversais: sal, azeite, embalagens.'
      />

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

      {/* TABS lado a lado */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PRODUCT_CATEGORIES.map((cat) => {
          const isActive = activeCat === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCat(cat);
                setDraft({ ...EMPTY_DRAFT, category: cat, categories: [cat] });
              }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                isActive ? CATEGORY_ACTIVE[cat] : CATEGORY_BG[cat]
              } ${isActive ? 'shadow-md' : 'hover:shadow-sm'}`}
            >
              <p
                className="text-lg font-semibold"
                style={{
                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                }}
              >
                {CATEGORY_LABEL[cat]}
              </p>
              <p className="text-[11px] opacity-80">
                {counts[cat]} {counts[cat] === 1 ? 'item' : 'itens'}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] italic text-primary-500/60">
        {CATEGORY_DESCRIPTION[activeCat]}
      </p>

      {/* Form de adicionar */}
      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Adicionar produto em {CATEGORY_LABEL[activeCat]}
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_2fr]">
            <input
              type="text"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nome (ex: Burrata)"
              className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
            <select
              value={draft.defaultUnit}
              onChange={(e) =>
                setDraft({ ...draft, defaultUnit: e.target.value })
              }
              className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Observação (opcional)"
              className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-primary-500/60">
              Categorias:
            </span>
            {PRODUCT_CATEGORIES.map((cat) => {
              const checked = draft.categories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] ${
                    checked ? CATEGORY_ACTIVE[cat] : CATEGORY_BG[cat]
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={checked}
                    onChange={() => toggleDraftCategory(cat)}
                  />
                  {CATEGORY_LABEL[cat]}
                </label>
              );
            })}
            <span className="ml-2 text-[10px] text-primary-500/50">
              (marque mais de uma se necessário)
            </span>
          </div>
          <button
            type="submit"
            disabled={busy || !draft.name.trim() || draft.categories.length === 0}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? 'Adicionando…' : `+ Adicionar em ${CATEGORY_LABEL[activeCat]}`}
          </button>
        </form>
      </section>

      {/* Lista da categoria selecionada */}
      <section
        className={`rounded-xl border-2 p-5 ${CATEGORY_BG[activeCat]} bg-opacity-30`}
      >
        <header className="mb-3 flex items-baseline justify-between">
          <h3 className="flex items-center gap-2 text-base font-medium text-primary-500">
            <span
              className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[activeCat]}`}
            />
            {CATEGORY_LABEL[activeCat]}
            <span className="text-[11px] font-normal text-primary-500/60">
              ({visibleList.length})
            </span>
          </h3>
        </header>
        {loading ? (
          <p className="text-sm text-primary-500/60">Carregando…</p>
        ) : visibleList.length === 0 ? (
          <p className="text-sm text-primary-500/60">
            Nada nesta categoria ainda. Use o formulário acima.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {visibleList.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onPatch={(patch) => handlePatch(p, patch)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProductRow({
  product,
  onPatch,
  onDelete,
}: {
  product: Product;
  onPatch: (patch: Partial<Product>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [unit, setUnit] = useState(product.defaultUnit);
  const [notes, setNotes] = useState(product.notes);
  const [categories, setCategories] = useState<ProductCategory[]>(
    product.categories?.length ? product.categories : [product.category],
  );

  function toggleCat(cat: ProductCategory) {
    if (categories.includes(cat)) {
      if (categories.length <= 1) return;
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  }

  function save() {
    onPatch({
      name,
      defaultUnit: unit,
      notes,
      category: categories[0],
      categories,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-primary-200 bg-white p-3">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
          >
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observação"
          className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
        />
        <div className="flex flex-wrap gap-1">
          {PRODUCT_CATEGORIES.map((cat) => {
            const checked = categories.includes(cat);
            return (
              <label
                key={cat}
                className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10px] ${
                  checked ? CATEGORY_ACTIVE[cat] : CATEGORY_BG[cat]
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={checked}
                  onChange={() => toggleCat(cat)}
                />
                {CATEGORY_LABEL[cat]}
              </label>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-primary-500 px-3 py-1 text-xs text-white"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setName(product.name);
              setUnit(product.defaultUnit);
              setNotes(product.notes);
              setCategories(
                product.categories?.length
                  ? product.categories
                  : [product.category],
              );
              setEditing(false);
            }}
            className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  const otherCats = (
    product.categories?.length ? product.categories : [product.category]
  ).filter((c) => c !== product.category);

  return (
    <li
      className={
        product.active
          ? 'flex items-center justify-between gap-2 rounded-lg border border-primary-100 bg-white p-3'
          : 'flex items-center justify-between gap-2 rounded-lg border border-primary-100 bg-primary-50/30 p-3 opacity-60'
      }
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary-500">
          {product.name}{' '}
          <span className="text-[11px] font-normal text-primary-500/60">
            · {product.defaultUnit}
          </span>
          {!product.active && (
            <span className="ml-2 rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-700">
              inativo
            </span>
          )}
        </p>
        {otherCats.length > 0 && (
          <p className="text-[10px] text-primary-500/60">
            também em:{' '}
            {otherCats.map((c) => CATEGORY_LABEL[c]).join(', ')}
          </p>
        )}
        {product.notes && (
          <p className="truncate text-[11px] text-primary-500/60">
            {product.notes}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onPatch({ active: !product.active })}
          className="rounded-full border border-primary-200 px-2 py-1 text-[10px] text-primary-500/70 hover:border-primary-500"
          title={product.active ? 'Desativar' : 'Reativar'}
        >
          {product.active ? '⊘' : '✓'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-primary-200 px-2 py-1 text-[10px] text-primary-500/70 hover:border-primary-500"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-rose-200 px-2 py-1 text-[10px] text-rose-600 hover:border-rose-500"
        >
          🗑
        </button>
      </div>
    </li>
  );
}
