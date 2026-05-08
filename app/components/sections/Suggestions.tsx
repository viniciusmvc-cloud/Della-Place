'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Suggestions() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="bg-white px-4 py-20 md:px-8">
      <div className="mx-auto max-w-2xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Sua voz na próxima edição
        </p>
        <h2
          className="mb-3 text-center text-4xl italic text-primary-500 md:text-5xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Sugira um sabor, um produto, uma ideia
        </h2>
        <p className="mb-8 text-center text-sm text-primary-500/70">
          Quer ver uma combinação nova no cardápio? Sentiu falta de algo?
          Tem uma ideia que faria a Della Pace melhor? Conta pra gente.
        </p>

        {status === 'sent' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <p className="text-3xl text-emerald-600">✓</p>
            <p className="mt-2 font-medium text-primary-500">Sugestão recebida!</p>
            <p className="mt-2 text-sm text-primary-500/70">
              Obrigado. O Aurélio vai ler com calma.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 text-xs text-primary-500/60 hover:text-primary-500"
            >
              Mandar outra sugestão
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  Seu nome
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                  E-mail (opcional)
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
                Sua sugestão
              </span>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Pode ser um sabor novo, um produto que faltou, uma combinação que você adoraria provar..."
                className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-full bg-primary-500 px-6 py-3 text-sm text-white transition-opacity disabled:opacity-50"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar sugestão'}
            </button>
            {error && (
              <p className="text-xs text-rose-600">{error}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
