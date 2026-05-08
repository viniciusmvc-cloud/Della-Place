'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🍕' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/disponibilidade', label: 'Disponibilidade', icon: '📅' },
  { href: '/admin/cardapio', label: 'Cardápio', icon: '🍴' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: '💰' },
  { href: '/admin/estoque', label: 'Estoque', icon: '📦' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
];

type AdminShellProps = {
  children: React.ReactNode;
  userEmail: string;
  userName: string | null;
};

export default function AdminShell({
  children,
  userEmail,
  userName,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
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
        className={`${open ? 'block' : 'hidden'} w-full border-b border-primary-100 bg-white p-4 md:sticky md:top-0 md:block md:h-screen md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r md:flex md:flex-col`}
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
        </nav>

        <div className="mt-auto pt-4">
          <div className="rounded-lg border border-primary-100 bg-primary-50/30 p-3">
            <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
              Conectado como
            </p>
            <p className="mt-1 truncate text-sm font-medium text-primary-500">
              {userName ?? userEmail}
            </p>
            {userName && (
              <p className="truncate text-[11px] text-primary-500/60">
                {userEmail}
              </p>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-full border border-primary-200 px-3 py-1.5 text-xs text-primary-500/70 hover:border-primary-500 hover:text-primary-500"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
