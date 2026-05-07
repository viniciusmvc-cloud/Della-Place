import {
  LogoArch,
  LogoDove,
  LogoMonogram,
  LogoTextOnly,
} from '@/components/brand/Logo';

const concepts = [
  {
    id: 1,
    title: 'Texto puro',
    subtitle: 'Minimalismo radical',
    description:
      'Só o nome em Cormorant itálico com filete dourado. Atemporal, italiano, elegante — funciona em qualquer suporte.',
    Component: LogoTextOnly,
  },
  {
    id: 2,
    title: 'Monograma DP',
    subtitle: 'Selo italiano',
    description:
      'Iniciais entrelaçadas dentro de círculo com aro dourado. Lembra selo de cantina, queijaria, vinícola — eleva o produto artesanal.',
    Component: LogoMonogram,
  },
  {
    id: 3,
    title: 'Arco do forno',
    subtitle: 'Conta a história artesanal',
    description:
      'Arco simples representando a boca do forno a lenha. Comunica imediatamente "pizza artesanal" sem precisar de palavras.',
    Component: LogoArch,
  },
  {
    id: 4,
    title: 'Pomba (Pace)',
    subtitle: 'Trocadilho com o nome',
    description:
      '"Pace" = paz em italiano. Pomba minimalista em ouro como assinatura do nome. Brand storytelling sutil.',
    Component: LogoDove,
  },
];

export default function LogosPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 md:px-10">
      <header className="mx-auto mb-12 max-w-4xl text-center">
        <p
          className="mb-2 text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Conceitos de Logo
        </p>
        <h1
          className="text-4xl text-primary-500 md:text-5xl"
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontStyle: 'italic',
          }}
        >
          Della Pace
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-primary-400">
          Quatro direções estéticas pra você reagir. Não são versões finais —
          são pontos de partida pra escolher um caminho.
        </p>
      </header>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        {concepts.map(({ id, title, subtitle, description, Component }) => (
          <article
            key={id}
            className="flex flex-col rounded-2xl border border-primary-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                {id}
              </span>
              <div>
                <h2 className="text-lg font-medium text-primary-500">{title}</h2>
                <p className="text-xs uppercase tracking-widest text-accent-500">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-white to-primary-50 px-4 py-10">
              <Component width={280} />
            </div>

            <p className="text-sm leading-relaxed text-primary-500/80">
              {description}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-4xl rounded-2xl border border-accent-200 bg-accent-50/30 p-6 text-center">
        <h3 className="mb-2 text-base font-medium text-primary-500">
          Como escolher
        </h3>
        <p className="text-sm text-primary-500/70">
          Olhe pra cada um por 5 segundos. Qual te dá vontade de comer pizza?
          Qual o Aurélio (arquiteto, gosta de coisa bem desenhada e atemporal)
          colocaria no cartão dele? Pode ser um, pode ser uma combinação.
          Me conta sua reação.
        </p>
      </section>

      <footer className="mt-12 text-center text-xs text-primary-300">
        Cores: azul #2B4C6B · ouro #C9A961 · Fonte: Cormorant Garamond
      </footer>
    </main>
  );
}
