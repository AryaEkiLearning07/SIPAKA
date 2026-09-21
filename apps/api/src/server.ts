import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { prisma, LegalInstrument } from '@lexvera/database';
import {
  LawReconstructor,
  LegalDiffGenerator,
} from '@lexvera/legal-engine';
import {
  ConsolidatedLawDocument,
  ChangeSetPayload,
  ChangeOperationPayload,
  ProvisionNode,
} from '@lexvera/types';

/** Cache keluarga peraturan dalam memori (data pilot statis antar-request). */
const familyCache = new Map<string, {
  instrument: LegalInstrument;
  baseDocument: ConsolidatedLawDocument;
  changeSets: ChangeSetPayload[];
}>();

function labelOf(inst: { type: string; number: number; year: number }): string {
  return `${inst.type} No. ${inst.number} Tahun ${inst.year}`;
}

/** Ambil keluarga peraturan dari DB dan rakit payload untuk mesin konsolidasi. */
async function loadFamily(slug: string) {
  const cached = familyCache.get(slug);
  if (cached) return cached;

  const instrument = await prisma.legalInstrument.findUnique({
    where: { slug },
    include: {
      provisions: { include: { revisions: true } },
      modificationsReceived: {
        include: {
          amendingInstrument: true,
          operations: { orderBy: { orderInSet: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!instrument) {
    const total = await prisma.legalInstrument.count();
    const err = new Error(total === 0 ? 'DATABASE_EMPTY' : 'INSTRUMENT_NOT_FOUND');
    throw err;
  }

  // --- Rakit pohon naskah asli dari provision + revisi ORIGINAL (changeSetId null) ---
  const originalRevision = new Map<string, { content: string; explanation: string | null; versionTag: string }>();
  for (const p of instrument.provisions) {
    const rev = p.revisions.find((r) => r.changeSetId === null);
    if (rev) originalRevision.set(p.id, rev);
  }

  const byParent = new Map<string | null, typeof instrument.provisions>();
  for (const p of instrument.provisions) {
    const key = p.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(p);
    byParent.set(key, list);
  }

  const toNode = (p: (typeof instrument.provisions)[number]): ProvisionNode => {
    const rev = originalRevision.get(p.id);
    const children = (byParent.get(p.id) ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(toNode);
    return {
      canonicalPath: p.canonicalPath,
      type: p.type,
      orderIndex: p.orderIndex,
      label: p.label,
      title: p.title ?? undefined,
      content: rev?.content ?? '',
      explanation: rev?.explanation ?? undefined,
      versionTag: rev?.versionTag ?? 'ORIGINAL',
      isRepealed: false,
      children,
    };
  };

  const baseDocument: ConsolidatedLawDocument = {
    instrumentType: instrument.type,
    number: instrument.number,
    year: instrument.year,
    title: instrument.title,
    shortTitle: instrument.shortTitle ?? undefined,
    status: instrument.status,
    asOfDate: instrument.effectiveFrom.toISOString(),
    activeAmendingInstruments: [],
    nodes: (byParent.get(null) ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(toNode),
  };

  // --- Rakit ChangeSet payloads (lossless dari payload_json) ---
  const changeSets: ChangeSetPayload[] = instrument.modificationsReceived.map((cs) => ({
    id: cs.id,
    amendingInstrument: labelOf(cs.amendingInstrument),
    targetInstrument: labelOf(instrument),
    effectiveFrom: cs.amendingInstrument.effectiveFrom.toISOString(),
    title: cs.title,
    operations: cs.operations.map((op) => {
      if (!op.payloadJson) {
        throw new Error(`change_operation ${op.id} tanpa payload_json — jalankan ulang db:seed`);
      }
      return op.payloadJson as unknown as ChangeOperationPayload;
    }),
  }));

  const family = { instrument, baseDocument, changeSets };
  familyCache.set(slug, family);
  return family;
}

/** Tanggal snapshot untuk satu "tahun timeline": akhir tahun itu (semua changeset tahun itu sudah efektif). */
function dateForYear(family: { baseDocument: ConsolidatedLawDocument; changeSets: ChangeSetPayload[] }, year: string): string {
  return `${year}-12-31T23:59:59Z`;
}

function timelineYears(family: { baseDocument: ConsolidatedLawDocument; changeSets: ChangeSetPayload[] }): string[] {
  const years = new Set<string>([String(family.baseDocument.year)]);
  for (const cs of family.changeSets) years.add(String(new Date(cs.effectiveFrom).getUTCFullYear()));
  return [...years].sort();
}

function isDbConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /P1001|P1002|Can't reach database|DATABASE_URL/i.test(msg);
}

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
  });

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

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
      service: 'lexvera-legal-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
      database: db,
      instruments,
      activeEngines: ['LawReconstructor-v1', 'LegalDiffGenerator-LCS'],
    };
  });

  // 2. Daftar peraturan (dari DB)
  server.get('/api/v1/instruments', async (request, reply) => {
    try {
      const instruments = await prisma.legalInstrument.findMany({
        where: { modificationsReceived: { some: {} } },
        include: { modificationsReceived: { include: { amendingInstrument: true } } },
      });
      return {
        data: instruments.map((inst) => {
          const years = [
            String(inst.year),
            ...inst.modificationsReceived.map((cs) => String(cs.amendingInstrument.year)),
          ].sort();
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
            availableTimelines: years.map((y) => ({ year: y })),
            amendingInstruments: inst.modificationsReceived.map((cs) => labelOf(cs.amendingInstrument)),
          };
        }),
      };
    } catch (e) {
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE', hint: 'Jalankan docker compose up -d lalu pnpm db:migrate' });
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
        id: `uu-${inst.number}-${inst.year}`,
        slug: inst.slug,
        type: inst.type,
        number: inst.number,
        year: inst.year,
        title: inst.title,
        shortTitle: inst.shortTitle,
        status: inst.status,
        promulgatedAt: inst.promulgatedAt.toISOString(),
        availableTimelines: timelineYears(family),
        amendments: family.changeSets.map((cs) => ({
          title: cs.title,
          amendingInstrument: cs.amendingInstrument,
          effectiveFrom: cs.effectiveFrom,
        })),
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'INSTRUMENT_NOT_FOUND') {
        return reply.code(404).send({ error: 'Instrument not found', slug });
      }
      if (e instanceof Error && e.message === 'DATABASE_EMPTY') {
        return reply.code(503).send({ error: 'DATABASE_EMPTY', hint: 'Jalankan pnpm db:seed' });
      }
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE', hint: 'Jalankan docker compose up -d lalu pnpm db:migrate' });
      }
      throw e;
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
      return { slug, asOfDate: targetDate, data: snapshot };
    } catch (e) {
      if (e instanceof Error && (e.message === 'INSTRUMENT_NOT_FOUND' || e.message === 'DATABASE_EMPTY')) {
        return reply.code(e.message === 'DATABASE_EMPTY' ? 503 : 404).send({
          error: e.message,
          hint: e.message === 'DATABASE_EMPTY' ? 'Jalankan pnpm db:seed' : undefined,
        });
      }
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE', hint: 'Jalankan docker compose up -d lalu pnpm db:migrate' });
      }
      throw e;
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
      if (e instanceof Error && (e.message === 'INSTRUMENT_NOT_FOUND' || e.message === 'DATABASE_EMPTY')) {
        return reply.code(e.message === 'DATABASE_EMPTY' ? 503 : 404).send({ error: e.message });
      }
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE' });
      }
      throw e;
    }
  });

  // 6. Diff antar versi per node
  server.get('/api/v1/provisions/diff', async (request, reply) => {
    const query = request.query as {
      slug?: string;
      path?: string;
      fromYear?: string;
      toYear?: string;
    };
    try {
      const family = await loadFamily(query.slug ?? 'ite');
      const years = timelineYears(family);
      const fromYear = query.fromYear && years.includes(query.fromYear) ? query.fromYear : years[0];
      const toYear = query.toYear && years.includes(query.toYear) ? query.toYear : years[years.length - 1];
      const path = query.path;

      const snapFrom = LawReconstructor.reconstructAtDate(
        family.baseDocument,
        family.changeSets,
        dateForYear(family, fromYear)
      );
      const snapTo = LawReconstructor.reconstructAtDate(
        family.baseDocument,
        family.changeSets,
        dateForYear(family, toYear)
      );

      const findNode = (nodes: ProvisionNode[], target: string): ProvisionNode | null => {
        for (const n of nodes) {
          if (n.canonicalPath === target) return n;
          if (n.children) {
            const res = findNode(n.children, target);
            if (res) return res;
          }
        }
        return null;
      };

      const nodeFrom = path ? findNode(snapFrom.nodes, path) : null;
      const nodeTo = path ? findNode(snapTo.nodes, path) : null;
      if (!nodeTo) {
        return reply.code(404).send({ error: 'PROVISION_NOT_FOUND', path });
      }

      const textFrom = nodeFrom ? nodeFrom.content : `(Belum ada pada tahun ${fromYear})`;
      const textTo = nodeTo.content;

      const diff = LegalDiffGenerator.computeDiff(
        nodeTo.canonicalPath,
        textFrom,
        textTo,
        fromYear,
        toYear
      );

      return {
        targetPath: nodeTo.canonicalPath,
        fromYear,
        toYear,
        nodeFrom: nodeFrom ? { label: nodeFrom.label, isRepealed: nodeFrom.isRepealed } : null,
        nodeTo: { label: nodeTo.label, isRepealed: nodeTo.isRepealed },
        textFrom,
        textTo,
        diff,
      };
    } catch (e) {
      if (e instanceof Error && (e.message === 'INSTRUMENT_NOT_FOUND' || e.message === 'DATABASE_EMPTY')) {
        return reply.code(e.message === 'DATABASE_EMPTY' ? 503 : 404).send({ error: e.message });
      }
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE' });
      }
      throw e;
    }
  });

  return server;
}
