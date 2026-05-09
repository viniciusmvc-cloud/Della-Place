'use client';

const NAV = [
  { href: '#historia', label: 'História' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#reservar', label: 'Reservar' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <a
          href="#top"
          className="flex flex-col leading-none"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          <span className="text-lg italic text-primary-500 md:text-xl">
            Della Pace
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-accent-500">
            Pizzeria Artigianale
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-primary-500/80 transition-colors hover:text-primary-500"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/pedido"
            className="hidden rounded-full px-3 py-1 text-xs text-primary-500/70 hover:text-primary-500 md:inline"
            title="Tela rápida pra quem já é cliente"
          >
            Já sou cliente
          </a>
          <a
            href="#reservar"
            className="rounded-full border border-primary-500 px-4 py-1.5 text-sm text-primary-500 transition-colors hover:bg-primary-500 hover:text-white"
          >
            Reservar
          </a>
        </div>
      </div>
    </header>
  );
}
