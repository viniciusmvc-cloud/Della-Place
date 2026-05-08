'use client';

import Link from 'next/link';
import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('sending');
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
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
        <div
          className="mb-6 text-center"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          <p className="text-3xl italic text-primary-500">Della Pace</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-accent-500">
            Painel · Admin
          </p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-3 text-center">
            <p className="text-2xl text-emerald-600">✓</p>
            <h1 className="text-lg font-medium text-primary-500">
              Verifique seu email
            </h1>
            <p className="text-sm text-primary-500/70">
              Se o email estiver autorizado, você receberá um link para entrar
              em até 1 minuto. O link é válido por 15 minutos.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
              className="text-xs text-primary-500/60 hover:text-primary-500"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-medium text-primary-500">
              Acesso ao painel
            </h1>
            <p className="mb-5 text-sm text-primary-500/70">
              Digite seu email cadastrado. Enviamos um link de acesso (válido
              por 15 minutos).
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                disabled={status === 'sending'}
                className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
              >
                {status === 'sending' ? 'Enviando...' : 'Enviar link de acesso'}
              </button>
              {error && (
                <p className="text-xs text-rose-600">{error}</p>
              )}
            </form>
            <p className="mt-4 text-[11px] text-primary-500/50">
              Apenas emails autorizados conseguem entrar. Se você é dono do
              estabelecimento e não consegue acessar, entre em contato.
            </p>
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
