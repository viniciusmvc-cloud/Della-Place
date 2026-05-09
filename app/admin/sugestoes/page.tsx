'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deleteSuggestion,
  fetchSuggestions,
  updateSuggestionStatus,
  type Suggestion,
  type SuggestionStatus,
} from '@/lib/api';

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  new: 'Nova',
  read: 'Lida',
  done: 'Resolvida',
  archived: 'Arquivada',
};

const STATUS_TONE: Record<SuggestionStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  read: 'bg-blue-100 text-blue-800',
  done: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-700',
};

const FILTERS: Array<{ key: SuggestionStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'new', label: 'Novas' },
  { key: 'read', label: 'Lidas' },
  { key: 'done', label: 'Resolvidas' },
  { key: 'archived', label: 'Arquivadas' },
];

export default function SugestoesPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchSuggestions();
      setItems(list);
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

  const counts = useMemo(() => {
    const c: Record<SuggestionStatus | 'all', number> = {
      all: items.length,
      new: 0,
      read: 0,
      done: 0,
      archived: 0,
    };
    items.forEach((s) => (c[s.status] += 1));
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((s) => s.status === filter)),
    [items, filter],
  );

  async function changeStatus(id: number, status: SuggestionStatus) {
    setBusyId(id);
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await updateSuggestionStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!confirm('Apagar esta sugestão? Essa ação não pode ser desfeita.')) return;
    setBusyId(id);
    try {
      await deleteSuggestion(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Sugestões
        </h1>
        <p className="text-sm text-primary-500/60">
          O que os clientes sugerem pelo site. Clique no status para mudar.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-full border border-primary-200 bg-white p-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                active
                  ? 'rounded-full bg-primary-500 px-3 py-1 text-xs text-white'
                  : 'rounded-full px-3 py-1 text-xs text-primary-500/70 hover:text-primary-500'
              }
            >
              {f.label}{' '}
              <span
                className={
                  active
                    ? 'ml-1 rounded-full bg-white/20 px-1.5 text-[10px]'
                    : 'ml-1 rounded-full bg-primary-100 px-1.5 text-[10px] text-primary-500/70'
                }
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-primary-500/60">Carregando…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-primary-100 bg-white p-10 text-center text-sm text-primary-500/60">
          {filter === 'all'
            ? 'Nenhuma sugestão recebida ainda.'
            : 'Nenhuma sugestão neste filtro.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm"
            >
              <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary-500">{s.name}</p>
                  <p className="text-[11px] text-primary-500/60">
                    {new Date(s.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {s.email && (
                      <>
                        {' · '}
                        <a
                          href={`mailto:${s.email}`}
                          className="text-primary-500 hover:underline"
                        >
                          {s.email}
                        </a>
                      </>
                    )}
                    {s.phone && (
                      <>
                        {' · '}
                        <a
                          href={`https://wa.me/55${s.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {s.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[s.status]}`}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </header>

              <p className="whitespace-pre-wrap text-sm text-primary-500/90">
                {s.message}
              </p>

              <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary-100 pt-3">
                {(['new', 'read', 'done', 'archived'] as SuggestionStatus[]).map(
                  (status) => {
                    const active = s.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={busyId === s.id || active}
                        onClick={() => changeStatus(s.id, status)}
                        className={
                          active
                            ? 'cursor-default rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-[11px] text-primary-500'
                            : 'rounded-full border border-primary-200 px-3 py-1 text-[11px] text-primary-500/70 hover:border-primary-500 hover:text-primary-500 disabled:opacity-40'
                        }
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    );
                  },
                )}
                <span className="ml-auto" />
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => remove(s.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-600 hover:border-rose-500 disabled:opacity-40"
                >
                  Apagar
                </button>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
