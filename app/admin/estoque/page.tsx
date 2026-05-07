'use client';

import { useEffect, useState } from 'react';
import {
  createStockItem,
  deleteStockItem,
  fetchStock,
  updateStockItem,
} from '@/lib/api';
import { isLowStock, newStockId, type StockItem } from '@/lib/stock';

const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct'];

export default function EstoquePage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Partial<StockItem>>({
    name: '',
    brand: '',
    supplier: '',
    unitPrice: 0,
    quantity: 0,
    unit: 'un',
    minQuantity: 0,
    notes: '',
  });

  useEffect(() => {
    fetchStock().then(setItems).catch(() => setItems([]));
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name?.trim()) return;
    const item: StockItem = {
      id: newStockId(),
      name: draft.name.trim(),
      brand: draft.brand?.trim() ?? '',
      supplier: draft.supplier?.trim() ?? '',
      unitPrice: draft.unitPrice ?? 0,
      quantity: draft.quantity ?? 0,
      unit: draft.unit ?? 'un',
      minQuantity: draft.minQuantity ?? 0,
      notes: draft.notes?.trim() ?? '',
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, item]);
    setDraft({
      name: '',
      brand: '',
      supplier: '',
      unitPrice: 0,
      quantity: 0,
      unit: 'un',
      minQuantity: 0,
      notes: '',
    });
    setShowAdd(false);
    await createStockItem(item);
  }

  async function update(id: string, patch: Partial<StockItem>) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it,
      ),
    );
    await updateStockItem(id, patch);
  }

  async function remove(id: string) {
    if (!confirm('Remover este produto do estoque?')) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    await deleteStockItem(id);
  }

  function adjust(id: string, delta: number) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { quantity: Math.max(0, it.quantity + delta) });
  }

  const lowStock = items.filter(isLowStock);
  const totalValue = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Estoque
          </h1>
          <p className="text-sm text-primary-500/60">
            Produtos, fornecedores, marcas e quantidade. Avisa quando algo está
            acabando.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-full bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
        >
          {showAdd ? 'Fechar' : '+ Adicionar produto'}
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KPI label="Itens no estoque" value={String(items.length)} />
        <KPI label="Valor total" value={`R$ ${totalValue.toFixed(2)}`} />
        <KPI
          label="Estoque baixo"
          value={String(lowStock.length)}
          tone={lowStock.length > 0 ? 'warn' : undefined}
        />
      </div>

      {showAdd && (
        <form
          onSubmit={addItem}
          className="grid gap-3 rounded-xl border border-primary-100 bg-white p-5 md:grid-cols-2"
        >
          <Input
            label="Nome do produto"
            value={draft.name ?? ''}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <Input
            label="Marca"
            value={draft.brand ?? ''}
            onChange={(v) => setDraft({ ...draft, brand: v })}
          />
          <Input
            label="Fornecedor"
            value={draft.supplier ?? ''}
            onChange={(v) => setDraft({ ...draft, supplier: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Quantidade"
              type="number"
              value={String(draft.quantity ?? 0)}
              onChange={(v) => setDraft({ ...draft, quantity: parseFloat(v) || 0 })}
            />
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
                Unidade
              </span>
              <select
                value={draft.unit ?? 'un'}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Input
            label="Preço unitário R$"
            type="number"
            value={String(draft.unitPrice ?? 0)}
            onChange={(v) => setDraft({ ...draft, unitPrice: parseFloat(v) || 0 })}
          />
          <Input
            label="Estoque mínimo (alerta)"
            type="number"
            value={String(draft.minQuantity ?? 0)}
            onChange={(v) => setDraft({ ...draft, minQuantity: parseFloat(v) || 0 })}
          />
          <div className="md:col-span-2">
            <Input
              label="Observações"
              value={draft.notes ?? ''}
              onChange={(v) => setDraft({ ...draft, notes: v })}
            />
          </div>
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
          >
            Salvar produto
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
          Nenhum produto no estoque ainda. Clique em "+ Adicionar produto".
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
              <tr>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Marca / Fornecedor</th>
                <th className="px-3 py-2 text-right">Preço un</th>
                <th className="px-3 py-2 text-center">Quantidade</th>
                <th className="px-3 py-2 text-right">Valor total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const low = isLowStock(it);
                return (
                  <tr
                    key={it.id}
                    className={`border-t border-primary-100 align-top ${low ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-primary-500">{it.name}</p>
                      {it.notes && (
                        <p className="text-[11px] text-primary-500/60">{it.notes}</p>
                      )}
                      {low && (
                        <span className="mt-1 inline-block rounded-full bg-amber-200 px-2 py-0.5 text-[10px] text-amber-900">
                          ⚠ Estoque baixo
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-primary-500/70">
                      <p>{it.brand || '—'}</p>
                      <p className="text-[11px]">{it.supplier || '—'}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      R$ {it.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjust(it.id, -1)}
                          className="rounded-md border border-primary-200 px-2 text-primary-500 hover:border-primary-500"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium text-primary-500">
                          {it.quantity} {it.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjust(it.id, 1)}
                          className="rounded-md border border-primary-200 px-2 text-primary-500 hover:border-primary-500"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-primary-500">
                      R$ {(it.unitPrice * it.quantity).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  tone?: 'warn';
}) {
  const cls =
    tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-primary-100 bg-white';
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

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}
