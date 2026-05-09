import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Della Pace - Pizzeria Artigianale',
    short_name: 'Della Pace',
    description:
      'Pizzaria artesanal de domingos. Reserve sua pizza com massa de longa fermentação.',
    start_url: '/pedido',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2B4C6B',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/dellapace-logo.jpeg',
        sizes: '1280x1280',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/dellapace-logo.jpeg',
        sizes: '1280x1280',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
    categories: ['food', 'lifestyle'],
  };
}
