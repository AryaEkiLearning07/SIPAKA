import React from 'react';
import type { Metadata } from 'next';
import { LawReconstructor, ITE_BASE_DOCUMENT_2008, ITE_ALL_CHANGESETS } from '@sipaka/legal-engine';
import { ConsolidatedLawDocument } from '@sipaka/types';
import { InstrumentMeta, OpsRow, InstrumentRelationsData } from './reader-types';
import LawWorkspaceClient from './LawWorkspaceClient';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ focus?: string }>;
}

const SERVER_API_BASE =
  process.env.INTERNAL_API_URL?.replace(/\/api(?:\/:path\*)?\/?$/, '') ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://api:4000';

/**
 * Fallback metadata mandiri untuk pilot UU ITE jika API internal belum aktif saat SSR.
 */
function getFallbackIteMeta(): InstrumentMeta {
  return {
    slug: 'ite',
    type: 'UU',
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE',
    status: 'DIUBAH',
    source: 'engine-demo',
    lnNumber: 58,
    tlnNumber: 4843,
    pdfUrl: 'https://peraturan.bpk.go.id/Download/26683/UU%20Nomor%2011%20Tahun%202008.pdf',
    fileHashSha256: '3c174f55b4a7982af268a24316e3353c8e712fc8a57e87a9fdf0502da4ea0af3',
    availableTimelines: ['2008', '2016', '2024'],
    amendments: [
      {
        title: 'Perubahan Pertama (UU No. 19 Tahun 2016)',
        amendingInstrument: 'UU No. 19 Tahun 2016',
        effectiveFrom: '2016-11-28T00:00:00Z',
      },
      {
        title: 'Perubahan Kedua (UU No. 1 Tahun 2024)',
        amendingInstrument: 'UU No. 1 Tahun 2024',
        effectiveFrom: '2024-01-02T00:00:00Z',
      },
    ],
  };
}

/**
 * Generate Dynamic SEO Metadata untuk cURL, web crawlers, dan audit hukum.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  let meta: InstrumentMeta | null = null;
  try {
    const res = await fetch(`${SERVER_API_BASE}/api/v1/instruments/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) meta = await res.json();
  } catch {
    // fallback
  }

  if (!meta && (slug === 'ite' || slug === 'uu-11-2008')) {
    meta = getFallbackIteMeta();
  }

  const title = meta
    ? `${meta.type} No. ${meta.number} Tahun ${meta.year} tentang ${meta.title} | SIPAKA`
    : `Naskah Konsolidasi Regulasi | SIPAKA`;

  const description = meta
    ? `Naskah konsolidasi resmi deterministik ${meta.title} (${meta.type} ${meta.number}/${meta.year}). Uji integritas kriptografis SHA-256, pelacakan amandemen point-in-time, dan risalah pembentukan hukum.`
    : `Sistem Informasi Pelacakan Amandemen dan Kodifikasi Hukum Indonesia.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'id_ID',
      siteName: 'SIPAKA - Platform Kodifikasi Hukum Indonesia',
    },
  };
}

/**
 * Server Component SSR:
 * Melakukan pre-fetching naskah konsolidasi deterministik di server.
 * Memastikan cURL, Google, dan pengunjung langsung menerima teks hukum utuh tanpa flash loading.
 */
export default async function LawWorkspacePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { focus } = await searchParams;

  let initialMeta: InstrumentMeta | null = null;
  let initialDoc: ConsolidatedLawDocument | null = null;
  let initialTimeline: string | null = null;
  let initialOperations: OpsRow[] = [];
  let initialRelations: InstrumentRelationsData | null = null;
  let initialApiError: string | null = null;

  try {
    const metaRes = await fetch(`${SERVER_API_BASE}/api/v1/instruments/${slug}`, { next: { revalidate: 60 } });
    if (metaRes.ok) {
      initialMeta = await metaRes.json();
      const years = initialMeta?.availableTimelines ?? [];
      initialTimeline = years[years.length - 1] ?? null;
    }
  } catch {
    // API server mungkin offline di dev
  }

  // Fallback engine mandiri untuk pilot UU ITE
  if (!initialMeta && (slug === 'ite' || slug === 'uu-11-2008')) {
    initialMeta = getFallbackIteMeta();
    initialTimeline = '2024';
  }

  // Pre-fetch naskah snapshot di server
  if (initialMeta && initialTimeline) {
    try {
      const snapRes = await fetch(
        `${SERVER_API_BASE}/api/v1/instruments/${slug}/snapshot?year=${initialTimeline}`,
        { next: { revalidate: 60 } }
      );
      if (snapRes.ok) {
        const snapJson = await snapRes.json();
        initialDoc = snapJson.data as ConsolidatedLawDocument;
      }
    } catch {
      // Abaikan jika network error
    }

    // Jika API belum menghasilkan doc dan slug adalah pilot ITE, rekonstruksi via Legal Engine
    if (!initialDoc && (slug === 'ite' || slug === 'uu-11-2008')) {
      try {
        const targetDate = initialTimeline === '2008'
          ? '2008-04-22T00:00:00Z'
          : initialTimeline === '2016'
            ? '2016-11-29T00:00:00Z'
            : '2024-12-31T00:00:00Z';
        initialDoc = LawReconstructor.reconstructAtDate(ITE_BASE_DOCUMENT_2008, ITE_ALL_CHANGESETS, targetDate);
      } catch {
        // Fallback doc
      }
    }
  }

  // Pre-fetch operations & relations
  try {
    const [opsRes, relRes] = await Promise.all([
      fetch(`${SERVER_API_BASE}/api/v1/instruments/${slug}/operations`, { next: { revalidate: 60 } }),
      fetch(`${SERVER_API_BASE}/api/v1/instruments/${slug}/relations`, { next: { revalidate: 60 } }),
    ]);
    if (opsRes.ok) {
      const json = await opsRes.json();
      initialOperations = json.operations ?? [];
    }
    if (relRes.ok) {
      const json = await relRes.json();
      initialRelations = json.relations ?? null;
    }
  } catch {
    // fallback
  }

  return (
    <LawWorkspaceClient
      slug={slug}
      focusPath={focus}
      initialMeta={initialMeta}
      initialDoc={initialDoc}
      initialTimeline={initialTimeline}
      initialOperations={initialOperations}
      initialRelations={initialRelations}
      initialApiError={initialApiError}
    />
  );
}
