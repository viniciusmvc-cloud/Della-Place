'use client';

import { useEffect, useMemo, useState } from 'react';
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

const CATEGORY_TONE: Record<ProductCategory, string> = {
  massa: 'border-amber-200 bg-amber-50/40',
  molho: 'border-rose-200 bg-rose-50/40',
  cobertura: 'border-emerald-200 bg-emerald-50/40',
  operacao: 'border-blue-200 bg-blue-50/40',
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
  defaultUnit: string;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  category: 'cobertura',
  defaultUnit: 'kg',
  notes: '',
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
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

  const grouped = useMemo(() => {
    const map: Record<ProductCategory, Product[]> = {
      massa: [],
      molho: [],
      cobertura: [],
      operacao: [],
    };
    products
      .filter((p) => showInactive || p.active)
      .forEach((p) => map[p.category].push(p));
    return map;
  }, [products, showInactive]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createProduct({
        name: draft.name.trim(),
        category: draft.category,
        defaultUnit: draft.defaultUnit,
        notes: draft.notes.trim() || undefined,
      });
      setDraft(EMPTY_DRAFT);
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
        defaultUnit: patch.defaultUnit,
        notes: patch.notes,
        active: patch.active,
      });
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, ...patch } : x)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      reload();
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Apagar "${p.name}"?`)) return;
    setError(null);
    try {
      const result = await deleteProduct(p.id);
      await reload();
      if (result.softDeleted) {
        notify(result.message || 'Produto desativado (tinha compras vinculadas).');
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
            Catálogo de ingredientes. Aqui você só registra o que existe.
            Compra e estoque são separados, em "Compras".
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

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Adicionar produto
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_2fr_auto]"
        >
          <input
            type="text"
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nome (ex: Burrata)"
            className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as ProductCategory })
            }
            className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
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
          <button
            type="submit"
            disabled={busy || !draft.name.trim()}
            className="rounded-full bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? 'Adicionando…' : 'Adicionar'}
          </button>
        </form>
      </section>

      {loading ? (
        <p className="text-sm text-primary-500/60">Carregando catálogo…</p>
      ) : (
        <div className="space-y-5">
          {PRODUCT_CATEGORIES.map((cat) => {
            const list = grouped[cat];
            return (
              <section
                key={cat}
                className={`rounded-xl border p-5 ${CATEGORY_TONE[cat]}`}
              >
                <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-medium text-primary-500">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT[cat]}`}
                      />
                      {CATEGORY_LABEL[cat]}
                      <span className="text-[11px] font-normal text-primary-500/60">
                        ({list.length})
                      </span>
                    </h3>
                    <p className="text-[11px] text-primary-500/60">
                      {CATEGORY_DESCRIPTION[cat]}
                    </p>
                  </div>
                </header>

                {list.length === 0 ? (
                  <p className="text-xs text-primary-500/50">
                    Nada nesta categoria ainda.
                  </p>
                ) : (
                  <ul className="grid gap-2 md:grid-cols-2">
                    {list.map((p) => (
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
            );
          })}
        </div>
      )}
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
  const [draft, setDraft] = useState<Product>(product);

  function save() {
    onPatch({
      name: draft.name,
      category: draft.category,
      defaultUnit: draft.defaultUnit,
      notes: draft.notes,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-primary-200 bg-white p-3">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr]">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
          />
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                category: e.target.value as ProductCategory,
              })
            }
            className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            value={draft.defaultUnit}
            onChange={(e) =>
              setDraft({ ...draft, defaultUnit: e.target.value })
            }
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
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Observação"
          className="rounded-md border border-primary-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500"
        />
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
              setDraft(product);
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
