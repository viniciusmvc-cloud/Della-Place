'use client';

import { useEffect, useState } from 'react';
import HelpBanner from '@/components/admin/HelpBanner';
import { fetchAvailability } from '@/lib/api';
import { formatAmount, titleCase } from '@/lib/format';
import { formatDateBR, formatDateISO } from '@/lib/utils';

type Production = {
  date: string;
  totalPizzas: number;
  byFlavor: { name: string; count: number }[];
  ingredients: {
    stockItemId: string;
    stockName: string;
    stockBrand: string;
    unit: string;
    needed: number;
    inStock: number;
    deficit: number;
    ok: boolean;
  }[];
};

export default function MiseEnPlacePage() {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  });
  const [openDates, setOpenDates] = useState<string[]>([]);
  const [data, setData] = useState<Production | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability().then((list) => setOpenDates(list.map((a) => a.date)));
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    fetch(`/api/production?date=${date}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [date]);

  function buildShoppingList(): string {
    if (!data || data.ingredients.length === 0) return '';
    const dateBR = formatDateBR(new Date(`${date}T12:00:00`));
    const lines: string[] = [];
    lines.push(`🛒 *Lista de compras · Della Pace*`);
    lines.push(`📅 Produção: ${dateBR}`);
    lines.push(`🍕 Total: ${data.totalPizzas} pizzas`);
    lines.push('');
    lines.push('*Pra comprar (faltando):*');
    const toBuy = data.ingredients.filter((i) => !i.ok);
    if (toBuy.length === 0) {
      lines.push('— nada (estoque suficiente) —');
    } else {
      toBuy.forEach((i) => {
        lines.push(`• ${titleCase(i.stockName)}: ${formatAmount(i.deficit, i.unit)}`);
      });
    }
    lines.push('');
    lines.push('*Já em estoque:*');
    const inStock = data.ingredients.filter((i) => i.ok && i.inStock > 0);
    if (inStock.length === 0) {
      lines.push('— vazio —');
    } else {
      inStock.forEach((i) => {
        lines.push(`✓ ${titleCase(i.stockName)}: ${formatAmount(i.inStock, i.unit)}`);
      });
    }
    return lines.join('\n');
  }

  async function copyShoppingList() {
    const text = buildShoppingList();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Lista copiada! Cole no WhatsApp ou onde precisar.');
    } catch {
      alert('Não consegui copiar. Selecione manualmente abaixo.');
    }
  }

  function shareWhatsApp() {
    const text = buildShoppingList();
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Mise en place
        </h1>
        <p className="text-sm text-primary-500/60">
          Lista de produção e compras para o dia. Calculado automaticamente
          a partir dos pedidos confirmados e das receitas do cardápio.
        </p>
      </header>

      <HelpBanner
        id="mise"
        title="Mise en place"
        whenToFill="Você não preenche nada aqui. É a lista de compras gerada automaticamente."
        steps={[
          'Escolha a data de produção no topo (geralmente o próximo domingo).',
          'A tela mostra: total de pizzas reservadas + lista de ingredientes necessários.',
          'Use essa lista pra fazer o mercado na sexta/sábado.',
          'Depois de comprar, lance cada compra na aba "Compras".',
        ]}
        doNot={[
          'Esta tela não desconta o que você já tem em estoque automaticamente. Ela mostra o NECESSÁRIO total. Compare com "Estoque carregado" da aba Compras.',
        ]}
        notes='Os números só aparecem se as receitas estiverem cadastradas no Cardápio (ingredientes vinculados ao Estoque).'
      />

      <div className="rounded-xl border border-primary-100 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            Data de produção
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
            />
            {openDates.length > 0 && (
              <select
                value=""
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm"
              >
                <option value="">— ou escolha uma data aberta —</option>
                {openDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDateBR(new Date(`${d}T12:00:00`))}
                  </option>
                ))}
              </select>
            )}
          </div>
        </label>
      </div>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-primary-500/60">Calculando…</p>
      ) : data ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <KPI label="Pizzas a produzir" value={String(data.totalPizzas)} />
            <KPI
              label="Sabores diferentes"
              value={String(data.byFlavor.length)}
            />
            <KPI
              label="Ingredientes envolvidos"
              value={String(data.ingredients.length)}
            />
          </section>

          {data.byFlavor.length > 0 && (
            <section className="rounded-xl border border-primary-100 bg-white p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
                Pizzas por sabor
              </h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {data.byFlavor.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between rounded-md border border-primary-100 bg-white p-2 text-sm"
                  >
                    <span className="text-primary-500">{titleCase(f.name)}</span>
                    <span
                      className="text-lg font-medium text-primary-500"
                      style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                      }}
                    >
                      {f.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-primary-100 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 p-5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-primary-500/60">
                Lista de compras + estoque
              </h2>
              {data.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyShoppingList}
                    className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500 hover:border-primary-500 hover:bg-primary-50"
                  >
                    📋 Copiar
                  </button>
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="rounded-full border border-emerald-300 bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                  >
                    📨 WhatsApp
                  </button>
                </div>
              )}
            </header>
            {data.ingredients.length === 0 ? (
              <p className="p-5 text-sm text-primary-500/60">
                {data.totalPizzas === 0
                  ? 'Nenhum pedido pra essa data.'
                  : 'Os sabores pedidos não têm receita cadastrada no Cardápio. Adicione ingredientes lá pra calcular automaticamente.'}
              </p>
            ) : (
              <ul className="divide-y divide-primary-100">
                {data.ingredients.map((ing) => (
                  <li
                    key={ing.stockItemId}
                    className={`flex flex-wrap items-center justify-between gap-3 p-4 ${
                      !ing.ok ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-medium text-primary-500">
                        {titleCase(ing.stockName)}
                      </p>
                      {ing.stockBrand && (
                        <p className="text-[11px] text-primary-500/60">
                          {titleCase(ing.stockBrand)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary-500/60">Necessário</p>
                      <p
                        className="text-sm font-medium text-primary-500"
                        style={{
                          fontFamily: 'var(--font-cormorant), Georgia, serif',
                        }}
                      >
                        {formatAmount(ing.needed, ing.unit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary-500/60">Em estoque</p>
                      <p
                        className={`text-sm font-medium ${
                          ing.ok ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                        style={{
                          fontFamily: 'var(--font-cormorant), Georgia, serif',
                        }}
                      >
                        {formatAmount(ing.inStock, ing.unit)}
                      </p>
                    </div>
                    <div className="min-w-[110px] text-right">
                      {ing.ok ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
                          ✓ tem
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs text-amber-900">
                          comprar {formatAmount(ing.deficit, ing.unit)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.ingredients.some((i) => !i.ok) && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>📋 Pra comprar antes do dia:</strong>
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
                {data.ingredients
                  .filter((i) => !i.ok)
                  .map((i) => (
                    <li key={i.stockItemId}>
                      {titleCase(i.stockName)} — {formatAmount(i.deficit, i.unit)}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <p className="text-sm text-primary-500/60">Selecione uma data acima.</p>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-4">
      <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </p>
      <p
        className="mt-1 text-3xl text-primary-500"
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
