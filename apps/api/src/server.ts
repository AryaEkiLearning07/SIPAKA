import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { 
  LawReconstructor, 
  LegalDiffGenerator, 
  ITE_BASE_DOCUMENT_2008, 
  ITE_ALL_CHANGESETS 
} from '@lexvera/legal-engine';
import { ProvisionNode } from '@lexvera/types';

const TIMELINE_YEARS: Record<string, string> = {
  '2008': '2008-12-31T00:00:00Z',
  '2016': '2016-12-31T00:00:00Z',
  '2024': '2024-12-31T00:00:00Z',
};

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
  });

  // Izinkan CORS untuk Frontend Web (Next.js)
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // 1. Health Check
  server.get('/api/v1/health', async () => {
    return {
      status: 'ok',
      service: 'lexvera-legal-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      activeEngines: ['LawReconstructor-v1', 'LegalDiffGenerator-LCS'],
    };
  });

  // 2. GET /api/v1/instruments (Daftar Peraturan)
  server.get('/api/v1/instruments', async () => {
    return {
      data: [
        {
          id: 'uu-11-2008',
          slug: 'ite',
          type: 'UU',
          number: 11,
          year: 2008,
          title: 'Informasi dan Transaksi Elektronik',
          shortTitle: 'UU ITE',
          status: 'DIUBAH',
          promulgatedAt: '2008-04-21T00:00:00Z',
          availableTimelines: [
            { year: '2008', label: 'Naskah Asli 2008', date: '2008-12-31' },
            { year: '2016', label: 'Pasca UU 19/2016 (Rev 1)', date: '2016-12-31' },
            { year: '2024', label: 'Pasca UU 1/2024 (Terkini)', date: '2024-12-31' },
          ],
          amendingInstruments: ['UU No. 19 Tahun 2016', 'UU No. 1 Tahun 2024'],
        },
      ],
    };
  });

  // 3. GET /api/v1/instruments/:slug (Metadata Peraturan Tertentu)
  server.get('/api/v1/instruments/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    if (slug !== 'ite' && slug !== 'uu-11-2008') {
      return reply.code(404).send({ error: 'Instrument not found', slug });
    }

    return {
      id: 'uu-11-2008',
      slug: 'ite',
      type: 'UU',
      number: 11,
      year: 2008,
      title: 'Undang-Undang Republik Indonesia Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
      shortTitle: 'UU ITE',
      status: 'DIUBAH',
      promulgatedAt: '2008-04-21T00:00:00Z',
      availableTimelines: ['2008', '2016', '2024'],
      amendments: [
        {
          number: 19,
          year: 2016,
          title: 'Perubahan Atas UU No. 11 Tahun 2008',
          promulgatedAt: '2016-11-28T00:00:00Z',
        },
        {
          number: 1,
          year: 2024,
          title: 'Perubahan Kedua Atas UU No. 11 Tahun 2008',
          promulgatedAt: '2024-01-02T00:00:00Z',
        },
      ],
    };
  });

  // 4. GET /api/v1/instruments/:slug/snapshot (Konsolidasi Point-in-Time)
  server.get('/api/v1/instruments/:slug/snapshot', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { date?: string; year?: string };

    if (slug !== 'ite' && slug !== 'uu-11-2008') {
      return reply.code(404).send({ error: 'Instrument not found', slug });
    }

    let targetDate = query.date;
    if (!targetDate && query.year && TIMELINE_YEARS[query.year]) {
      targetDate = TIMELINE_YEARS[query.year];
    }
    if (!targetDate) {
      targetDate = '2024-12-31T00:00:00Z'; // default versi terkini
    }

    // Eksekusi mesin rekonstruksi deterministik
    const snapshot = LawReconstructor.reconstructAtDate(
      ITE_BASE_DOCUMENT_2008,
      ITE_ALL_CHANGESETS,
      targetDate
    );

    return {
      slug,
      asOfDate: targetDate,
      data: snapshot,
    };
  });

  // 5. GET /api/v1/instruments/:slug/tree (Daftar Isi Hierarki Saja)
  server.get('/api/v1/instruments/:slug/tree', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { year?: string; date?: string };

    if (slug !== 'ite' && slug !== 'uu-11-2008') {
      return reply.code(404).send({ error: 'Instrument not found', slug });
    }

    let targetDate = query.date;
    if (!targetDate && query.year && TIMELINE_YEARS[query.year]) {
      targetDate = TIMELINE_YEARS[query.year];
    }
    if (!targetDate) targetDate = '2024-12-31T00:00:00Z';

    const snapshot = LawReconstructor.reconstructAtDate(
      ITE_BASE_DOCUMENT_2008,
      ITE_ALL_CHANGESETS,
      targetDate
    );

    const tree = snapshot.nodes.map((chapter) => ({
      canonicalPath: chapter.canonicalPath,
      label: chapter.label,
      title: chapter.title,
      articles: chapter.children
        ?.filter((c) => c.type === 'PASAL')
        .map((p) => ({
          canonicalPath: p.canonicalPath,
          label: p.label,
          title: p.title,
          isRepealed: p.isRepealed || false,
          versionTag: p.versionTag,
          paragraphsCount: p.children?.length || 0,
        })),
    }));

    return {
      slug,
      asOfDate: targetDate,
      tree,
    };
  });

  // 6. GET /api/v1/provisions/diff (Komputasi Selisih Norma)
  server.get('/api/v1/provisions/diff', async (request, reply) => {
    const query = request.query as {
      path?: string;
      fromYear?: string;
      toYear?: string;
    };

    const path = query.path || 'uu-11-2008/pasal-27/ayat-3';
    const fromYear = query.fromYear || '2008';
    const toYear = query.toYear || '2024';

    const dateFrom = TIMELINE_YEARS[fromYear] || '2008-12-31T00:00:00Z';
    const dateTo = TIMELINE_YEARS[toYear] || '2024-12-31T00:00:00Z';

    const snapFrom = LawReconstructor.reconstructAtDate(
      ITE_BASE_DOCUMENT_2008,
      ITE_ALL_CHANGESETS,
      dateFrom
    );
    const snapTo = LawReconstructor.reconstructAtDate(
      ITE_BASE_DOCUMENT_2008,
      ITE_ALL_CHANGESETS,
      dateTo
    );

    const findNode = (nodes: ProvisionNode[]): ProvisionNode | null => {
      for (const n of nodes) {
        if (n.canonicalPath === path) return n;
        if (n.children) {
          const res = findNode(n.children);
          if (res) return res;
        }
      }
      return null;
    };

    const nodeFrom = findNode(snapFrom.nodes);
    const nodeTo = findNode(snapTo.nodes);

    const textFrom = nodeFrom ? nodeFrom.content : `(Belum ada pada tahun ${fromYear})`;
    const textTo = nodeTo ? nodeTo.content : `(Tidak ada pada tahun ${toYear})`;

    const diff = LegalDiffGenerator.computeDiff(
      path,
      textFrom,
      textTo,
      fromYear,
      toYear
    );

    return {
      targetPath: path,
      fromYear,
      toYear,
      nodeFrom: nodeFrom ? { label: nodeFrom.label, isRepealed: nodeFrom.isRepealed } : null,
      nodeTo: nodeTo ? { label: nodeTo.label, isRepealed: nodeTo.isRepealed } : null,
      diff,
    };
  });

  return server;
}
