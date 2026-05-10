'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setValid(false);
      return;
    }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        setValid(Boolean(data.ok));
        setEmail(data.email ?? null);
      })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Senha precisa ter ao menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Confirmação não confere com a nova senha.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
        <div
          className="mb-6 text-center"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          <Image
            src="/icons/dellapace-admin-icon.png"
            alt="Della Pace Admin"
            width={80}
            height={80}
            priority
            className="mx-auto mb-3 rounded-full shadow-md"
          />
          <p className="text-3xl italic text-primary-500">Della Pace</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-accent-500">
            Redefinir senha
          </p>
        </div>

        {checking ? (
          <p className="text-center text-sm text-primary-500/60">
            Validando link…
          </p>
        ) : !valid ? (
          <div className="space-y-3 text-center">
            <p className="text-3xl text-rose-500">✕</p>
            <h1 className="text-lg font-medium text-primary-500">
              Link inválido ou expirado
            </h1>
            <p className="text-sm text-primary-500/70">
              Este link de redefinição não é mais válido. Solicite um novo na
              tela de login.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-full bg-primary-500 px-5 py-2 text-sm text-white"
            >
              Ir pro login
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-3 text-center">
            <p className="text-3xl text-emerald-500">✓</p>
            <h1 className="text-lg font-medium text-primary-500">
              Senha redefinida
            </h1>
            <p className="text-sm text-primary-500/70">
              Sua senha foi atualizada com sucesso. Redirecionando pro login…
            </p>
          </div>
        ) : (
          <>
            {email && (
              <p className="mb-4 text-center text-xs text-primary-500/70">
                Conta: <strong>{email}</strong>
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Nova senha (mín. 8 caracteres)
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Confirmar nova senha
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !newPassword || !confirm}
                className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
              >
                {busy ? 'Salvando…' : 'Redefinir senha'}
              </button>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-primary-500/60 hover:text-primary-500"
          >
            ← Voltar pro login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-primary-500/60">Carregando…</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
