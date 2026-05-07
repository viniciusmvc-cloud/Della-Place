const STEPS = [
  {
    n: '01',
    title: 'Cardápio na semana',
    text: 'Sabores e datas anunciados durante a semana.',
  },
  {
    n: '02',
    title: 'Reserva até sábado',
    text: 'Escolha sua pizza e horário em janela de 15 minutos.',
  },
  {
    n: '03',
    title: 'Domingo no forno',
    text: 'Uma pizza por vez. Massa fresca, fermentação natural.',
  },
  {
    n: '04',
    title: 'Entrega no horário',
    text: 'Sua pizza pronta exatamente no slot que você reservou.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white px-4 py-20 md:px-8">
      <div className="mx-auto max-w-5xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Como funciona
        </p>
        <h2
          className="mb-12 text-center text-4xl italic text-primary-500 md:text-5xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Domingo, sob reserva
        </h2>

        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-primary-100 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span
                className="text-3xl text-accent-500"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
              >
                {s.n}
              </span>
              <h3 className="mt-3 text-base font-medium text-primary-500">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-primary-500/70">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
