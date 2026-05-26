import type { Metadata } from 'next';
import { Italiana, Cormorant_Garamond, Caveat } from 'next/font/google';
import './globals.css';

const italiana = Italiana({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
});

const caveat = Caveat({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-script',
});

export const metadata: Metadata = {
  title: 'Embajadores de la Luz · El Mapa Vivo',
  description: 'Una red privada y consciente de personas unidas por valores, propósito y acción. No buscamos ser vistos. Buscamos sembrar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${italiana.variable} ${cormorant.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
