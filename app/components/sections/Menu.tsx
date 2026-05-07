'use client';

import { useEffect, useState } from 'react';
import { fetchMenu } from '@/lib/api';
import { DEFAULT_MENU, type MenuItem } from '@/lib/menu';

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenu()
      .then((data) => setItems(data.filter((m) => m.active)))
      .catch(() => setItems(DEFAULT_MENU.filter((m) => m.active)));
  }, []);

  return (
    <section id="cardapio" className="bg-primary-500 px-4 py-20 text-white md:px-8">
      <div className="mx-auto max-w-3xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Cardápio
        </p>
        <h2
          className="mb-12 text-center text-5xl text-accent-500 md:text-6xl"
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 600,
          }}
        >
          Menu
        </h2>

        {items.length === 0 ? (
          <p className="text-center text-sm text-white/70">
            Carregando cardápio…
          </p>
        ) : (
          <ul className="space-y-8">
            {items.map((p) => (
              <li
                key={p.id}
                className="border-b border-white/10 pb-6 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3
                    className="text-3xl text-accent-500 md:text-4xl"
                    style={{
                      fontFamily: 'var(--font-cormorant), Georgia, serif',
                      fontWeight: 600,
                    }}
                  >
                    {p.name}
                  </h3>
                  <span
                    className="text-2xl text-accent-500 md:text-3xl"
                    style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                  >
                    {p.price}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-2 text-sm leading-relaxed text-white/80 md:text-base">
                    {p.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 rounded-xl border border-accent-500/30 bg-white/5 p-5 text-center">
          <p className="text-sm text-white/80">
            Toda pizza pode ser pedida{' '}
            <strong className="text-accent-500">assada</strong>,{' '}
            <strong className="text-accent-500">pré-assada</strong> ou{' '}
            <strong className="text-accent-500">congelada</strong>. Você escolhe
            no momento da reserva.
          </p>
        </div>
      </div>
    </section>
  );
}
