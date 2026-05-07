const WORDS = [
  'Fermentação longa e natural',
  'Farinha italiana',
  'Molho artesanal de tomate San Marzano',
  'Ingredientes selecionados',
  'Uma pizza por vez',
  'Forno a alta temperatura',
];

export default function MarqueeStrip() {
  const sequence = [...WORDS, ...WORDS];
  return (
    <div
      className="relative overflow-hidden bg-primary-500 py-5"
      aria-label="Princípios da Della Pace"
    >
      <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
        {sequence.map((w, i) => (
          <span key={i} className="flex items-center gap-12 text-base md:text-lg">
            <span
              className="italic text-accent-500"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              {w}
            </span>
            <span className="text-accent-500/50" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
