import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';
import { LawReconstructor } from '@lexvera/legal-engine';
import {
  loadFamily, dateForYear, timelineYears, isDbConnectionError, labelOf,
  DEMO_FALLBACK, Family,
} from '../family';

const DB_DOWN_HINT = 'Jalankan docker compose up -d lalu pnpm db:migrate';

/** Balasan kesalahan standar untuk gangguan keluarga peraturan. */
function replyFamilyError(
  reply: { code: (c: number) => { send: (o: unknown) => unknown } },
  e: unknown,
  slug: string
): unknown {
  if (e instanceof Error && e.message === 'INSTRUMENT_NOT_FOUND') {
    return reply.code(404).send({ error: 'INSTRUMENT_NOT_FOUND', slug });
  }
  if (e instanceof Error && e.message === 'DATABASE_EMPTY') {
    return reply.code(503).send({ error: 'DATABASE_EMPTY', hint: 'Jalankan pnpm db:seed' });
  }
  if (isDbConnectionError(e)) {
    return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE', hint: DB_DOWN_HINT });
  }
  throw e;
}

/** Versi demo entri keluarga UU ITE untuk endpoint daftar. */
function demoListEntry(family: Family) {
  return {
    id: `uu-${family.instrument.number}-${family.instrument.year}`,
    slug: family.instrument.slug,
    type: family.instrument.type,
    number: family.instrument.number,
    year: family.instrument.year,
    title: family.instrument.title,
    shortTitle: family.instrument.shortTitle,
    description: family.instrument.description,
    status: family.instrument.status,
    promulgatedAt: family.instrument.effectiveFrom.toISOString(),
    availableTimelines: timelineYears(family).map((y) => ({ year: y })),
    amendingInstruments: family.changeSets.map((cs) => cs.amendingInstrument),
  };
}

const KNOWN_PDFS: Record<string, string> = {
  'ite': 'https://peraturan.bpk.go.id/Download/26683/UU%20Nomor%2011%20Tahun%202008.pdf',
  'uu-1-2023': 'https://peraturan.bpk.go.id/Download/287456/UU%20Nomor%201%20Tahun%202023.pdf',
  'uu-27-2022': 'https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf',
  'uu-40-2007': 'https://peraturan.bpk.go.id/Download/29563/UU%20Nomor%2040%20Tahun%202007.pdf',
  'uu-8-1999': 'https://peraturan.bpk.go.id/Download/32577/UU%20Nomor%208%20Tahun%201999.pdf',
  'uu-1-2024': 'https://peraturan.bpk.go.id/Download/340058/UU%20Nomor%201%20Tahun%202024.pdf',
  'uu-19-2016': 'https://peraturan.bpk.go.id/Download/26673/UU%20Nomor%2019%20Tahun%202016.pdf',
};

function getPdfUrl(slug: string | null | undefined, number: number, year: number): string {
  if (slug && KNOWN_PDFS[slug]) return KNOWN_PDFS[slug];
  return `https://peraturan.bpk.go.id/Search?keywords=Undang-Undang+Nomor+${number}+Tahun+${year}`;
}

export function registerInstrumentRoutes(server: FastifyInstance): void {
  // 1. Health check — status DB ikut dilaporkan
  server.get('/api/v1/health', async () => {
    let db: 'ok' | 'unavailable' = 'unavailable';
    let instruments = 0;
    try {
      instruments = await prisma.legalInstrument.count();
      db = 'ok';
    } catch {
      db = 'unavailable';
    }
    return {
      status: 'ok',
      service: 'siapaka-legal-api',
      version: '0.2.1',
      timestamp: new Date().toISOString(),
      database: db,
      demoFallback: db === 'unavailable' && DEMO_FALLBACK,
      instruments,
      activeEngines: ['LawReconstructor-v1', 'LegalDiffGenerator-LCS'],
    };
  });

  // 2. Daftar peraturan (dari DB; fallback mode demo bila DB belum siap)
  server.get('/api/v1/instruments', async (request, reply) => {
    try {
      // Ambil SEMUA instrumen — tidak hanya yang punya changeset
      const instruments = await prisma.legalInstrument.findMany({
        include: {
          modificationsReceived: { include: { amendingInstrument: true } },
          _count: { select: { provisions: true } },
        },
        orderBy: [{ year: 'desc' }, { number: 'asc' }],
      });
      if (instruments.length === 0) throw new Error('DATABASE_EMPTY');
      return {
        source: 'database' as const,
        data: instruments.map((inst) => {
          const amendYears = inst.modificationsReceived.map((cs) => String(cs.amendingInstrument.year));
          const years = Array.from(new Set([String(inst.year), ...amendYears])).sort();
          return {
            id: `uu-${inst.number}-${inst.year}`,
            slug: inst.slug,
            type: inst.type,
            number: inst.number,
            year: inst.year,
            title: inst.title,
            shortTitle: inst.shortTitle,
            description: inst.description,
            status: inst.status,
            promulgatedAt: inst.promulgatedAt.toISOString(),
            lnNumber: inst.lnNumber,
            tlnNumber: inst.tlnNumber,
            confidenceScore: inst.confidenceScore,
            publishMode: inst.publishMode,
            pdfUrl: getPdfUrl(inst.slug, inst.number, inst.year),
            availableTimelines: years.map((y) => ({ year: y })),
            amendingInstruments: inst.modificationsReceived.map((cs) => labelOf(cs.amendingInstrument)),
            totalArticles: (inst as any)._count?.provisions ?? 0,
          };
        }),
      };
    } catch (e) {
      const isDataGap =
        isDbConnectionError(e) ||
        (e instanceof Error && e.message === 'DATABASE_EMPTY');
      if (DEMO_FALLBACK && isDataGap) {
        const { demoFamily } = require('../family') as typeof import('../family');
        return { source: 'engine-demo' as const, data: [demoListEntry(demoFamily())] };
      }
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE', hint: DB_DOWN_HINT });
      }
      throw e;
    }
  });

  // 3. Metadata satu peraturan
  server.get('/api/v1/instruments/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const family = await loadFamily(slug);
      const inst = family.instrument;
      return {
        source: family.source,
        id: `uu-${inst.number}-${inst.year}`,
        slug: inst.slug,
        type: inst.type,
        number: inst.number,
        year: inst.year,
        title: inst.title,
        shortTitle: inst.shortTitle,
        status: inst.status,
        preamble: inst.preambleJson ?? null,
        penutup: inst.penutupTeks ?? null,
        lnNumber: inst.lnNumber,
        tlnNumber: inst.tlnNumber,
        pdfUrl: getPdfUrl(inst.slug, inst.number, inst.year),
        promulgatedAt: inst.promulgatedAt.toISOString(),
        availableTimelines: timelineYears(family),
        amendments: family.changeSets.map((cs) => ({
          title: cs.title,
          amendingInstrument: cs.amendingInstrument,
          effectiveFrom: cs.effectiveFrom,
        })),
      };
    } catch (e) {
      return replyFamilyError(reply, e, slug);
    }
  });

  // 4. Snapshot konsolidasi point-in-time
  server.get('/api/v1/instruments/:slug/snapshot', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { date?: string; year?: string };
    try {
      const family = await loadFamily(slug);
      const years = timelineYears(family);
      let targetDate = query.date;
      if (!targetDate && query.year && years.includes(query.year)) {
        targetDate = dateForYear(family, query.year);
      }
      if (!targetDate) {
        targetDate = dateForYear(family, years[years.length - 1]);
      }

      const snapshot = LawReconstructor.reconstructAtDate(
        family.baseDocument,
        family.changeSets,
        targetDate
      );
      return { slug, asOfDate: targetDate, source: family.source, data: snapshot };
    } catch (e) {
      return replyFamilyError(reply, e, slug);
    }
  });

  // 5. Daftar isi hierarki
  server.get('/api/v1/instruments/:slug/tree', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { year?: string; date?: string };
    try {
      const family = await loadFamily(slug);
      const years = timelineYears(family);
      let targetDate = query.date;
      if (!targetDate && query.year && years.includes(query.year)) {
        targetDate = dateForYear(family, query.year);
      }
      if (!targetDate) targetDate = dateForYear(family, years[years.length - 1]);

      const snapshot = LawReconstructor.reconstructAtDate(
        family.baseDocument,
        family.changeSets,
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

      return { slug, asOfDate: targetDate, tree };
    } catch (e) {
      return replyFamilyError(reply, e, slug);
    }
  });

  // 6. Relasi instrumen (MENGUBAH, MENCABUT, MERUJUK) live dari database
  server.get('/api/v1/instruments/:slug/relations', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const inst = await prisma.legalInstrument.findUnique({
        where: { slug },
        select: { id: true, title: true, number: true, year: true, type: true, slug: true },
      });
      if (!inst) {
        return reply.code(404).send({ error: 'INSTRUMENT_NOT_FOUND', slug });
      }

      const [outgoing, incoming] = await Promise.all([
        prisma.instrumentRelation.findMany({
          where: { sourceId: inst.id },
          include: {
            target: { select: { slug: true, title: true, shortTitle: true, number: true, year: true, type: true } },
          },
        }),
        prisma.instrumentRelation.findMany({
          where: { targetId: inst.id },
          include: {
            source: { select: { slug: true, title: true, shortTitle: true, number: true, year: true, type: true } },
          },
        }),
      ]);

      return {
        source: 'database' as const,
        instrument: inst,
        relations: {
          outgoing: outgoing.map((r) => ({
            id: r.id,
            jenis: r.jenis,
            sumberKlausa: r.sumberKlausa,
            target: r.target,
          })),
          incoming: incoming.map((r) => ({
            id: r.id,
            jenis: r.jenis,
            sumberKlausa: r.sumberKlausa,
            source: r.source,
          })),
        },
      };
    } catch (e) {
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE' });
      }
      throw e;
    }
  });
}
