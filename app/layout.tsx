import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Della Pace - Pizzeria Artigianale',
  description: 'Pizzaria artesanal Della Pace',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/dellapace-icon.png',
    shortcut: '/icons/dellapace-icon.png',
    apple: '/icons/dellapace-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Della Pace',
    statusBarStyle: 'default',
    startupImage: '/icons/dellapace-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2B4C6B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cormorant.variable}>
      <body className="min-h-screen bg-white text-primary-500 antialiased">
        {children}
      </body>
    </html>
  );
}
