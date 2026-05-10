'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'password' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setResetSent(true);
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
            width={96}
            height={96}
            priority
            className="mx-auto mb-3 rounded-full shadow-md"
          />
          <p className="text-3xl italic text-primary-500">Della Pace</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-accent-500">
            Painel · Admin
          </p>
        </div>

        {resetSent ? (
          <div className="space-y-3 text-center">
            <p className="text-2xl text-emerald-600">✓</p>
            <h1 className="text-lg font-medium text-primary-500">
              Verifique seu email
            </h1>
            <p className="text-sm text-primary-500/70">
              Se este email estiver cadastrado como administrador, você
              receberá um link de redefinição em até 1 minuto. O link é válido
              por 30 minutos.
            </p>
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setMode('password');
              }}
              className="text-xs text-primary-500/60 hover:text-primary-500"
            >
              Voltar pro login
            </button>
          </div>
        ) : mode === 'password' ? (
          <>
            <h1 className="mb-2 text-lg font-medium text-primary-500">
              Acesso ao painel
            </h1>
            <p className="mb-5 text-sm text-primary-500/70">
              Entre com seu email e senha.
            </p>
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Senha
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email || !password}
                className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
              >
                {busy ? 'Entrando...' : 'Entrar'}
              </button>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </form>
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-xs text-primary-500/70 hover:text-primary-500"
              >
                Esqueci a senha
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-medium text-primary-500">
              Redefinir senha
            </h1>
            <p className="mb-5 text-sm text-primary-500/70">
              Digite seu email e enviaremos um link pra criar uma senha nova.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
              >
                {busy ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </form>
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError(null);
                }}
                className="text-xs text-primary-500/70 hover:text-primary-500"
              >
                ← Voltar pra entrada com senha
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-primary-500/60 hover:text-primary-500"
          >
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
