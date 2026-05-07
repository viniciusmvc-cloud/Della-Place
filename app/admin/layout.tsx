'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  hasPasswordSet,
  isLoggedIn,
  login,
  logout,
  setPassword,
} from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🍕' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/disponibilidade', label: 'Disponibilidade', icon: '📅' },
  { href: '/admin/cardapio', label: 'Cardápio', icon: '🍴' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: '💰' },
  { href: '/admin/estoque', label: 'Estoque', icon: '📦' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setNeedsSetup(!hasPasswordSet());
    setAuthed(isLoggedIn());
    setAuthReady(true);
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50/30">
        <p className="text-sm text-primary-500/60">Carregando…</p>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <SetupScreen
        onDone={() => {
          setNeedsSetup(false);
          setAuthed(true);
        }}
      />
    );
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <div className="min-h-screen bg-primary-50/30 md:flex">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-primary-100 bg-white px-4 py-3 md:hidden">
        <span
          className="text-lg italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Della Pace · Admin
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
          className="rounded-md border border-primary-200 px-3 py-1 text-sm text-primary-500"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      <aside
        className={`${open ? 'block' : 'hidden'} w-full border-b border-primary-100 bg-white p-4 md:sticky md:top-0 md:block md:h-screen md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r`}
      >
        <div
          className="mb-6 hidden flex-col leading-none md:flex"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          <span className="text-2xl italic text-primary-500">Della Pace</span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-accent-500">
            Painel · Admin
          </span>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary-500 text-white'
                    : 'text-primary-500/80 hover:bg-primary-50'
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="my-3 border-t border-primary-100" />
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-primary-500/60 hover:text-primary-500"
          >
            <span aria-hidden="true">←</span>
            <span>Voltar ao site</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-primary-500/60 hover:text-primary-500"
          >
            <span aria-hidden="true">🚪</span>
            <span>Sair</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}

function SetupScreen({ onDone }: { onDone: () => void }) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (pwd !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    await setPassword(pwd);
    const ok = await login(pwd);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <CenterCard>
      <h1
        className="text-3xl italic text-primary-500"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Primeiro acesso
      </h1>
      <p className="mb-5 text-sm text-primary-500/70">
        Defina uma senha para o painel do administrador. Você pode alterá-la
        depois.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PwdInput label="Nova senha" value={pwd} onChange={setPwd} />
        <PwdInput label="Confirme a senha" value={confirm} onChange={setConfirm} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Definir senha e entrar'}
        </button>
      </form>
      <p className="mt-4 text-[11px] text-primary-500/50">
        ⚠️ Demo: a senha é guardada criptografada (SHA-256) neste navegador. No
        servidor real (Onda 2), passa a ser autenticação completa com sessão.
      </p>
    </CenterCard>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const ok = await login(pwd);
    setBusy(false);
    if (ok) onSuccess();
    else setError('Senha incorreta.');
  }

  return (
    <CenterCard>
      <h1
        className="text-3xl italic text-primary-500"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Della Pace · Admin
      </h1>
      <p className="mb-5 text-sm text-primary-500/70">
        Entre com a senha do painel.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PwdInput label="Senha" value={pwd} onChange={setPwd} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="mt-4 text-[11px] text-primary-500/50">
        Esqueceu a senha? No servidor real (Onda 2) terá recuperação por email.
        Por enquanto: F12 → Application → Local Storage → apague{' '}
        <code>della-pace.admin-hash.v1</code> e recarregue.
      </p>
    </CenterCard>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function PwdInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}
