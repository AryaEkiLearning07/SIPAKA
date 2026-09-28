import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';
import {
  loadFamily, dateForYear, timelineYears, isDbConnectionError,
} from '../family';

/** Semua operasi perubahan sebuah instrumen (dari change_operations, data nyata DB). */
export function registerOperationsRoute(server: FastifyInstance): void {
  server.get('/api/v1/instruments/:slug/operations', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      // Cari id instrumen langsung dari DB berdasarkan slug
      const inst = await prisma.legalInstrument.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!inst) {
        return reply.code(404).send({ error: 'INSTRUMENT_NOT_FOUND', slug });
      }

      const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT co.id, co.operationType, co.sourceReference,
                co.previousContent, co.newContent, co.orderInSet,
                p.canonicalPath AS targetCanonicalPath, p.label AS targetLabel,
                cs.title AS changeSetTitle, am.effectiveFrom AS effectiveFrom,
                am.slug AS amenderSlug, am.number AS amenderNumber, am.year AS amenderYear,
                am.type AS amenderType, am.lnNumber AS amenderLnNumber, am.tlnNumber AS amenderTlnNumber,
                am.promulgatedAt AS amenderPromulgatedAt, am.enactedAt AS amenderEnactedAt,
                am.penutupTeks AS amenderPenutupTeks, am.preambleJson AS amenderPreambleJson
         FROM change_operations co
         JOIN change_sets cs ON cs.id = co.changeSetId
         JOIN legal_instruments am ON am.id = cs.amendingInstrumentId
         JOIN provisions p ON p.id = co.targetProvisionId
         WHERE cs.targetInstrumentId = ?
         ORDER BY am.year ASC, co.orderInSet ASC`,
        inst.id
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
        amenderYear: Number(r.amenderYear),
        amenderLnNumber: r.amenderLnNumber ? Number(r.amenderLnNumber) : null,
        amenderTlnNumber: r.amenderTlnNumber ? Number(r.amenderTlnNumber) : null,
        amenderPromulgatedAt: r.amenderPromulgatedAt instanceof Date ? r.amenderPromulgatedAt.toISOString() : (r.amenderPromulgatedAt ? String(r.amenderPromulgatedAt) : null),
        amenderEnactedAt: r.amenderEnactedAt instanceof Date ? r.amenderEnactedAt.toISOString() : (r.amenderEnactedAt ? String(r.amenderEnactedAt) : null),
        amenderPenutupTeks: r.amenderPenutupTeks ? String(r.amenderPenutupTeks) : null,
        amenderPreamble: r.amenderPreambleJson ? (typeof r.amenderPreambleJson === 'string' ? JSON.parse(String(r.amenderPreambleJson)) : r.amenderPreambleJson) : null,
      }));

      return { source: 'database', jumlah: operations.length, operations };
    } catch (e) {
      if (isDbConnectionError(e)) {
        return reply.code(503).send({ error: 'DATABASE_UNAVAILABLE' });
      }
      throw e;
    }
  });
}
