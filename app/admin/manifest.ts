import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Della Pace · Admin',
    short_name: 'DP Admin',
    description: 'Painel administrativo da Della Pace - gerencie pedidos, estoque e produção.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1c2f',
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
    categories: ['business', 'productivity'],
  };
}
