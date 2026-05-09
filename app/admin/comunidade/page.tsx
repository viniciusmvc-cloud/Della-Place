'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deleteCommunityPost,
  fetchCommunityPosts,
  updateCommunityPost,
  type CommunityPost,
  type CommunityPostStatus,
} from '@/lib/api';

const STATUS_LABEL: Record<CommunityPostStatus, string> = {
  pending: 'Aguardando',
  approved: 'Aprovado',
  hidden: 'Oculto',
};

const STATUS_TONE: Record<CommunityPostStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  hidden: 'bg-slate-100 text-slate-700',
};

const FILTERS: Array<{ key: CommunityPostStatus | 'all'; label: string }> = [
  { key: 'pending', label: 'Aguardando' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'hidden', label: 'Ocultos' },
  { key: 'all', label: 'Todos' },
];

export default function ComunidadePage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<CommunityPostStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchCommunityPosts();
      setPosts(list);
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
    const c: Record<CommunityPostStatus | 'all', number> = {
      all: posts.length,
      pending: 0,
      approved: 0,
      hidden: 0,
    };
    posts.forEach((p) => (c[p.status] += 1));
    return c;
  }, [posts]);

  const visible = useMemo(
    () => (filter === 'all' ? posts : posts.filter((p) => p.status === filter)),
    [posts, filter],
  );

  async function changeStatus(id: number, status: CommunityPostStatus) {
    setBusyId(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await updateCommunityPost(id, { status });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleHero(id: number, showInHero: boolean) {
    setBusyId(id);
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, showInHero } : p)),
    );
    try {
      await updateCommunityPost(id, { showInHero });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!confirm('Apagar este post? Essa ação não pode ser desfeita.')) return;
    setBusyId(id);
    try {
      await deleteCommunityPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
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
          Comunidade
        </h1>
        <p className="text-sm text-primary-500/60">
          Posts dos clientes. Aprove os bons, marque "no Hero" para os que
          devem aparecer no carrossel da página inicial.
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
              {f.label}
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
          Nenhum post nesta categoria.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm"
            >
              {p.imageData && (
                <img
                  src={p.imageData}
                  alt={`Foto de ${p.name}`}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-5">
                <header className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-primary-500">{p.name}</p>
                    <p className="text-[11px] text-primary-500/60">
                      {new Date(p.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[p.status]}`}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </header>

                <p className="whitespace-pre-wrap text-sm text-primary-500/90">
                  {p.message}
                </p>

                <footer className="mt-4 space-y-2 border-t border-primary-100 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {(['approved', 'pending', 'hidden'] as CommunityPostStatus[]).map(
                      (s) => {
                        const active = p.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={busyId === p.id || active}
                            onClick={() => changeStatus(p.id, s)}
                            className={
                              active
                                ? 'cursor-default rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-[11px] text-primary-500'
                                : 'rounded-full border border-primary-200 px-3 py-1 text-[11px] text-primary-500/70 hover:border-primary-500 hover:text-primary-500 disabled:opacity-40'
                            }
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      className={
                        p.imageData && p.status === 'approved'
                          ? 'inline-flex cursor-pointer items-center gap-2 text-xs text-primary-500/80'
                          : 'inline-flex cursor-not-allowed items-center gap-2 text-xs text-primary-300'
                      }
                      title={
                        p.imageData
                          ? 'Mostrar essa foto rotacionando no Hero da home'
                          : 'Posts sem foto não entram no Hero'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={p.showInHero}
                        disabled={
                          busyId === p.id ||
                          !p.imageData ||
                          p.status !== 'approved'
                        }
                        onChange={(e) => toggleHero(p.id, e.target.checked)}
                      />
                      Mostrar no Hero
                    </label>
                    <span className="ml-auto" />
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => remove(p.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-600 hover:border-rose-500 disabled:opacity-40"
                    >
                      Apagar
                    </button>
                  </div>
                </footer>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
