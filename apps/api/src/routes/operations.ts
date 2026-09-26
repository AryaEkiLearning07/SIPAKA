import { FastifyInstance } from 'fastify';
import {
  loadFamily, dateForYear, timelineYears, isDbConnectionError,
} from '../family';

/** Semua operasi perubahan sebuah instrumen (dari change_operations, data nyata DB). */
export function registerOperationsRoute(server: FastifyInstance): void {
  server.get('/api/v1/instruments/:slug/operations', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const family = await loadFamily(slug);
      void timelineYears; void dateForYear;

      const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT co.id, co.operationType, co.sourceReference,
                co.previousContent, co.newContent, co.orderInSet,
                p.canonicalPath AS targetCanonicalPath, p.label AS targetLabel,
                cs.title AS changeSetTitle, am.effectiveFrom AS effectiveFrom,
                am.slug AS amenderSlug, am.number AS amenderNumber, am.year AS amenderYear,
                am.type AS amenderType
         FROM change_operations co
         JOIN change_sets cs ON cs.id = co.changeSetId
         JOIN legal_instruments am ON am.id = cs.amendingInstrumentId
         JOIN provisions p ON p.id = co.targetProvisionId
         WHERE cs.targetInstrumentId = ?
         ORDER BY am.year ASC, co.orderInSet ASC`,
        family.instrument.id
      );

      const operations = rows.map((r) => ({
        id: String(r.id),
        operationType: String(r.operationType),
        sourceReference: String(r.sourceReference ?? ''),
        targetCanonicalPath: String(r.targetCanonicalPath ?? ''),
        targetLabel: String(r.targetLabel ?? ''),
        previousContent: r.previousContent === null || r.previousContent === undefined ? null : String(r.previousContent),
        newContent: r.newContent === null || r.newContent === undefined ? null : String(r.newContent),
        changeSetTitle: String(r.changeSetTitle ?? ''),
        effectiveFrom: r.effectiveFrom instanceof Date ? r.effectiveFrom.toISOString() : String(r.effectiveFrom),
        amender: `${String(r.amenderType)} No. ${Number(r.amenderNumber)} Tahun ${Number(r.amenderYear)}`,
        amenderSlug: r.amenderSlug ? String(r.amenderSlug) : null,
      }));

      return { source: family.source, jumlah: operations.length, operations };
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
}
