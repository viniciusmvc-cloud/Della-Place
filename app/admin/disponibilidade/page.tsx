'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchAvailability,
  fetchCustomers,
  fetchMenu,
  removeAvailability,
  sendPushNotification,
  upsertAvailability,
} from '@/lib/api';
import {
  DEFAULT_CAPACITY,
  DEFAULT_START_HOUR,
  type AvailableDate,
} from '@/lib/availability';
import { type MenuItem } from '@/lib/menu';
import { type StoredCustomer } from '@/lib/orders';
import {
  cn,
  endOfMonth,
  formatDateBR,
  formatDateISO,
  startOfDay,
  startOfMonth,
} from '@/lib/utils';
import {
  broadcastWhatsAppLink,
  buildBroadcastMessage,
} from '@/lib/whatsapp-broadcast';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Draft = {
  date: string;
  capacity: number;
  startHour: string;
  notes: string;
  exists: boolean;
};

export default function DisponibilidadePage() {
  const [list, setList] = useState<AvailableDate[]>([]);
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [broadcastFor, setBroadcastFor] = useState<AvailableDate | null>(null);
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAvailability().catch(() => []),
      fetchCustomers().catch(() => []),
      fetchMenu().catch(() => []),
    ]).then(([av, cust, m]) => {
      setList(av);
      setCustomers(cust);
      setMenu(m.filter((x) => x.active));
    });
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, AvailableDate>();
    list.forEach((a) => m.set(a.date, a));
    return m;
  }, [list]);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const leadingBlanks = first.getDay();
    const out: (Date | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) out.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return out;
  }, [cursor]);

  const today = startOfDay(new Date());

  function notify(msg: string) {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2200);
  }

  function openDay(date: Date) {
    const iso = formatDateISO(date);
    const existing = byDate.get(iso);
    setError(null);
    setDraft({
      date: iso,
      capacity: existing?.capacity ?? DEFAULT_CAPACITY,
      startHour: existing?.startHour ?? DEFAULT_START_HOUR,
      notes: existing?.notes ?? '',
      exists: !!existing,
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const payload: AvailableDate = {
      date: draft.date,
      capacity: Math.max(1, draft.capacity),
      startHour: draft.startHour,
      notes: draft.notes,
    };
    try {
      await upsertAvailability(payload);
      setList((prev) => {
        const others = prev.filter((a) => a.date !== draft.date);
        return [...others, payload].sort((a, b) => a.date.localeCompare(b.date));
      });
      setDraft(null);
      notify(draft.exists ? 'Data atualizada.' : 'Data aberta.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function closeDate() {
    if (!draft || !draft.exists) return;
    try {
      await removeAvailability(draft.date);
      setList((prev) => prev.filter((a) => a.date !== draft.date));
      setDraft(null);
      notify('Data fechada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function goPrev() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }
  function goNext() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }
  function goToday() {
    setCursor(startOfMonth(new Date()));
  }

  const open = list.slice().sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Disponibilidade
        </h1>
        <p className="text-sm text-primary-500/60">
          Clique em qualquer dia para abrir, fechar ou editar capacidade e
          horário de início. Domingo é o padrão, mas você pode produzir em
          qualquer data.
        </p>
      </header>

      {savedNotice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
          ✓ {savedNotice}
        </p>
      )}

      <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Mês anterior"
            className="rounded-md px-3 py-1 text-primary-500 hover:bg-primary-50"
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            <span
              className="text-lg italic text-primary-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full border border-primary-200 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
            >
              Hoje
            </button>
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Próximo mês"
            className="rounded-md px-3 py-1 text-primary-500 hover:bg-primary-50"
          >
            ›
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-widest text-primary-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`b-${idx}`} className="aspect-square" />;
            const iso = formatDateISO(date);
            const config = byDate.get(iso);
            const isToday = iso === formatDateISO(today);
            const isPast = date < today;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => openDay(date)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-md border p-1 text-sm transition-colors',
                  isPast && !config && 'border-primary-100 bg-primary-50/30 text-primary-300',
                  !isPast && !config && 'border-primary-100 bg-white text-primary-500 hover:border-primary-500',
                  config && 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:border-emerald-500',
                  isToday && !config && 'ring-1 ring-accent-500',
                )}
              >
                <span
                  className={
                    config
                      ? 'text-base font-semibold'
                      : 'text-base'
                  }
                >
                  {date.getDate()}
                </span>
                {config && (
                  <span className="mt-0.5 text-[9px] leading-tight">
                    {config.startHour} · {config.capacity}p
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-primary-500/60">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />
            Aberto
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm border border-primary-300 bg-white" />
            Fechado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm border border-accent-500 bg-white" />
            Hoje
          </span>
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Datas abertas ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-primary-500/60">
            Nenhuma data aberta. Clique em um dia no calendário acima para abrir.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {open.map((a) => (
              <li
                key={a.date}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
              >
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-base text-primary-500"
                    style={{
                      fontFamily: 'var(--font-cormorant), Georgia, serif',
                      fontWeight: 600,
                    }}
                  >
                    {formatDateBR(new Date(`${a.date}T12:00:00`))}
                  </span>
                  <span className="text-[11px] text-primary-500/70">
                    início {a.startHour} · {a.capacity} pizzas
                    {a.notes && ` · ${a.notes}`}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setBroadcastFor(a)}
                    className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-700 hover:border-emerald-500"
                    title="Mandar WhatsApp pré-formatado para todos os clientes"
                  >
                    📣 Avisar clientes
                  </button>
                  <button
                    type="button"
                    onClick={() => openDay(new Date(`${a.date}T12:00:00`))}
                    className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft && (
        <DayModal
          draft={draft}
          onChange={setDraft}
          onSave={saveDraft}
          onClose={() => {
            setDraft(null);
            setError(null);
          }}
          onDelete={closeDate}
          error={error}
        />
      )}

      {broadcastFor && (
        <BroadcastSheet
          availability={broadcastFor}
          customers={customers}
          menu={menu}
          onClose={() => setBroadcastFor(null)}
        />
      )}
    </div>
  );
}

function BroadcastSheet({
  availability,
  customers,
  menu,
  onClose,
}: {
  availability: AvailableDate;
  customers: StoredCustomer[];
  menu: MenuItem[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [pushTitle, setPushTitle] = useState('Della Pace está aberta!');
  const [pushBody, setPushBody] = useState('');
  const [pushState, setPushState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle');
  const [pushResult, setPushResult] = useState<string | null>(null);

  useEffect(() => {
    const dateLabel = new Date(`${availability.date}T12:00:00`).toLocaleDateString(
      'pt-BR',
      { weekday: 'long', day: '2-digit', month: 'long' },
    );
    setPushBody(
      `Nova edição em ${dateLabel}, início ${availability.startHour}. Reserve no site.`,
    );
  }, [availability.date, availability.startHour]);

  async function handleSendPush() {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushState('sending');
    setPushResult(null);
    try {
      const res = await sendPushNotification({
        title: pushTitle.trim(),
        body: pushBody.trim(),
        url: '/',
        tag: `da-${availability.date}`,
      });
      setPushState('sent');
      setPushResult(
        `Enviado para ${res.success}/${res.total} dispositivos${
          res.gone > 0 ? ` (${res.gone} expirados removidos)` : ''
        }${res.failed > 0 ? ` · ${res.failed} falharam` : ''}.`,
      );
    } catch (err) {
      setPushState('error');
      setPushResult(err instanceof Error ? err.message : String(err));
    }
  }

  const sortable = useMemo(
    () =>
      customers
        .filter((c) => (c.phone ?? '').replace(/\D/g, '').length >= 10)
        .filter(
          (c) =>
            search.trim() === '' ||
            c.fullName.toLowerCase().includes(search.toLowerCase()),
        )
        .slice()
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR')),
    [customers, search],
  );

  const dateLabel = formatDateBR(new Date(`${availability.date}T12:00:00`));
  const sampleMessage =
    sortable.length > 0
      ? buildBroadcastMessage({
          customer: sortable[0],
          date: availability.date,
          startHour: availability.startHour,
          menu,
          notes: availability.notes,
        })
      : null;

  function markSent(cpf: string) {
    setSentSet((prev) => {
      const next = new Set(prev);
      next.add(cpf);
      return next;
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-xl"
      >
        <header className="border-b border-primary-100 p-5">
          <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
            Avisar clientes via WhatsApp
          </p>
          <h2
            className="text-2xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            {dateLabel} · início {availability.startHour}
          </h2>
          <p className="mt-1 text-xs text-primary-500/60">
            Cada botão abre o WhatsApp da pessoa com a mensagem já pronta.
            Você só precisa apertar enviar.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-800">
              🔔 Push para todo mundo (1 clique)
            </p>
            <p className="mb-3 text-[11px] text-amber-900/80">
              Notifica de uma vez todos os clientes que aceitaram receber
              avisos no celular. Use textos curtos.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                maxLength={80}
                placeholder="Título"
                className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                maxLength={240}
                rows={2}
                placeholder="Mensagem curta"
                className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendPush}
                  disabled={pushState === 'sending'}
                  className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {pushState === 'sending' ? 'Enviando…' : 'Enviar push agora'}
                </button>
                {pushResult && (
                  <span
                    className={
                      pushState === 'sent'
                        ? 'text-[11px] text-emerald-700'
                        : 'text-[11px] text-rose-700'
                    }
                  >
                    {pushResult}
                  </span>
                )}
              </div>
            </div>
          </section>

          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
            WhatsApp por cliente (mensagem completa)
          </p>

          {sampleMessage && (
            <details className="mb-4 rounded-lg border border-primary-100 bg-primary-50/30 p-3">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-primary-500/70">
                Pré-visualizar mensagem
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 text-[11px] leading-relaxed text-primary-500">
                {sampleMessage}
              </pre>
            </details>
          )}

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome…"
            className="mb-3 w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />

          {sortable.length === 0 ? (
            <p className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-primary-500/60">
              Nenhum cliente com WhatsApp no cadastro.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortable.map((c) => {
                const sent = sentSet.has(c.cpf);
                const link = broadcastWhatsAppLink({
                  customer: c,
                  date: availability.date,
                  startHour: availability.startHour,
                  menu,
                  notes: availability.notes,
                });
                return (
                  <li
                    key={c.cpf}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3',
                      sent
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-primary-100 bg-white',
                    )}
                  >
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-primary-500">
                        {c.fullName}
                      </span>
                      <span className="text-[11px] text-primary-500/60">
                        {c.phone}
                      </span>
                    </div>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markSent(c.cpf)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs',
                        sent
                          ? 'border border-emerald-300 bg-white text-emerald-700'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600',
                      )}
                    >
                      {sent ? '✓ Enviado' : '📨 Abrir WhatsApp'}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-primary-100 p-4">
          <p className="text-[11px] text-primary-500/60">
            {sentSet.size} de {sortable.length} marcados como enviados
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-primary-200 px-4 py-1.5 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

function DayModal({
  draft,
  onChange,
  onSave,
  onClose,
  onDelete,
  error,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
  error: string | null;
}) {
  const dateLabel = formatDateBR(new Date(`${draft.date}T12:00:00`));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-6 shadow-xl"
      >
        <header className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
            {draft.exists ? 'Editar data' : 'Abrir nova data'}
          </p>
          <h2
            className="text-2xl italic text-primary-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            {dateLabel}
          </h2>
        </header>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Horário do primeiro pedido
            </span>
            <input
              type="time"
              step={900}
              value={draft.startHour}
              onChange={(e) => onChange({ ...draft, startHour: e.target.value })}
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
            <p className="mt-1 text-[10px] text-primary-500/60">
              Slots de 15 em 15 min começam neste horário e vão até 23:00.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Capacidade (pizzas no dia)
            </span>
            <input
              type="number"
              min={1}
              value={draft.capacity}
              onChange={(e) =>
                onChange({
                  ...draft,
                  capacity: parseInt(e.target.value) || 1,
                })
              }
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Observações (opcional)
            </span>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => onChange({ ...draft, notes: e.target.value })}
              placeholder="Edição especial, fornada extra…"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>

        <footer className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm text-white hover:bg-primary-600"
          >
            {draft.exists ? 'Salvar' : 'Abrir data'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-primary-200 px-4 py-2 text-sm text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
          >
            Cancelar
          </button>
          {draft.exists && (
            <>
              <span className="ml-auto" />
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:border-rose-500"
              >
                Fechar data
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
