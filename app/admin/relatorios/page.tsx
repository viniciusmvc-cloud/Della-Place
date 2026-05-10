'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import HelpBanner from '@/components/admin/HelpBanner';
import {
  fetchCustomers,
  fetchMenu,
  fetchOrders,
  fetchStock,
} from '@/lib/api';
import {
  ingredientCost,
  type MenuItem,
  type RecipeIngredient,
} from '@/lib/menu';
import { formatBRL } from '@/lib/format';
import { type Order, type StoredCustomer } from '@/lib/orders';
import { type StockItem } from '@/lib/stock';
import { formatDateBR } from '@/lib/utils';

const COLORS = {
  primary: '#2B4C6B',
  accent: '#C2563E',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  slate: '#64748b',
  purple: '#a855f7',
  dim: '#cbd5e1',
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

const STATUS_TONE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmado: 'bg-blue-50 text-blue-700 border-blue-200',
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
};

function flavorCategory(flavor: string, menu: MenuItem[]): string {
  const m = menu.find((mi) => mi.name.toLowerCase() === flavor.toLowerCase());
  return m?.category || 'Sem categoria';
}

type FilterDim = 'flavor' | 'category' | 'date' | 'status';
type Filter = { dim: FilterDim; value: string } | null;
type Tab = 'dashboard' | 'detalhamento';
type Metric = 'pizzas' | 'receita' | 'lucro';

const METRIC_LABEL: Record<Metric, string> = {
  pizzas: 'Pizzas',
  receita: 'Receita',
  lucro: 'Lucro',
};

const FILTER_LABEL: Record<FilterDim, string> = {
  flavor: 'Sabor',
  category: 'Categoria',
  date: 'Data',
  status: 'Status',
};

export default function RelatoriosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [filter, setFilter] = useState<Filter>(null);
  const [metric, setMetric] = useState<Metric>('pizzas');

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
      fetchStock().catch(() => []),
    ])
      .then(([o, c, m, s]) => {
        setOrders(o);
        setCustomers(c);
        setMenu(m);
        setStock(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const costByFlavor = useMemo(() => {
    const map = new Map<string, number>();
    menu.forEach((m) => {
      let cost = 0;
      if (m.ingredients?.length) {
        (m.ingredients as RecipeIngredient[]).forEach((ing) => {
          const stk = stock.find((s) => s.id === ing.stockItemId);
          if (stk) cost += ingredientCost(ing, stk);
        });
      } else {
        cost = m.cost;
      }
      map.set(m.name.toLowerCase(), cost);
    });
    return map;
  }, [menu, stock]);

  function toggleFilter(dim: FilterDim, value: string) {
    setFilter((cur) =>
      cur && cur.dim === dim && cur.value === value ? null : { dim, value },
    );
  }

  type EnrichedItem = {
    orderId: string;
    date: string;
    status: string;
    customerCpf: string;
    customerName: string;
    notes: string;
    flavor: string;
    finish: string;
    time: string;
    price: number;
    cost: number;
    profit: number;
    category: string;
  };

  const allItems = useMemo<EnrichedItem[]>(() => {
    const out: EnrichedItem[] = [];
    orders.forEach((o) => {
      o.items.forEach((it) => {
        const cost = costByFlavor.get(it.flavor.toLowerCase()) ?? 0;
        out.push({
          orderId: o.id,
          date: o.date,
          status: o.status,
          customerCpf: o.customer.cpf,
          customerName: o.customer.fullName || '—',
          notes: o.notes || '',
          flavor: it.flavor,
          finish: it.finish,
          time: it.time,
          price: it.price,
          cost,
          profit: it.price - cost,
          category: flavorCategory(it.flavor, menu),
        });
      });
    });
    return out;
  }, [orders, costByFlavor, menu]);

  function passesFilter(it: EnrichedItem, exclude?: FilterDim): boolean {
    if (!filter || filter.dim === exclude) return true;
    if (filter.dim === 'flavor') return it.flavor === filter.value;
    if (filter.dim === 'category') return it.category === filter.value;
    if (filter.dim === 'date') return it.date === filter.value;
    if (filter.dim === 'status') return it.status === filter.value;
    return true;
  }

  const filteredItems = useMemo(
    () => allItems.filter((it) => passesFilter(it)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, filter],
  );

  const kpis = useMemo(() => {
    const paidItems = filteredItems.filter((i) => i.status === 'pago');
    const upcomingItems = filteredItems.filter((i) => i.status === 'confirmado');
    const totalPizzas = filteredItems.filter((i) => i.status !== 'cancelado').length;
    const pizzasPagas = paidItems.length;
    const pizzasUpcoming = upcomingItems.length;
    const receita = paidItems.reduce((s, i) => s + i.price, 0);
    const custo = paidItems.reduce((s, i) => s + i.cost, 0);
    const lucro = receita - custo;
    const orderIds = new Set(paidItems.map((i) => i.orderId));
    const totalPedidos = orderIds.size;
    const ticketMedio = totalPedidos > 0 ? receita / totalPedidos : 0;
    const foodCostPct = receita > 0 ? (custo / receita) * 100 : 0;
    return {
      totalPizzas,
      pizzasPagas,
      pizzasUpcoming,
      totalPedidos,
      receita,
      custo,
      lucro,
      ticketMedio,
      foodCostPct,
    };
  }, [filteredItems]);

  function metricValue(it: EnrichedItem): number {
    if (metric === 'pizzas') return it.status === 'cancelado' ? 0 : 1;
    if (it.status !== 'pago') return 0;
    if (metric === 'receita') return it.price;
    return it.profit;
  }

  function aggBy(dim: FilterDim) {
    const items = allItems.filter((it) => passesFilter(it, dim));
    const map = new Map<string, number>();
    items.forEach((it) => {
      const key =
        dim === 'flavor'
          ? it.flavor
          : dim === 'category'
            ? it.category
            : dim === 'date'
              ? it.date
              : it.status;
      map.set(key, (map.get(key) || 0) + metricValue(it));
    });
    return map;
  }

  const byFlavor = useMemo(() => {
    const m = aggBy('flavor');
    return Array.from(m.entries())
      .map(([flavor, value]) => ({ flavor, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, filter, metric, costByFlavor, menu]);

  const byCategory = useMemo(() => {
    const items = allItems.filter(
      (it) => passesFilter(it, 'category') && it.status === 'pago',
    );
    const map = new Map<string, number>();
    items.forEach((it) => {
      map.set(it.category, (map.get(it.category) || 0) + it.price);
    });
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, filter]);

  const byDate = useMemo(() => {
    const m = aggBy('date');
    return Array.from(m.entries())
      .map(([date, value]) => ({
        date,
        label: formatDateBR(new Date(`${date}T12:00:00`)).slice(0, 5),
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, filter, metric]);

  const byStatus = useMemo(() => {
    const m = aggBy('status');
    const order = ['pago', 'confirmado', 'pendente', 'cancelado'];
    return Array.from(m.entries())
      .map(([status, value]) => ({
        status,
        label: STATUS_LABEL[status] ?? status,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, filter, metric]);

  if (loading) {
    return <p className="text-sm text-primary-500/60">Carregando dados…</p>;
  }

  const isMoney = metric !== 'pizzas';
  const fmt = (v: number) => (isMoney ? formatBRL(v) : v.toString());

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Relatórios · BI
          </h1>
          <p className="text-sm text-primary-500/60">
            Interativo, igual o Power BI do Aurélio. Clique em qualquer barra
            ou fatia pra filtrar tudo.
          </p>
        </div>

        <div className="flex rounded-full border border-primary-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
              tab === 'dashboard'
                ? 'bg-primary-500 text-white'
                : 'text-primary-500/70 hover:text-primary-500'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setTab('detalhamento')}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
              tab === 'detalhamento'
                ? 'bg-primary-500 text-white'
                : 'text-primary-500/70 hover:text-primary-500'
            }`}
          >
            Detalhamento
          </button>
        </div>
      </header>

      {filter && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2">
          <span className="text-[10px] uppercase tracking-widest text-primary-500/60">
            Filtro ativo
          </span>
          <span className="rounded-full bg-primary-500 px-3 py-1 text-xs text-white">
            {FILTER_LABEL[filter.dim]}:{' '}
            <strong>
              {filter.dim === 'status'
                ? STATUS_LABEL[filter.value] ?? filter.value
                : filter.dim === 'date'
                  ? formatDateBR(new Date(`${filter.value}T12:00:00`))
                  : filter.value}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs text-primary-500/80 hover:border-rose-400 hover:text-rose-500"
          >
            ✕ limpar filtro
          </button>
        </div>
      )}

      {tab === 'dashboard' ? (
        <>
          <HelpBanner
            id="bi"
            title="BI · Dashboard interativo"
            whenToFill="Você não preenche aqui. Clique em qualquer barra/fatia pra cross-filter."
            steps={[
              'Clique em um sabor (ex: Margherita) pra filtrar TODOS os KPIs e gráficos pra esse sabor.',
              'Clique numa fatia da pizza (ex: Clássica) pra ver só os clássicos.',
              'Clique numa data pra ver só aquele domingo. Clique num status pra ver só Pago/Confirmado/etc.',
              'Use o seletor "Pizzas / Receita / Lucro" pra trocar a métrica dos gráficos por sabor e por evento.',
              'Clica de novo no mesmo item pra desselecionar.',
            ]}
            notes="O cross-filter é como o Power BI: cada gráfico mostra dados respeitando os filtros dos outros gráficos."
          />

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <KPI label="Total Pizzas" value={kpis.totalPizzas.toString()} hint={filter ? 'filtrado' : 'não cancelado'} />
            <KPI label="Receita Total" value={formatBRL(kpis.receita)} tone="good" hint="só pago" />
            <KPI label="Custo Total" value={formatBRL(kpis.custo)} hint="só pago" />
            <KPI
              label="Lucro Total"
              value={formatBRL(kpis.lucro)}
              tone={kpis.lucro >= 0 ? 'good' : 'bad'}
              hint="receita − custo"
            />
            <KPI label="Ticket Médio" value={formatBRL(kpis.ticketMedio)} hint="por pedido pago" />
            <KPI
              label="Food Cost %"
              value={`${kpis.foodCostPct.toFixed(1)}%`}
              tone={
                kpis.foodCostPct < 35 ? 'good' : kpis.foodCostPct < 50 ? 'warn' : 'bad'
              }
              hint="custo ÷ receita"
            />
          </section>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-primary-500/60">
              Métrica dos gráficos
            </span>
            <div className="flex rounded-full border border-primary-200 bg-white p-1">
              {(['pizzas', 'receita', 'lucro'] as Metric[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest transition ${
                    metric === m
                      ? 'bg-primary-500 text-white'
                      : 'text-primary-500/70 hover:text-primary-500'
                  }`}
                >
                  {METRIC_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-primary-100 bg-white p-5 lg:col-span-2">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
                {METRIC_LABEL[metric]} por sabor
              </h3>
              <p className="mb-4 text-[11px] text-primary-500/60">
                Clique numa barra pra filtrar tudo nesse sabor.
              </p>
              {byFlavor.length === 0 ? (
                <p className="text-sm text-primary-500/60">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(260, byFlavor.length * 32)}>
                  <BarChart data={byFlavor} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="flavor"
                      tick={{ fontSize: 10 }}
                      width={110}
                    />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar
                      dataKey="value"
                      cursor="pointer"
                      onClick={(d) => toggleFilter('flavor', d.flavor)}
                    >
                      {byFlavor.map((d) => {
                        const selected =
                          filter?.dim === 'flavor' && filter.value === d.flavor;
                        const dimmed = filter?.dim === 'flavor' && !selected;
                        const isProfit = metric === 'lucro';
                        const baseColor = isProfit
                          ? d.value >= 0
                            ? COLORS.emerald
                            : COLORS.rose
                          : COLORS.primary;
                        return (
                          <Cell
                            key={d.flavor}
                            fill={dimmed ? COLORS.dim : baseColor}
                            opacity={selected ? 1 : 0.95}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-primary-100 bg-white p-5">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
                Receita por categoria
              </h3>
              <p className="mb-4 text-[11px] text-primary-500/60">
                Clique numa fatia pra filtrar pra essa categoria.
              </p>
              {byCategory.length === 0 ? (
                <p className="text-sm text-primary-500/60">Sem receitas pagas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      onClick={(_, idx) =>
                        toggleFilter('category', byCategory[idx].name)
                      }
                      cursor="pointer"
                    >
                      {byCategory.map((c, i) => {
                        const selected =
                          filter?.dim === 'category' && filter.value === c.name;
                        const dimmed = filter?.dim === 'category' && !selected;
                        return (
                          <Cell
                            key={c.name}
                            fill={
                              dimmed
                                ? COLORS.dim
                                : i === 0
                                  ? COLORS.primary
                                  : i === 1
                                    ? COLORS.accent
                                    : COLORS.amber
                            }
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-primary-100 bg-white p-5 lg:col-span-2">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
                {METRIC_LABEL[metric]} por evento
              </h3>
              <p className="mb-4 text-[11px] text-primary-500/60">
                Clique numa data (domingo) pra filtrar todo o BI nessa data.
              </p>
              {byDate.length === 0 ? (
                <p className="text-sm text-primary-500/60">Sem ciclos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar
                      dataKey="value"
                      cursor="pointer"
                      onClick={(d) => toggleFilter('date', d.date)}
                    >
                      {byDate.map((d) => {
                        const selected =
                          filter?.dim === 'date' && filter.value === d.date;
                        const dimmed = filter?.dim === 'date' && !selected;
                        return (
                          <Cell
                            key={d.date}
                            fill={dimmed ? COLORS.dim : COLORS.accent}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-primary-100 bg-white p-5">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
                {METRIC_LABEL[metric]} por status
              </h3>
              <p className="mb-4 text-[11px] text-primary-500/60">
                Clique pra filtrar pelo status do pedido.
              </p>
              {byStatus.length === 0 ? (
                <p className="text-sm text-primary-500/60">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar
                      dataKey="value"
                      cursor="pointer"
                      onClick={(d) => toggleFilter('status', d.status)}
                    >
                      {byStatus.map((d) => {
                        const selected =
                          filter?.dim === 'status' && filter.value === d.status;
                        const dimmed = filter?.dim === 'status' && !selected;
                        const color =
                          d.status === 'pago'
                            ? COLORS.emerald
                            : d.status === 'confirmado'
                              ? COLORS.blue
                              : d.status === 'pendente'
                                ? COLORS.amber
                                : COLORS.rose;
                        return (
                          <Cell
                            key={d.status}
                            fill={dimmed ? COLORS.dim : color}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <div className="flex items-center gap-4 pt-4">
            <div className="h-px flex-1 bg-primary-100" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-primary-500/50">
              Outros indicadores
            </p>
            <div className="h-px flex-1 bg-primary-100" />
          </div>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPI
              label="Pedidos"
              value={kpis.totalPedidos.toString()}
              hint={filter ? 'filtrado · pago' : 'pago'}
            />
            <KPI
              label="Pizzas pagas"
              value={kpis.pizzasPagas.toString()}
              hint="entregues"
            />
            <KPI
              label="A produzir"
              value={kpis.pizzasUpcoming.toString()}
              hint="confirmadas"
              tone={kpis.pizzasUpcoming > 0 ? 'warn' : undefined}
            />
            <KPI
              label="Clientes"
              value={customers.length.toString()}
              hint="cadastrados"
            />
          </section>

          <p className="text-center text-[10px] text-primary-500/40">
            Clique em qualquer item dos gráficos pra cross-filter · clique de
            novo pra remover.
          </p>
        </>
      ) : (
        <DetailTable items={filteredItems} filterLabel={filter} />
      )}
    </div>
  );
}

function DetailTable({
  items,
  filterLabel,
}: {
  items: Array<{
    orderId: string;
    customerName: string;
    flavor: string;
    status: string;
    notes: string;
    time: string;
    date: string;
    price: number;
  }>;
  filterLabel: Filter;
}) {
  const [search, setSearch] = useState('');

  type Row = {
    orderId: string;
    cliente: string;
    produto: string;
    quantidade: number;
    status: string;
    observacao: string;
    horario: string;
    mes: string;
    dia: string;
    date: string;
    receita: number;
  };

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    items.forEach((it) => {
      const key = `${it.orderId}|${it.flavor}`;
      const e = map.get(key);
      if (e) {
        e.quantidade += 1;
        e.receita += it.price;
      } else {
        const d = new Date(`${it.date}T12:00:00`);
        const mes = d.toLocaleDateString('pt-BR', { month: 'long' });
        const dia = d.getDate().toString().padStart(2, '0');
        map.set(key, {
          orderId: it.orderId,
          cliente: it.customerName,
          produto: it.flavor,
          quantidade: 1,
          status: it.status,
          observacao: it.notes,
          horario: it.time,
          mes,
          dia,
          date: it.date,
          receita: it.price,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.horario || '').localeCompare(a.horario || '');
    });
  }, [items]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.cliente.toLowerCase().includes(q) ||
      r.produto.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.observacao.toLowerCase().includes(q)
    );
  });

  function exportCSV() {
    const header = [
      'Cliente',
      'Produto',
      'Quantidade',
      'Receita',
      'Status',
      'Observação',
      'Horário',
      'Mês',
      'Dia',
      'Data',
    ];
    const lines = [
      header.join(','),
      ...filtered.map((r) =>
        [
          r.cliente,
          r.produto,
          r.quantidade,
          r.receita.toFixed(2),
          STATUS_LABEL[r.status] ?? r.status,
          r.observacao,
          r.horario,
          r.mes,
          r.dia,
          r.date,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi-detalhamento-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-3">
      <HelpBanner
        id="bi-detail"
        title="BI · Detalhamento"
        whenToFill="Página 2 do BI do Aurélio. Cross-filter aplicado também aqui."
        steps={[
          'Cada linha = 1 sabor de 1 pedido. Pedido com 3 pizzas distintas vira 3 linhas.',
          'Quantidade soma pizzas iguais do mesmo pedido (mesmo sabor).',
          'Se você setar um filtro no Dashboard (ex: Margherita), só linhas desse sabor aparecem aqui.',
          'Use a busca pra filtrar por cliente/sabor/status/observação. Botão "Exportar CSV" baixa o que está filtrado.',
        ]}
        notes="Ordenado da pizza mais recente pra mais antiga."
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente, sabor, status…"
          className="flex-1 min-w-[220px] rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
        <button
          type="button"
          onClick={exportCSV}
          className="rounded-full border border-primary-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-primary-500/80 hover:border-primary-500 hover:text-primary-500"
        >
          Exportar CSV
        </button>
        <p className="text-[11px] text-primary-500/60">
          {filtered.length} de {rows.length} linhas
          {filterLabel ? ' · cross-filter ativo' : ''}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-primary-50/50 text-[10px] uppercase tracking-widest text-primary-500/70">
            <tr>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Produto</th>
              <th className="px-3 py-2 text-center">Qtd</th>
              <th className="px-3 py-2 text-right">Receita</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Observação</th>
              <th className="px-3 py-2 text-left">Horário</th>
              <th className="px-3 py-2 text-left">Mês</th>
              <th className="px-3 py-2 text-center">Dia</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-primary-500/50">
                  Sem pedidos {search || filterLabel ? 'com esse filtro' : 'cadastrados'}.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={`${r.orderId}-${r.produto}-${i}`}
                  className="border-t border-primary-100/60 hover:bg-primary-50/30"
                >
                  <td className="px-3 py-2 text-primary-500">{r.cliente}</td>
                  <td className="px-3 py-2 text-primary-500/80">{r.produto}</td>
                  <td className="px-3 py-2 text-center text-primary-500">{r.quantidade}</td>
                  <td className="px-3 py-2 text-right text-primary-500/80">{formatBRL(r.receita)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                        STATUS_TONE[r.status] ?? 'border-primary-200 bg-white'
                      }`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-primary-500/70">{r.observacao || '—'}</td>
                  <td className="px-3 py-2 text-primary-500/70">{r.horario || '—'}</td>
                  <td className="px-3 py-2 text-primary-500/70 capitalize">{r.mes}</td>
                  <td className="px-3 py-2 text-center text-primary-500">{r.dia}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
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
  tone?: 'good' | 'warn' | 'bad';
  hint?: string;
}) {
  const toneCls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'bad'
          ? 'border-rose-200 bg-rose-50'
          : 'border-primary-100 bg-white';
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </p>
      <p
        className="mt-1 text-xl text-primary-500"
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
