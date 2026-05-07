'use client';

import { useEffect, useState } from 'react';

type Img = { src: string; alt: string };

type PhotoCarouselProps = {
  images: Img[];
  intervalMs?: number;
  className?: string;
};

export default function PhotoCarousel({
  images,
  intervalMs = 4500,
  className = 'aspect-square',
}: PhotoCarouselProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [images.length, intervalMs, paused]);

  if (images.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl shadow-xl ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Foto ${i + 1} de ${images.length}`}
            className={`h-2 rounded-full transition-all ${
              i === idx ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
