import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIPAKA — Sistem Informasi Pelacakan Amandemen, Kodifikasi & Advokasi',
  description:
    'Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi Regulasi Indonesia. Naskah konsolidasi deterministik berbasis Lembaran Negara RI.',
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
      <body className="antialiased bg-paper text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
