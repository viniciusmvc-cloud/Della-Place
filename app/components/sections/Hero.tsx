import { LogoTextOnly } from '@/components/brand/Logo';
import PhotoCarousel from '@/components/ui/PhotoCarousel';

const HERO_IMAGES = [
  { src: '/images/pizza-calabria-hero.png', alt: 'Calabria — molho San Marzano, calabresa, cebola e azeitonas' },
  { src: '/images/pizza-cheese-pull.png', alt: 'Massa de longa fermentação — fatia sendo levantada' },
  { src: '/images/pizza-calabria.jpg', alt: 'Pizza artesanal Della Pace na tábua' },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-white px-4 pb-20 pt-16 md:px-8 md:pt-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p
            className="mb-3 text-xs uppercase tracking-[0.4em] text-accent-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Edição limitada · Domingos
          </p>

          <div className="mb-6 flex justify-center md:justify-start">
            <LogoTextOnly width={320} />
          </div>

          <p
            className="mx-auto mb-3 max-w-md text-2xl italic leading-snug text-primary-500 md:mx-0 md:text-3xl"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            "Transformar alguns domingos em uma pequena experiência de pizzaria
            artesanal em casa."
          </p>

          <p className="mx-auto mb-8 max-w-md text-sm text-primary-500/70 md:mx-0">
            Massa de longa fermentação natural, ingredientes selecionados,
            molho artesanal de tomate San Marzano. Produção limitada — uma
            pizza por vez no forno.
          </p>

          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            <a
              href="#reservar"
              className="rounded-full bg-primary-500 px-6 py-3 text-sm text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-100"
            >
              Reservar pizza
            </a>
            <a
              href="#cardapio"
              className="rounded-full border border-primary-200 px-6 py-3 text-sm text-primary-500 transition-colors hover:border-primary-500"
            >
              Ver cardápio
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-full bg-accent-100/40 blur-2xl" />
          <PhotoCarousel images={HERO_IMAGES} />
          <div className="absolute -bottom-4 -right-4 hidden rounded-xl border border-accent-200 bg-white px-4 py-3 shadow-sm md:block">
            <p
              className="text-sm italic text-primary-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              San Marzano · Fermentação natural
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
