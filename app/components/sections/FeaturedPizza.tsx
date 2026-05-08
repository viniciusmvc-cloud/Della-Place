export default function FeaturedPizza() {
  return (
    <section className="bg-white px-4 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p
            className="mb-3 text-xs uppercase tracking-[0.4em] text-accent-500"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Os fundamentos
          </p>
          <h2
            className="text-4xl italic leading-tight text-primary-500 md:text-5xl"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Italiana raiz, do começo ao fim
          </h2>
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <img
              src="/images/pizza-cheese-pull.png"
              alt="Pizza artesanal Della Pace, fatia sendo levantada"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
            />
          </div>

          <div className="space-y-8">
            <Block
              title="A massa"
              subtitle="Aerada, leve, viva"
              text="Mais de 24 horas de fermentação natural com farinha italiana 00, do tipo que se usa em Nápoles. O resultado é uma massa que estica sem rasgar, infla sem pesar, e fica leve até na última fatia."
            />
            <Block
              title="O molho"
              subtitle="Autoral, sem atalhos"
              text="Tomate San Marzano italiano, cozido devagar com a receita autoral do Aurélio. Sem conservante, sem açúcar pra disfarçar acidez, sem pasta industrializada. Só fruto, sal, um fio de azeite e tempo."
            />
            <Block
              title="A cobertura"
              subtitle="Italiana raiz"
              text="Mussarela que derrete devagar, presunto cru fatiado fino, manjericão fresco colhido no dia. Cada ingrediente escolhido pra ter espaço, nada além do necessário, do jeito que se come numa cantina italiana."
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 md:max-w-md md:mx-auto">
          <Stat label="Horas de fermentação" value="24+" />
          <Stat label="Pizza por vez" value="1" />
          <Stat label="Atalhos" value="0" />
        </div>
      </div>
    </section>
  );
}

function Block({
  title,
  subtitle,
  text,
}: {
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-accent-500">
        {title}
      </p>
      <h3
        className="mb-3 text-2xl italic text-primary-500 md:text-3xl"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        {subtitle}
      </h3>
      <p className="text-sm leading-relaxed text-primary-500/85 md:text-base">
        {text}
      </p>
    </div>
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
