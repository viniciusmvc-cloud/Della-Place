'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchAvailability,
  removeAvailability,
  upsertAvailability,
} from '@/lib/api';
import {
  DEFAULT_CAPACITY,
  DEFAULT_START_HOUR,
  type AvailableDate,
} from '@/lib/availability';
import {
  cn,
  endOfMonth,
  formatDateBR,
  formatDateISO,
  startOfDay,
  startOfMonth,
} from '@/lib/utils';

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
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability()
      .then((rows) => setList(rows))
      .catch(() => setList([]));
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
                <button
                  type="button"
                  onClick={() => openDay(new Date(`${a.date}T12:00:00`))}
                  className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
                >
                  Editar
                </button>
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
