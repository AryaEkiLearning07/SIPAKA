import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexVera — Platform Riset & Version Control Perundang-Undangan Indonesia',
  description: 'Sistem Konsolidasi, Rekonstruksi Norma, dan Peta Keterhubungan Hukum Indonesia',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
