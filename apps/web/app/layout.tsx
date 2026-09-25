import type { Metadata } from 'next';
import './globals.css';
import GlobalHeader from './components/GlobalHeader';

export const metadata: Metadata = {
  title: {
    default: 'SIPAKA — Sistem Informasi Pelacakan Amandemen & Kodifikasi Hukum',
    template: '%s | SIPAKA',
  },
  description:
    'Sistem Informasi Pelacakan Amandemen & Kodifikasi Peraturan Perundang-undangan Republik Indonesia. Naskah konsolidasi deterministik berbasis Lembaran Negara RI.',
  icons: {
    icon: '/logoSIPAKA.png',
    shortcut: '/logoSIPAKA.png',
    apple: '/logoSIPAKA.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-paper text-ink min-h-screen flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
