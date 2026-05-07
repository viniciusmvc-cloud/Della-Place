export default function About() {
  return (
    <section
      id="historia"
      className="bg-primary-50/40 px-4 py-20 md:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          A história
        </p>
        <h2
          className="mb-12 text-center text-4xl italic text-primary-500 md:text-5xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Aurélio Paz
        </h2>

        <div className="space-y-5 text-base leading-relaxed text-primary-500/85">
          <p
            className="text-xl italic text-primary-500 md:text-2xl"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            "Mais do que um negócio, encaro isso como um desafio e uma
            experiência — algo feito com dedicação, estudo e paixão pela pizza."
          </p>

          <p>
            Arquiteto de formação, com mais de 17 anos de carreira em grandes
            obras de infraestrutura, Aurélio carrega para a cozinha o mesmo
            rigor que aplica nos cronogramas e na execução técnica: precisão,
            controle e dedicação ao detalhe.
          </p>

          <p>
            Mas o que move a Della Pace é outra coisa: <strong>paixão pela
            culinária italiana</strong>. Massa de longa fermentação natural,
            molho artesanal feito com tomate San Marzano, ingredientes
            selecionados e uma pizza por vez no forno. Sem pressa.
          </p>

          <p>
            A proposta é simples — transformar alguns domingos em uma pequena
            experiência gastronômica artesanal, em produção limitada, para os
            amigos e clientes que entendem que pizza boa tem hora pra ficar
            pronta.
          </p>

          <p
            className="border-l-2 border-accent-500 pl-4 text-sm italic text-primary-500/70"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            "Un abbraccio." — Della Pace
          </p>
        </div>
      </div>
    </section>
  );
}
