import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexVera — Version Control Perundang-Undangan Indonesia',
  description:
    'Naskah konsolidasi deterministik, silsilah amandemen, dan diff per pasal. Alat riset hukum untuk sivitas akademika.',
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-paper text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
