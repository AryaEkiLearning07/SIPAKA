import { FastifyInstance } from 'fastify';
import { LawReconstructor, LegalDiffGenerator } from '@lexvera/legal-engine';
import { ProvisionNode } from '@lexvera/types';
import {
  loadFamily, dateForYear, timelineYears, isDbConnectionError,
  findNodeInTree,
} from '../family';

function replyFamilyError(
  reply: { code: (c: number) => { send: (o: unknown) => unknown } },
  e: unknown,
  slug: string
): unknown {
  if (e instanceof Error && (e.message === 'INSTRUMENT_NOT_FOUND' || e.message === 'DATABASE_EMPTY')) {
    return reply.code(e.message === 'DATABASE_EMPTY' ? 503 : 404).send({
      error: e.message,
      hint: e.message === 'DATABASE_EMPTY' ? 'Jalankan pnpm db:seed' : undefined,
    });
  }
  if (isDbConnectionError(e)) {
    return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE' });
  }
  throw e;
}

export function registerAnalysisRoutes(server: FastifyInstance): void {
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

      const nodeFrom = path ? findNodeInTree(snapFrom.nodes, path) : null;
      const nodeTo = path ? findNodeInTree(snapTo.nodes, path) : null;
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
      return replyFamilyError(reply, e, query.slug ?? 'ite');
    }
  });

  // 7. Riwayat bunyi node dari tahun ke tahun (untuk inspektor kontekstual)
  server.get('/api/v1/instruments/:slug/history', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { path?: string };
    if (!query.path) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'parameter path wajib' });
    }
    try {
      const family = await loadFamily(slug);
      const years = timelineYears(family);
      const versi = years.map((y) => {
        const snap = LawReconstructor.reconstructAtDate(
          family.baseDocument,
          family.changeSets,
          dateForYear(family, y)
        );
        const node = findNodeInTree(snap.nodes, query.path!);
        return {
          year: y,
          ada: !!node,
          isRepealed: node?.isRepealed ?? false,
          versionTag: node?.versionTag ?? null,
          content: node?.content ?? null,
        };
      });
      return { source: family.source, path: query.path, versi };
    } catch (e) {
      return replyFamilyError(reply, e, slug);
    }
  });

  // 8. Buku besar perubahan: seluruh ChangeSet & operasi keluarga (dari DB)
  server.get('/api/v1/instruments/:slug/changes', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const family = await loadFamily(slug);
      const changesets = family.changeSets.map((cs) => ({
        id: cs.id,
        amendingInstrument: cs.amendingInstrument,
        title: cs.title,
        effectiveFrom: cs.effectiveFrom,
        operations: cs.operations.map((op) => {
          let ringkas = '';
          switch (op.operationType) {
            case 'ADD_PROVISION':
              ringkas = `${op.newNode.label} ditambahkan — ${op.newNode.content.slice(0, 120)}…`;
              break;
            case 'REPLACE_PROVISION':
              ringkas = op.newContent?.slice(0, 140) ?? '';
              break;
            case 'REPEAL_PROVISION':
              ringkas = op.repealNote;
              break;
            case 'PARTIAL_REPEAL':
              ringkas = op.resultingContent.slice(0, 140);
              break;
            default:
              ringkas = '';
          }
          return {
            operationType: op.operationType,
            targetCanonicalPath: op.targetCanonicalPath,
            sourceReference: op.sourceReference,
            ringkas,
          };
        }),
      }));
      return { source: family.source, changesets };
    } catch (e) {
      return replyFamilyError(reply, e, slug);
    }
  });
}
