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
    categories: ['business', 'productivity'],
  };
}
