'use client';

import { useState } from 'react';

type Review = {
  id: string;
  name: string;
  text: string;
  imageDataUrl?: string | null;
};

const SEED: Review[] = [
  {
    id: 'seed-1',
    name: 'Vinícius e Alana Rôxo de Carvalho',
    text: 'Já viajei o mundo todo, comi pizza na Itália, França, Espanha, Nova York e São Paulo — e a do Aurélio supera todas. Massa artesanal, fermentação longa e natural, produtos selecionados, molho artesanal e caseiro feito com tomate. Juro, é maravilhosa.',
  },
  {
    id: 'seed-2',
    name: 'Sérgio Oliveira',
    text: 'Pizza excelente como sempre. Sucesso pra vocês — mesmo que inicialmente seja um pequeno teste!',
  },
  {
    id: 'seed-3',
    name: 'Tatiana Smera',
    text: 'Pizza excelente como sempre. Sucesso pra vocês — mesmo que inicialmente seja um pequeno teste!',
  },
];

export default function CommunityWall() {
  const [reviews, setReviews] = useState<Review[]>(SEED);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const newReview: Review = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      text: text.trim(),
      imageDataUrl,
    };
    setReviews((prev) => [newReview, ...prev]);
    setName('');
    setText('');
    setImageDataUrl(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  }

  return (
    <section className="bg-primary-50/40 px-4 py-20 md:px-8">
      <div className="mx-auto max-w-5xl">
        <p
          className="mb-3 text-center text-xs uppercase tracking-[0.4em] text-accent-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Comunidade
        </p>
        <h2
          className="mb-3 text-center text-4xl italic text-primary-500 md:text-5xl"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Quem já provou
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm text-primary-500/70">
          Compartilhe um momento que você teve com a Della Pace. Comente,
          envie uma foto sua com a família ou amigos.
        </p>

        <form
          onSubmit={onSubmit}
          className="mb-12 grid gap-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-primary-500/60">
                Seu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 outline-none focus:border-primary-500"
                placeholder="Como assinar"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-primary-500/60">
                Foto (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="block w-full text-sm text-primary-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary-500 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-primary-600"
              />
              {imageDataUrl && (
                <img
                  src={imageDataUrl}
                  alt="Pré-visualização"
                  className="mt-3 h-24 w-24 rounded-lg object-cover"
                />
              )}
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs uppercase tracking-widest text-primary-500/60">
              Seu comentário
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 outline-none focus:border-primary-500"
              placeholder="Conte como foi sua experiência..."
            />
            <button
              type="submit"
              disabled={!name.trim() || !text.trim()}
              className="mt-3 w-full rounded-full bg-primary-500 px-6 py-3 text-sm text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Compartilhar
            </button>
            {submitted && (
              <p className="mt-2 text-center text-sm text-accent-500">
                Obrigado! Seu comentário aparece logo abaixo.
              </p>
            )}
            <p className="mt-2 text-center text-[11px] text-primary-500/50">
              (Por enquanto seus comentários ficam só neste navegador. Quando
              o banco de dados estiver pronto, ficarão salvos pra todo mundo
              ver.)
            </p>
          </div>
        </form>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.id}
              className="flex flex-col rounded-2xl border border-primary-100 bg-white p-6 shadow-sm"
            >
              {r.imageDataUrl && (
                <img
                  src={r.imageDataUrl}
                  alt={`Foto de ${r.name}`}
                  className="mb-4 h-40 w-full rounded-lg object-cover"
                />
              )}
              <span
                className="text-3xl leading-none text-accent-500"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-primary-500/85">
                {r.text}
              </blockquote>
              <figcaption className="mt-4 text-xs uppercase tracking-widest text-primary-500/60">
                {r.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
