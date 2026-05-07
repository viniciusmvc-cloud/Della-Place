import { CONTACT, whatsAppLink } from '@/lib/contact';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary-500 px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <p
          className="text-3xl italic text-accent-500 md:text-4xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Della Pace
        </p>
        <p
          className="mt-1 text-xs uppercase tracking-[0.4em] text-white/70"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Pizzeria Artigianale
        </p>

        <p className="mx-auto mt-6 max-w-md text-sm italic text-white/70">
          "Un abbraccio." — Della Pace
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
          <a
            href={whatsAppLink('Olá Aurélio! Vim pelo site da Della Pace.')}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-500"
          >
            WhatsApp {CONTACT.whatsAppDisplay}
          </a>
          <a
            href={`https://instagram.com/${CONTACT.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-500"
          >
            @{CONTACT.instagramHandle}
          </a>
        </div>

        <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-white/50">
          Projeto pessoal e artesanal. Edição limitada aos domingos. Não é
          serviço de delivery comercial — Aurélio entrega pessoalmente em área
          restrita.
        </p>

        <p className="mt-8 text-xs text-white/40">
          © {year} Della Pace · Pizzeria Artigianale
        </p>
      </div>
    </footer>
  );
}
