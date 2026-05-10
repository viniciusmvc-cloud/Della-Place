'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
  fetchPurchases,
  fetchStock,
} from '@/lib/api';
import {
  ingredientCost,
  type MenuItem,
  type RecipeIngredient,
} from '@/lib/menu';
import { formatBRL } from '@/lib/format';
import { type Order, type StoredCustomer } from '@/lib/orders';
import { CATEGORY_LABEL, type ProductCategory } from '@/lib/products';
import { type Purchase } from '@/lib/purchases';
import { type StockItem } from '@/lib/stock';
import { formatDateBR, formatDateISO } from '@/lib/utils';

const COLORS = {
  primary: '#2B4C6B',
  accent: '#C2563E',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  slate: '#64748b',
  purple: '#a855f7',
};

const CATEGORY_COLOR: Record<ProductCategory, string> = {
  massa: '#f59e0b',
  molho: '#f43f5e',
  cobertura: '#10b981',
  operacao: '#3b82f6',
};

function classifyIngredient(name: string): ProductCategory {
  const n = name.toLowerCase();
  if (/farinh|fermento|levedu/.test(n)) return 'massa';
  if (/tomate|molho|manjeric|polp|passata/.test(n)) return 'molho';
  if (/sal\b|azeite|embalag|gás|gas|caixa|papel/.test(n)) return 'operacao';
  return 'cobertura';
}

// Categoria do sabor (Clássica vs Especial) — espelha o BI do Aurélio.
// Heurística: sabores com 1 ingrediente principal + base = Clássica;
// combinações ou ingredientes premium = Especial.
const FLAVOR_CATEGORY: Record<string, 'CLÁSSICA' | 'ESPECIAL'> = {
  'margueritha': 'CLÁSSICA',
  'marguerita': 'CLÁSSICA',
  'calabria': 'CLÁSSICA',
  'portuguesa': 'CLÁSSICA',
  'frango com catupiry': 'CLÁSSICA',
  'zucchinni e bacon': 'ESPECIAL',
  '4 fromaggio': 'ESPECIAL',
  'lombinho com alho poró': 'ESPECIAL',
  'lombinho com alho poro': 'ESPECIAL',
  'toscana': 'ESPECIAL',
};
function flavorCategory(flavor: string): 'CLÁSSICA' | 'ESPECIAL' {
  return FLAVOR_CATEGORY[flavor.toLowerCase().trim()] ?? 'ESPECIAL';
}

export default function BIPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
      fetchStock().catch(() => []),
      fetchPurchases().catch(() => []),
    ])
      .then(([o, c, m, s, p]) => {
        setOrders(o);
        setCustomers(c);
        setMenu(m);
        setStock(s);
        setPurchases(p);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── KPIs principais (espelha o BI do Aurélio) ───
  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'pago');
    const totalPedidos = paid.length;
    const totalPizzas = paid.reduce((s, o) => s + o.items.length, 0);
    const receita = paid.reduce((s, o) => s + o.total, 0);
    const custo = paid.reduce((s, o) => {
      return s + o.items.reduce((c, it) => {
        const m = menu.find(
          (mi) => mi.name.toLowerCase() === it.flavor.toLowerCase(),
        );
        return c + (m?.cost ?? 0);
      }, 0);
    }, 0);
    const lucro = receita - custo;
    const ticketMedio = paid.length > 0 ? receita / paid.length : 0;
    const foodCostPct = receita > 0 ? (custo / receita) * 100 : 0;
    return { totalPedidos, totalPizzas, receita, custo, lucro, ticketMedio, foodCostPct };
  }, [orders, menu]);

  // ─── Receita por CATEGORIA (Clássica/Especial) ───
  const revenueByCategory = useMemo(() => {
    const totals: Record<string, number> = { 'CLÁSSICA': 0, 'ESPECIAL': 0 };
    orders
      .filter((o) => o.status === 'pago')
      .forEach((o) =>
        o.items.forEach((it) => {
          const cat = flavorCategory(it.flavor);
          totals[cat] += it.price;
        }),
      );
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [orders]);

  // ─── Pizzas por data/evento (todas as datas com pedidos pagos) ───
  const pizzasByDate = useMemo(() => {
    const map: Record<string, number> = {};
    orders
      .filter((o) => o.status === 'pago')
      .forEach((o) => {
        map[o.date] = (map[o.date] || 0) + o.items.length;
      });
    return Object.entries(map)
      .map(([date, pizzas]) => ({
        date,
        label: formatDateBR(new Date(`${date}T12:00:00`)).slice(0, 5),
        pizzas,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  // ─── Faturamento por dia (últimos 60 dias) ───
  const revenueByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { date: string; label: string; receita: number; pedidos: number }[] = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = formatDateISO(d);
      days.push({
        date: iso,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receita: 0,
        pedidos: 0,
      });
    }
    const map = new Map(days.map((d) => [d.date, d]));
    orders
      .filter((o) => o.status === 'pago')
      .forEach((o) => {
        const e = map.get(o.date);
        if (e) {
          e.receita += o.total;
          e.pedidos += 1;
        }
      });
    return days;
  }, [orders]);

  // ─── Pizzas mais vendidas ───
  const topFlavors = useMemo(() => {
    const c: Record<string, number> = {};
    orders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => (c[it.flavor] = (c[it.flavor] || 0) + 1)),
      );
    return Object.entries(c)
      .map(([flavor, count]) => ({ flavor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [orders]);

  // ─── Custo por categoria de bloco (massa/molho/cobertura/operação) ───
  const costByCategory = useMemo(() => {
    const totals: Record<ProductCategory, number> = {
      massa: 0,
      molho: 0,
      cobertura: 0,
      operacao: 0,
    };
    orders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => {
          const m = menu.find(
            (mi) => mi.name.toLowerCase() === it.flavor.toLowerCase(),
          );
          if (!m?.ingredients) return;
          (m.ingredients as RecipeIngredient[]).forEach((ing) => {
            const stk = stock.find((s) => s.id === ing.stockItemId);
            if (!stk) return;
            const cost = ingredientCost(ing, stk);
            const cat = classifyIngredient(stk.name);
            totals[cat] += cost;
          });
        }),
      );
    return (Object.keys(totals) as ProductCategory[]).map((cat) => ({
      name: CATEGORY_LABEL[cat],
      value: totals[cat],
      cat,
    }));
  }, [orders, menu, stock]);

  // ─── Horário de pico ───
  const ordersByHour = useMemo(() => {
    const map: Record<string, number> = {};
    for (let h = 18; h < 23; h++) map[`${h}h`] = 0;
    orders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) =>
        o.items.forEach((it) => {
          const hour = it.time.slice(0, 2);
          const key = `${parseInt(hour)}h`;
          map[key] = (map[key] || 0) + 1;
        }),
      );
    return Object.entries(map).map(([hour, pedidos]) => ({ hour, pedidos }));
  }, [orders]);

  // ─── Tier de clientes ───
  const customersByTier = useMemo(() => {
    const tiers = { gold: 0, silver: 0, starter: 0, new: 0 };
    customers.forEach((c) => {
      const cOrders = orders.filter((o) => o.customer.cpf === c.cpf);
      const paid = cOrders.filter((o) => o.status === 'pago');
      const total = paid.reduce((s, o) => s + o.total, 0);
      const active = cOrders.filter((o) => o.status !== 'cancelado').length;
      if (total >= 500) tiers.gold += 1;
      else if (total >= 200) tiers.silver += 1;
      else if (active >= 1) tiers.starter += 1;
      else tiers.new += 1;
    });
    return [
      { name: 'Ouro (≥R$500)', value: tiers.gold, color: COLORS.amber },
      { name: 'Prata (≥R$200)', value: tiers.silver, color: COLORS.slate },
      { name: 'Iniciante', value: tiers.starter, color: COLORS.blue },
      { name: 'Novo (sem pedido)', value: tiers.new, color: COLORS.purple },
    ].filter((t) => t.value > 0);
  }, [customers, orders]);

  // ─── Margem por sabor ───
  const marginByFlavor = useMemo(() => {
    return menu
      .filter((m) => m.active)
      .map((m) => {
        let cost = 0;
        if (m.ingredients?.length) {
          (m.ingredients as RecipeIngredient[]).forEach((ing) => {
            const stk = stock.find((s) => s.id === ing.stockItemId);
            if (stk) cost += ingredientCost(ing, stk);
          });
        } else {
          cost = m.cost;
        }
        const profit = m.price - cost;
        const marginPct = m.price > 0 ? (profit / m.price) * 100 : 0;
        return {
          flavor: m.name,
          custo: Number(cost.toFixed(2)),
          venda: m.price,
          lucro: Number(profit.toFixed(2)),
          margem: Number(marginPct.toFixed(0)),
        };
      })
      .sort((a, b) => b.margem - a.margem);
  }, [menu, stock]);

  // ─── Compras: investido vs prejuízo ao longo dos ciclos ───
  const cycleHealth = useMemo(() => {
    const map: Record<
      string,
      { used: number; kept: number; prejuizo: number; pending: number }
    > = {};
    purchases.forEach((p) => {
      if (!map[p.productionDate]) {
        map[p.productionDate] = {
          used: 0,
          kept: 0,
          prejuizo: 0,
          pending: 0,
        };
      }
      const e = map[p.productionDate];
      if (p.status === 'used') e.used += p.totalCost;
      else if (p.status === 'kept') e.kept += p.totalCost;
      else if (p.status === 'personal' || p.status === 'discarded')
        e.prejuizo += p.totalCost;
      else e.pending += p.totalCost;
    });
    return Object.entries(map)
      .map(([date, v]) => ({
        date,
        label: formatDateBR(new Date(`${date}T12:00:00`)).slice(0, 5),
        Usado: v.used,
        Guardado: v.kept,
        Prejuízo: v.prejuizo,
        Pendente: v.pending,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
  }, [purchases]);

  if (loading) {
    return <p className="text-sm text-primary-500/60">Carregando dados…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/relatorios"
            className="text-xs text-primary-500/60 hover:text-primary-500"
          >
            ← Voltar pro Resumo
          </Link>
          <h1
            className="mt-1 text-3xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            BI · Inteligência de negócio
          </h1>
          <p className="text-sm text-primary-500/60">
            Painel visual com gráficos pra entender padrões e decidir.
          </p>
        </div>
      </header>

      <HelpBanner
        id="bi"
        title="BI"
        whenToFill="Você não preenche aqui. É só leitura. Atualiza sozinho conforme você usa o sistema."
        steps={[
          'Use os gráficos pra entender comportamento de venda, sabor mais procurado, horário de pico, perfil de cliente.',
          'Passe o mouse sobre cada gráfico pra ver os valores exatos.',
          'A linha do faturamento mostra os últimos 60 dias.',
          'Os ciclos mostram os últimos 12 domingos com seus destinos de compra.',
        ]}
        notes="Recharts é a biblioteca usada. Os gráficos são responsivos: tente abrir no celular pra confirmar."
      />

      {/* 7 KPIs principais (espelha o BI do Aurélio) */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
        <KPI label="Pedidos" value={kpis.totalPedidos.toString()} />
        <KPI label="Total Pizzas" value={kpis.totalPizzas.toString()} />
        <KPI label="Receita Total" value={formatBRL(kpis.receita)} tone="good" />
        <KPI label="Custo Total" value={formatBRL(kpis.custo)} />
        <KPI label="Lucro Total" value={formatBRL(kpis.lucro)} tone={kpis.lucro >= 0 ? 'good' : 'bad'} />
        <KPI label="Ticket Médio" value={formatBRL(kpis.ticketMedio)} />
        <KPI label="Food Cost %" value={`${kpis.foodCostPct.toFixed(1)}%`} tone={kpis.foodCostPct < 35 ? 'good' : kpis.foodCostPct < 50 ? 'warn' : 'bad'} />
      </section>

      {/* Pizzas por data/evento + Receita por categoria */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Pizzas por evento
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Total de pizzas vendidas em cada domingo.
          </p>
          {pizzasByDate.length === 0 ? (
            <p className="text-sm text-primary-500/60">Sem ciclos pagos ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pizzasByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="pizzas" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Receita por categoria
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Distribuição entre Clássicas e Especiais.
          </p>
          {revenueByCategory.length === 0 ? (
            <p className="text-sm text-primary-500/60">Sem receitas pagas ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {revenueByCategory.map((c, i) => (
                    <Cell key={c.name} fill={i === 0 ? COLORS.primary : COLORS.accent} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Faturamento ao longo do tempo */}
      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Faturamento por dia · últimos 60 dias
        </h3>
        <p className="mb-4 text-[11px] text-primary-500/60">
          Picos costumam ser nos domingos. Vales = dias sem produção.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueByDate} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={6} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v: number) => [`R$ ${v}`, 'Receita']}
              labelStyle={{ color: COLORS.primary }}
            />
            <Line
              type="monotone"
              dataKey="receita"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Saúde dos ciclos */}
      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Saúde dos ciclos · últimos 12 domingos
        </h3>
        <p className="mb-4 text-[11px] text-primary-500/60">
          Quanto foi consumido, guardado, perdido em prejuízo ou ainda
          pendente em cada ciclo.
        </p>
        {cycleHealth.length === 0 ? (
          <p className="text-sm text-primary-500/60">
            Nenhum ciclo de produção registrado ainda.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cycleHealth} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Usado" stackId="a" fill={COLORS.emerald} />
              <Bar dataKey="Guardado" stackId="a" fill={COLORS.blue} />
              <Bar dataKey="Prejuízo" stackId="a" fill={COLORS.rose} />
              <Bar dataKey="Pendente" stackId="a" fill={COLORS.amber} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Top sabores */}
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Pizzas mais vendidas
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Top 10 sabores em ordem de quantidade vendida.
          </p>
          {topFlavors.length === 0 ? (
            <p className="text-sm text-primary-500/60">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFlavors} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="flavor"
                  tick={{ fontSize: 10 }}
                  width={90}
                />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.accent} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição de custo por bloco */}
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Custo de produção por bloco
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Onde mais sai dinheiro de produção: massa, molho, cobertura ou
            operação.
          </p>
          {costByCategory.every((c) => c.value === 0) ? (
            <p className="text-sm text-primary-500/60">
              Sem custos calculados (faltam receitas vinculadas).
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {costByCategory.map((c) => (
                    <Cell key={c.cat} fill={CATEGORY_COLOR[c.cat]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Hora de pico */}
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Pedidos por horário
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Quando o forno fica mais ocupado.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="pedidos" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clientes por tier */}
        <div className="rounded-xl border border-primary-100 bg-white p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            Perfil dos clientes
          </h3>
          <p className="mb-4 text-[11px] text-primary-500/60">
            Distribuição por valor gasto histórico.
          </p>
          {customersByTier.length === 0 ? (
            <p className="text-sm text-primary-500/60">
              Nenhum cliente cadastrado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={customersByTier}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {customersByTier.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Margem por sabor */}
      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Margem por sabor
        </h3>
        <p className="mb-4 text-[11px] text-primary-500/60">
          Quanto cada sabor traz de lucro vs custo. Verde &gt;=50%, amarelo
          &gt;=30%, vermelho abaixo.
        </p>
        {marginByFlavor.length === 0 ? (
          <p className="text-sm text-primary-500/60">
            Nenhum sabor ativo no cardápio.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, marginByFlavor.length * 40)}>
            <BarChart data={marginByFlavor} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="flavor"
                tick={{ fontSize: 10 }}
                width={100}
              />
              <Tooltip
                formatter={(v: number, name: string) => {
                  if (name === 'margem') return [`${v}%`, 'Margem'];
                  return [`R$ ${v}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="custo" fill={COLORS.rose} />
              <Bar dataKey="lucro" fill={COLORS.emerald} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <p className="text-center text-[10px] text-primary-500/40">
        BI alimentado por Pedidos, Cardápio, Compras e Estoque · atualiza
        em tempo real conforme você usa o sistema.
      </p>
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
    </div>
  );
}
