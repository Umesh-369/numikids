import type { Metadata } from 'next';
import { Nunito, Inter } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-nunito',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'FLN — AI-Powered Numeracy Learning Platform',
  description: 'A gamified, child-safe numeracy learning platform for children aged 3–8.',
};

import SWRegister from '../components/SWRegister';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable}`}>
      <body className="bg-brand-background text-brand-text min-h-screen relative">
        {/* Animated 3D Cinematic Backdrop with glowing blobs */}
        <div className="bg-cinematic-light">
          <div className="aurora-blob aurora-1"></div>
          <div className="aurora-blob aurora-2"></div>
          <div className="aurora-blob aurora-3"></div>
        </div>

        <SWRegister />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
