import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Della Pace - Pizzeria Artigianale',
    short_name: 'Della Pace',
    description:
      'Pizzaria artesanal de domingos. Reserve sua pizza com massa de longa fermentação.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2B4C6B',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    categories: ['food', 'lifestyle'],
  };
}
