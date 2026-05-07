export default function FeaturedPizza() {
  return (
    <section className="bg-white px-4 py-20 md:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-5">
        <div className="md:col-span-3">
          <img
            src="/images/pizza-cheese-pull.png"
            alt="Pizza artesanal Della Pace — fatia sendo levantada"
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
          />
        </div>

        <div className="md:col-span-2">
          <p
            className="mb-3 text-xs uppercase tracking-[0.4em] text-accent-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            A massa
          </p>
          <h2
            className="mb-6 text-4xl italic leading-tight text-primary-500 md:text-5xl"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Aerada, leve, viva
          </h2>
          <p className="mb-4 text-base leading-relaxed text-primary-500/85">
            Mais de 24 horas de fermentação natural, farinha italiana e
            paciência. O resultado: uma massa que estica sem rasgar e fica leve
            mesmo na última fatia.
          </p>
          <p className="text-base leading-relaxed text-primary-500/85">
            Cobertura simples, ingrediente por ingrediente. Mussarela que
            derrete devagar, presunto cru fatiado fino, manjericão fresco.
            Nada além do necessário.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <Stat label="Horas de fermentação" value="24+" />
            <Stat label="Pizza por vez" value="1" />
            <Stat label="Domingos" value="∞" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-accent-500 pl-3">
      <p
        className="text-2xl text-primary-500"
        style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 600,
        }}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-primary-500/60">
        {label}
      </p>
    </div>
  );
}
