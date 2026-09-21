import type { Metadata, Viewport } from 'next';
import { Inter_Tight, Geist_Mono } from 'next/font/google';
import './globals.css';

const display = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600'],
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'MT-09 SP — Not transport. An instrument.',
  description:
    'A cinematic, scroll-driven 3D launch experience. One machine, one light, one room.',
  openGraph: {
    title: 'MT-09 SP — Not transport. An instrument.',
    description: 'A cinematic, scroll-driven 3D launch experience.',
    images: ['/assets/img/shutter-on-1400.webp'],
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
