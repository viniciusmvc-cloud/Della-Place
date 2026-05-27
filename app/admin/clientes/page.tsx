'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createAdminOrder,
  fetchAvailability,
  fetchBookedSlots,
  fetchCustomers,
  fetchMenu,
  fetchOrders,
} from '@/lib/api';
import { generateSlots, type AvailableDate } from '@/lib/availability';
import { formatBRL, titleCase } from '@/lib/format';
import { type MenuItem } from '@/lib/menu';
import { newOrderId, type Order, type StoredCustomer } from '@/lib/orders';
import { formatDateBR, formatDateISO } from '@/lib/utils';

const DAY = 1000 * 60 * 60 * 24;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function firstLetter(name: string) {
  const ch = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

export default function ClientesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [letter, setLetter] = useState<string | null>(null);
  const [selectedCpf, setSelectedCpf] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([fetchOrders().catch(() => []), fetchCustomers().catch(() => [])])
      .then(([o, c]) => {
        setOrders(o);
        setCustomers(c);
      });
  }, [tick]);

  const enriched = useMemo(() => {
    return customers
      .map((c) => {
        const cOrders = orders.filter((o) => o.customer.cpf === c.cpf);
        const active = cOrders.filter((o) => o.status !== 'cancelado');
        const paid = cOrders.filter((o) => o.status === 'pago');
        const totalPizzas = active.reduce(
          (sum, o) => sum + o.items.length,
          0,
        );
        const totalSpent = paid.reduce((s, o) => s + o.total, 0);

        const flavorCount: Record<string, number> = {};
        active.forEach((o) =>
          o.items.forEach(
            (it) => (flavorCount[it.flavor] = (flavorCount[it.flavor] || 0) + 1),
          ),
        );
        const favoriteFlavor =
          Object.entries(flavorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

        const lastDate =
          active
            .map((o) => o.date)
            .sort()
            .reverse()[0] ?? '';
        const daysSince = lastDate
          ? Math.floor(
              (Date.now() - new Date(`${lastDate}T12:00:00`).getTime()) / DAY,
            )
          : Infinity;

        const monthSpan = (() => {
          if (active.length < 2) return 1;
          const dates = active.map((o) => new Date(`${o.date}T12:00:00`).getTime()).sort();
          const span = (dates[dates.length - 1] - dates[0]) / (DAY * 30);
          return Math.max(span, 1);
        })();
        const frequency = active.length / monthSpan;

        const tier =
          totalSpent >= 500
            ? 'gold'
            : totalSpent >= 200
              ? 'silver'
              : active.length >= 1
                ? 'starter'
                : 'new';

        return {
          customer: c,
          ordersCount: active.length,
          totalPizzas,
          totalSpent,
          favoriteFlavor,
          lastDate,
          daysSince,
          frequency,
          tier,
        };
      })
      .filter(
        (e) =>
          search.trim() === '' ||
          e.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
          e.customer.cpf.includes(search) ||
          e.customer.phone.includes(search),
      )
      .filter(
        (e) => letter === null || firstLetter(e.customer.fullName) === letter,
      )
      .sort((a, b) =>
        letter
          ? a.customer.fullName.localeCompare(b.customer.fullName, 'pt-BR')
          : b.totalSpent - a.totalSpent,
      );
  }, [customers, orders, search, letter]);

  const lettersWithCustomers = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => set.add(firstLetter(c.fullName)));
    return set;
  }, [customers]);

  const top5 = enriched.slice(0, 5);
  const inactive = enriched.filter(
    (e) => e.daysSince !== Infinity && e.daysSince >= 30,
  );
  const newOnes = enriched.filter((e) => e.ordersCount <= 1);

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Clientes
        </h1>
        <p className="text-sm text-primary-500/60">
          CRM com histórico, frequência, sabor favorito e alertas.
        </p>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, CPF ou telefone…"
        className="w-full rounded-md border border-primary-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary-500 md:max-w-md"
      />

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-primary-100 bg-white p-2">
        <button
          type="button"
          onClick={() => setLetter(null)}
          className={
            letter === null
              ? 'rounded bg-primary-500 px-2.5 py-1 text-[11px] font-medium text-white'
              : 'rounded px-2.5 py-1 text-[11px] text-primary-500/70 hover:bg-primary-50 hover:text-primary-500'
          }
          title="Mostrar todos os clientes"
        >
          Todos
        </button>
        <span className="mx-1 h-4 w-px bg-primary-100" />
        {ALPHABET.map((L) => {
          const has = lettersWithCustomers.has(L);
          const active = letter === L;
          return (
            <button
              key={L}
              type="button"
              disabled={!has}
              onClick={() => setLetter(active ? null : L)}
              className={
                active
                  ? 'rounded bg-primary-500 px-2 py-1 text-[11px] font-medium text-white'
                  : has
                    ? 'rounded px-2 py-1 text-[11px] text-primary-500/80 hover:bg-primary-50 hover:text-primary-500'
                    : 'cursor-not-allowed rounded px-2 py-1 text-[11px] text-primary-500/25'
              }
              title={has ? `Filtrar por ${L}` : `Sem clientes em ${L}`}
            >
              {L}
            </button>
          );
        })}
        {lettersWithCustomers.has('#') && (
          <button
            type="button"
            onClick={() => setLetter(letter === '#' ? null : '#')}
            className={
              letter === '#'
                ? 'rounded bg-primary-500 px-2 py-1 text-[11px] font-medium text-white'
                : 'rounded px-2 py-1 text-[11px] text-primary-500/80 hover:bg-primary-50 hover:text-primary-500'
            }
            title="Outros (sem letra)"
          >
            #
          </button>
        )}
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Alert
          tone="gold"
          icon="🏆"
          title="Top clientes"
          empty="Sem dados ainda"
          items={top5.slice(0, 3).map(
            (e) => `${e.customer.fullName} — R$ ${e.totalSpent}`,
          )}
        />
        <Alert
          tone="warn"
          icon="🔔"
          title="Inativos (30+ dias)"
          empty="Nenhum cliente inativo"
          items={inactive.slice(0, 3).map(
            (e) => `${e.customer.fullName} — ${e.daysSince}d sem comprar`,
          )}
        />
        <Alert
          tone="info"
          icon="🆕"
          title="Novos clientes"
          empty="Nenhum novo cliente"
          items={newOnes.slice(0, 3).map(
            (e) =>
              `${e.customer.fullName} — ${e.ordersCount === 0 ? 'sem pedido ainda' : '1º pedido'}`,
          )}
        />
      </section>

      {selectedCpf && (
        <CustomerDrawer
          cpf={selectedCpf}
          orders={orders.filter((o) => o.customer.cpf === selectedCpf)}
          onClose={() => setSelectedCpf(null)}
          onSaved={() => {
            setTick((t) => t + 1);
          }}
        />
      )}

      {enriched.length === 0 ? (
        <p className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-primary-500/60">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-primary-50/60 text-left text-xs uppercase tracking-widest text-primary-500/60">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2 text-right">Pizzas</th>
                <th className="px-3 py-2 text-right">Gasto</th>
                <th className="px-3 py-2 text-center">Freq./mês</th>
                <th className="px-3 py-2">Favorito</th>
                <th className="px-3 py-2">Última</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((e) => (
                <tr key={e.customer.cpf} className="border-t border-primary-100 align-top">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCpf(e.customer.cpf)}
                      className="font-medium text-primary-500 hover:underline"
                    >
                      {e.customer.fullName}
                    </button>
                    <p className="text-[11px] text-primary-500/60">
                      <a
                        href={`https://wa.me/55${e.customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir conversa no WhatsApp"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.45 3.43 1.32 4.93L2 22l5.32-1.4a9.92 9.92 0 0 0 4.72 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7.01A9.83 9.83 0 0 0 12.04 2zm0 1.81c2.16 0 4.18.84 5.71 2.36a8.07 8.07 0 0 1 2.37 5.74c0 4.46-3.62 8.09-8.08 8.09-1.49 0-2.93-.4-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.04 8.04 0 0 1-1.23-4.24c0-4.46 3.62-8.1 8.08-8.1z" />
                        </svg>
                        {e.customer.phone}
                      </a>
                      {' · '}{e.customer.cpf}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <TierBadge tier={e.tier} />
                  </td>
                  <td className="px-3 py-2 text-right">{e.totalPizzas}</td>
                  <td className="px-3 py-2 text-right font-medium text-primary-500">
                    R$ {e.totalSpent}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-primary-500/70">
                    {e.frequency.toFixed(1)}x
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/80">
                    {e.favoriteFlavor}
                  </td>
                  <td className="px-3 py-2 text-xs text-primary-500/70">
                    {e.lastDate
                      ? `${formatDateBR(new Date(`${e.lastDate}T12:00:00`))} (${e.daysSince}d)`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Alert({
  tone,
  icon,
  title,
  items,
  empty,
}: {
  tone: 'gold' | 'warn' | 'info';
  icon: string;
  title: string;
  items: string[];
  empty: string;
}) {
  const cls =
    tone === 'gold'
      ? 'border-amber-200 bg-amber-50'
      : tone === 'warn'
        ? 'border-rose-200 bg-rose-50'
        : 'border-blue-200 bg-blue-50';
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary-500/70">
        {icon} {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-primary-500/50">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm text-primary-500/85">
          {items.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CustomerDrawer({
  cpf,
  orders,
  onClose,
  onSaved,
}: {
  cpf: string;
  orders: Order[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<{
    cpf: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
    blockApt: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [view, setView] = useState<'detail' | 'new-order'>('detail');

  useEffect(() => {
    fetch(`/api/customers/${encodeURIComponent(cpf)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => onClose());
  }, [cpf, onClose]);

  async function save() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Normaliza telefone pra digits-only antes de salvar (consistente com
      // migration v13 que normalizou todos os existentes).
      const normalizedPhone = data.phone.replace(/\D/g, '');
      const res = await fetch(`/api/customers/${encodeURIComponent(cpf)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: normalizedPhone,
          email: data.email,
          address: data.address,
          blockApt: data.blockApt,
        }),
      });
      if (!res.ok) {
        let msg = `Erro ao salvar (${res.status})`;
        try {
          const body = await res.text();
          // Erro de UNIQUE no telefone vira "Duplicate entry"
          if (/duplicate entry|ER_DUP_ENTRY/i.test(body)) {
            msg =
              'Esse telefone já está cadastrado em outro cliente. Verifique o número.';
          } else if (body) {
            msg = `Erro: ${body.slice(0, 200)}`;
          }
        } catch {
          // ignore
        }
        setSaveError(msg);
        return;
      }
      // Atualiza state local com o telefone normalizado pra refletir na UI
      setData({ ...data, phone: normalizedPhone });
      setSaveSuccess(true);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro de rede.');
    } finally {
      setSaving(false);
    }
  }

  const totalGasto = orders
    .filter((o) => o.status === 'pago')
    .reduce((s, o) => s + o.total, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-primary-100 bg-white p-6 shadow-2xl"
      >
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
              Cliente · {cpf}
            </p>
            <h2
              className="text-2xl italic text-primary-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              {data?.fullName ?? 'Carregando…'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-primary-500/60 hover:text-primary-500"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        {data && (
          <>
            <section className="mb-5 grid gap-3 md:grid-cols-2">
              <Field label="Nome completo" value={data.fullName} onChange={(v) => setData({ ...data, fullName: v })} />
              <Field label="Telefone" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} placeholder="(71) 99999-9999" />
              <Field label="Email (opcional)" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
              <Field label="Bloco/apto" value={data.blockApt} onChange={(v) => setData({ ...data, blockApt: v })} placeholder="Ex: Apto 302" />
            </section>

            <section className="mb-5">
              <Field
                label="Endereço completo"
                value={data.address}
                onChange={(v) => setData({ ...data, address: v })}
              />
            </section>

            <section className="mb-5 rounded-xl border border-primary-100 bg-white p-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-primary-500/60">
                Histórico
              </p>
              <p className="text-sm text-primary-500">
                {orders.length} pedido{orders.length === 1 ? '' : 's'} · Total
                pago: <strong>{formatBRL(totalGasto)}</strong>
              </p>
              {orders.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-primary-500/80">
                  {orders.slice(0, 10).map((o) => (
                    <li key={o.id}>
                      {formatDateBR(new Date(`${o.date}T12:00:00`))} ·{' '}
                      {o.items.map((it) => titleCase(it.flavor)).join(', ')} ·{' '}
                      {formatBRL(o.total)} · <em>{o.status}</em>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {view === 'detail' && (
              <>
                {saveError && (
                  <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    ❌ {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    ✓ Dados salvos com sucesso.
                  </div>
                )}
                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-primary-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setView('new-order')}
                    className="rounded-full border border-emerald-300 bg-emerald-50/70 px-5 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100"
                  >
                    🍕 Novo pedido pra esse cliente
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {saving ? 'Salvando…' : '✓ Salvar dados'}
                    </button>
                  </div>
                </footer>
              </>
            )}

            {view === 'new-order' && (
              <NewOrderInline
                customer={{
                  cpf: data.cpf,
                  fullName: data.fullName,
                  phone: data.phone,
                  email: data.email,
                  address: data.address,
                  blockApt: data.blockApt,
                }}
                onBack={() => setView('detail')}
                onCreated={() => {
                  setView('detail');
                  onSaved();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Lançamento manual de pedido pelo admin
// (ex: cliente pediu via WhatsApp; Aurélio lança aqui pelo painel)
// ─────────────────────────────────────────────────────────────────
function NewOrderInline({
  customer,
  onBack,
  onCreated,
}: {
  customer: StoredCustomer;
  onBack: () => void;
  onCreated: () => void;
}) {
  const [availabilities, setAvailabilities] = useState<AvailableDate[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [dateIso, setDateIso] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [flavor, setFlavor] = useState<string>('');
  const [finish, setFinish] = useState<'Assada' | 'Congelada'>('Assada');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAvailability().catch(() => [] as AvailableDate[]),
      fetchMenu().catch(() => [] as MenuItem[]),
    ]).then(([av, m]) => {
      const today = formatDateISO(new Date());
      const future = av.filter((a) => a.date >= today);
      setAvailabilities(future);
      setMenu(m.filter((mi) => mi.active));
      if (future.length > 0) setDateIso(future[0].date);
    });
  }, []);

  useEffect(() => {
    if (!dateIso) return;
    let cancelled = false;
    fetchBookedSlots(dateIso)
      .then((slots) => !cancelled && setBookedSlots(slots))
      .catch(() => !cancelled && setBookedSlots([]));
    return () => {
      cancelled = true;
    };
  }, [dateIso]);

  const dayConfig = availabilities.find((a) => a.date === dateIso);
  const availableFlavors = useMemo(() => {
    if (!dayConfig?.flavorIds || dayConfig.flavorIds.length === 0) return menu;
    const allowed = new Set(dayConfig.flavorIds);
    return menu.filter((m) => allowed.has(m.id));
  }, [dayConfig, menu]);

  // Slots disponíveis = generateSlots − bookedSlots
  const freeSlots = useMemo(() => {
    if (!dayConfig) return [];
    const all = generateSlots(dayConfig.startHour, dayConfig.capacity);
    const booked = new Set(bookedSlots);
    return all.filter((s) => !booked.has(s));
  }, [dayConfig, bookedSlots]);

  useEffect(() => {
    // Auto-seleciona o primeiro slot livre quando muda a data
    if (freeSlots.length > 0 && !freeSlots.includes(time)) {
      setTime(freeSlots[0]);
    }
  }, [freeSlots, time]);

  useEffect(() => {
    if (availableFlavors.length > 0 && !availableFlavors.some((m) => m.name === flavor)) {
      setFlavor(availableFlavors[0].name);
    }
  }, [availableFlavors, flavor]);

  const price = menu.find((m) => m.name === flavor)?.price ?? 0;
  const canSubmit = !!dateIso && !!time && !!flavor && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const order: Order = {
        id: newOrderId(),
        createdAt: new Date().toISOString(),
        date: dateIso,
        customer,
        items: [{ time, flavor, finish, price }],
        total: price,
        notes: 'Pedido lançado manualmente pelo admin (cliente pediu por WhatsApp).',
        status: 'pendente',
      };
      await createAdminOrder(order);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (availabilities.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">
          ⚠️ Não há datas de produção abertas no calendário.
        </p>
        <p>
          Antes de criar um pedido manual, abra um domingo em{' '}
          <strong>Disponibilidade</strong>.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-amber-300 px-4 py-1.5 text-xs text-amber-800 hover:bg-amber-100"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
        <p className="text-[10px] uppercase tracking-widest text-emerald-700">
          Novo pedido para
        </p>
        <p className="text-sm font-medium text-primary-500">
          {customer.fullName} · {customer.phone}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
          📅 Data de produção
        </span>
        <select
          value={dateIso}
          onChange={(e) => setDateIso(e.target.value)}
          className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
        >
          {availabilities.map((a) => (
            <option key={a.date} value={a.date}>
              {formatDateBR(new Date(`${a.date}T12:00:00`))} · início{' '}
              {a.startHour} · {a.capacity} pizzas
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
          ⏰ Horário (slots livres)
        </span>
        {freeSlots.length === 0 ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
            Nenhum horário livre nesse dia. Escolha outra data.
          </p>
        ) : (
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
          >
            {freeSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            🍕 Sabor
          </span>
          <select
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
          >
            {availableFlavors.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} — {formatBRL(m.price)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            Acabamento
          </span>
          <select
            value={finish}
            onChange={(e) =>
              setFinish(e.target.value as 'Assada' | 'Congelada')
            }
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm"
          >
            <option value="Assada">Assada</option>
            <option value="Congelada">Congelada</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-primary-100 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || freeSlots.length === 0}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Criando…' : `🍕 Criar pedido · ${formatBRL(price)}`}
        </button>
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    gold: 'bg-amber-100 text-amber-800',
    silver: 'bg-slate-100 text-slate-800',
    starter: 'bg-blue-100 text-blue-800',
    new: 'bg-primary-100 text-primary-700',
  };
  const label: Record<string, string> = {
    gold: 'Ouro',
    silver: 'Prata',
    starter: 'Iniciante',
    new: 'Novo',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] ${map[tier]}`}>
      {label[tier]}
    </span>
  );
}
