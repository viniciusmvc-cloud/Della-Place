// /app/admin/cardapio/page.tsx - VERSÃO CORRIGIDA
// Mudanças principais:
// 1. Linha 42: Remove filtro que ocultava produtos novos
// 2. Função addIngredient (linha ~120): Usa products ao invés de stock
// 3. Select de ingredientes (linha ~442): Mapeia sobre products, não stock
// 4. Tipo RecipeIngredient: Usa productId ao invés de stockItemId

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Product {
  id: number;
  name: string;
  brand?: string;
  unit?: string;
  active?: boolean;
}

export interface RecipeIngredient {
  productId?: number | null;  // ✅ MUDOU de stockItemId para productId
  amount: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  ingredients?: RecipeIngredient[];
}

export default function CardapioPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    const load = async () => {
      try {
        // Carregar products da API
        const productsRes = await fetch('/api/products');
        if (!productsRes.ok) throw new Error('Erro ao carregar produtos');
        const p = await productsRes.json();

        // ✅ FIX #1: Mostrar TODOS os produtos, sem filtro de active
        // ANTES: setProducts(p.filter((x) => x.active));
        // DEPOIS:
        setProducts(p);

        // Carregar menu da API
        const menuRes = await fetch('/api/menu');
        if (!menuRes.ok) throw new Error('Erro ao carregar cardápio');
        const m = await menuRes.json();
        setMenu(Array.isArray(m) ? m : []);
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ FIX #2: addIngredient usa products[0] ao invés de stock[0]
  // ANTES:
  // const firstStock = stock[0];
  // const nextIngredient: RecipeIngredient = {
  //   stockItemId: firstStock.id,
  //   amount: 0,
  //   unit: firstStock.unit,
  // };
  // DEPOIS:
  const addIngredient = useCallback((menuItemId: string) => {
    const item = menu.find((m) => m.id === menuItemId);
    if (!item) return;

    const firstProduct = products[0];
    if (!firstProduct) {
      alert('Crie um produto em /admin/produtos primeiro');
      return;
    }

    const nextIngredient: RecipeIngredient = {
      productId: firstProduct.id,  // ✅ Usa productId agora
      amount: 0,
      unit: firstProduct.unit ?? 'un',
    };

    update(menuItemId, {
      ingredients: [...(item.ingredients ?? []), nextIngredient],
    });
  }, [menu, products]);

  const updateIngredient = useCallback((
    menuItemId: string,
    ingredientIndex: number,
    updates: Partial<RecipeIngredient>
  ) => {
    const item = menu.find((m) => m.id === menuItemId);
    if (!item?.ingredients) return;

    const updated = [...item.ingredients];
    updated[ingredientIndex] = { ...updated[ingredientIndex], ...updates };
    update(menuItemId, { ingredients: updated });
  }, [menu]);

  const removeIngredient = useCallback((
    menuItemId: string,
    ingredientIndex: number
  ) => {
    const item = menu.find((m) => m.id === menuItemId);
    if (!item?.ingredients) return;

    const updated = item.ingredients.filter((_, i) => i !== ingredientIndex);
    update(menuItemId, { ingredients: updated });
  }, [menu]);

  const update = async (menuItemId: string, updates: Partial<MenuItem>) => {
    try {
      const item = menu.find((m) => m.id === menuItemId);
      if (!item) return;

      const updated = { ...item, ...updates };

      const res = await fetch(`/api/menu/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      setMenu((prev) =>
        prev.map((m) => (m.id === menuItemId ? updated : m))
      );
    } catch (err) {
      alert(`Erro ao salvar: ${err}`);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Cardápio</h1>

      <div className="space-y-6">
        {menu.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 p-4"
            onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
              <span className="text-gray-400">
                {selectedItem === item.id ? '▼' : '▶'}
              </span>
            </div>

            {selectedItem === item.id && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <h3 className="font-medium">Ingredientes</h3>

                {item.ingredients?.map((ing, idx) => {
                  const selectedProduct = products.find(
                    (p) => p.id === ing.productId
                  );

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-10 items-end gap-2 rounded bg-gray-50 p-3"
                    >
                      {/* ✅ FIX #3: Select agora mapeia sobre products, não stock */}
                      {/* ANTES:
                      <select value={ing.stockItemId} onChange={(e) => {
                        const newStock = stock.find((s) => s.id === e.target.value);
                        updateIngredient(item.id, idx, {
                          stockItemId: e.target.value,
                          unit: newStock?.unit ?? ing.unit,
                        });
                      }}>
                        {stock.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {s.brand}
                          </option>
                        ))}
                      </select>
                      */}

                      {/* DEPOIS: */}
                      <select
                        value={ing.productId ?? ''}
                        onChange={(e) => {
                          const newProduct = products.find(
                            (p) => p.id === parseInt(e.target.value)
                          );
                          updateIngredient(item.id, idx, {
                            productId: e.target.value ? parseInt(e.target.value) : null,
                            unit: newProduct?.unit ?? ing.unit,
                          });
                        }}
                        className="col-span-5 rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">-- Selecione --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.brand ? ` · ${p.brand}` : ''}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        value={ing.amount}
                        onChange={(e) =>
                          updateIngredient(item.id, idx, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Qtd"
                        className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm"
                      />

                      <select
                        value={ing.unit}
                        onChange={(e) =>
                          updateIngredient(item.id, idx, { unit: e.target.value })
                        }
                        className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option>un</option>
                        <option>g</option>
                        <option>kg</option>
                        <option>ml</option>
                        <option>l</option>
                      </select>

                      <button
                        onClick={() => removeIngredient(item.id, idx)}
                        className="col-span-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => addIngredient(item.id)}
                  className="w-full rounded border-2 border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400"
                >
                  + Adicionar Ingrediente
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
