import { Archivo_Black, Space_Grotesk } from 'next/font/google';
import './globals.css';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata = {
  title: 'Yumna Ai — Ngobrol & Bikin Gambar',
  description: 'Asisten AI neobrutalism yang bisa ngobrol dan membuat gambar.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffd93d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${archivoBlack.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
