'use client';

import { useEffect, useState } from 'react';
import {
  fetchAvailability,
  removeAvailability,
  upsertAvailability,
} from '@/lib/api';
import { type AvailableDate } from '@/lib/availability';
import { addDays, formatDateBR, formatDateISO } from '@/lib/utils';

const DEFAULT_CAPACITY = 8;
const WEEKS_AHEAD = 16;

function nextSundays(weeks: number): Date[] {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let cursor = new Date(start);
  while (out.length < weeks) {
    if (cursor.getDay() === 0) out.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

export default function DisponibilidadePage() {
  const [list, setList] = useState<AvailableDate[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability().then(setList).catch(() => setList([]));
  }, []);

  function notify() {
    setSavedNotice('Disponibilidade atualizada.');
    setTimeout(() => setSavedNotice(null), 2000);
  }

  async function toggleDate(iso: string) {
    const exists = list.find((a) => a.date === iso);
    if (exists) {
      await removeAvailability(iso);
      setList((prev) => prev.filter((a) => a.date !== iso));
    } else {
      const novo: AvailableDate = { date: iso, capacity: DEFAULT_CAPACITY, notes: '' };
      await upsertAvailability(novo);
      setList((prev) => [...prev, novo]);
    }
    notify();
  }

  async function updateCapacity(iso: string, cap: number) {
    const it = list.find((a) => a.date === iso);
    if (!it) return;
    const updated = { ...it, capacity: Math.max(1, cap) };
    await upsertAvailability(updated);
    setList((prev) => prev.map((a) => (a.date === iso ? updated : a)));
    notify();
  }

  async function updateNotes(iso: string, notes: string) {
    const it = list.find((a) => a.date === iso);
    if (!it) return;
    const updated = { ...it, notes };
    await upsertAvailability(updated);
    setList((prev) => prev.map((a) => (a.date === iso ? updated : a)));
    notify();
  }

  const sundays = nextSundays(WEEKS_AHEAD);
  const open = list
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1));

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
          Marque os domingos em que vai produzir. Só esses aparecem para
          reserva no site público.
        </p>
      </header>

      {savedNotice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
          ✓ {savedNotice}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Próximos {WEEKS_AHEAD} domingos
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {sundays.map((d) => {
            const iso = formatDateISO(d);
            const isOpen = list.some((a) => a.date === iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => toggleDate(iso)}
                className={
                  isOpen
                    ? 'rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-3 text-left'
                    : 'rounded-xl border border-primary-200 bg-white px-3 py-3 text-left hover:border-primary-500'
                }
              >
                <p className="text-xs uppercase tracking-widest text-primary-500/60">
                  {isOpen ? '✓ Aberto' : 'Fechado'}
                </p>
                <p
                  className="mt-1 text-base text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    fontWeight: 600,
                  }}
                >
                  {formatDateBR(d)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-primary-500/60">
          Datas abertas
        </h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-primary-500/60">
            Nenhuma data aberta. Clique nos domingos acima para abrir.
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((a) => (
              <li
                key={a.date}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
              >
                <span
                  className="flex-1 text-base text-primary-500"
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    fontWeight: 600,
                  }}
                >
                  {formatDateBR(new Date(`${a.date}T12:00:00`))}
                </span>
                <label className="flex items-center gap-2 text-xs text-primary-500/70">
                  Capacidade (pizzas)
                  <input
                    type="number"
                    min={1}
                    value={a.capacity}
                    onChange={(e) =>
                      updateCapacity(a.date, parseInt(e.target.value) || 1)
                    }
                    className="w-16 rounded-md border border-primary-200 bg-white px-2 py-1 text-sm"
                  />
                </label>
                <input
                  type="text"
                  value={a.notes ?? ''}
                  onChange={(e) => updateNotes(a.date, e.target.value)}
                  placeholder="Observações (ex: edição especial)"
                  className="flex-1 min-w-[180px] rounded-md border border-primary-200 bg-white px-3 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleDate(a.date)}
                  className="rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
                >
                  Fechar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
