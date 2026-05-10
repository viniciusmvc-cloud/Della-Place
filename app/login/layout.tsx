import type { Metadata } from 'next';

// O login é usado apenas pelos administradores. Forçamos o manifest e o
// nome do PWA pro contexto admin pra que "Adicionar à tela de início"
// instale o app correto (Della Pace Admin).
export const metadata: Metadata = {
  title: 'Della Pace · Login Admin',
  manifest: '/admin/manifest.webmanifest',
  icons: {
    icon: '/icons/dellapace-admin-icon.png',
    shortcut: '/icons/dellapace-admin-icon.png',
    apple: '/icons/dellapace-admin-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Della Pace Admin',
    statusBarStyle: 'default',
    startupImage: '/icons/dellapace-admin-icon.png',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
