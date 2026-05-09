import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/pedido',
    name: 'Della Pace - Pizzeria Artigianale',
    short_name: 'Della Pace',
    description:
      'Pizzaria artesanal de domingos. Reserve sua pizza com massa de longa fermentação.',
    start_url: '/pedido',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2B4C6B',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/dellapace-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/dellapace-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['food', 'lifestyle'],
  };
}
