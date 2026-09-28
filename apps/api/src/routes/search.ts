import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';

export function registerSearchRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/search/provisions?q=...&limit=30&slug=...
   * Mencari kata/frasa materi muatan hukum di seluruh tubuh pasal (full-text provision search).
   */
  server.get('/api/v1/search/provisions', async (request, reply) => {
    const query = request.query as { q?: string; limit?: string; slug?: string };
    const q = (query.q ?? '').trim();

    if (!q || q.length < 2) {
      return { query: q, total: 0, results: [] };
    }

    const limit = Math.min(parseInt(query.limit ?? '40', 10) || 40, 100);

    try {
      const whereClause: Record<string, unknown> = {
        content: { contains: q },
        effectiveUntil: null,
      };

      if (query.slug) {
        whereClause.provision = {
          legalInstrument: { slug: query.slug },
        };
      }

      const revisions = await prisma.provisionRevision.findMany({
        where: whereClause as any,
        include: {
          provision: {
            include: {
              legalInstrument: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  shortTitle: true,
                  type: true,
                  number: true,
                  year: true,
                  status: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const results = revisions.map((rev) => {
        const inst = rev.provision.legalInstrument;
        return {
          id: rev.id,
          canonicalPath: rev.provision.canonicalPath,
          label: rev.provision.label,
          title: rev.provision.title,
          content: rev.content,
          versionTag: rev.versionTag,
          instrument: {
            slug: inst.slug,
            title: inst.title,
            shortTitle: inst.shortTitle,
            type: inst.type,
            number: inst.number,
            year: inst.year,
            status: inst.status,
          },
        };
      });

      return {
        query: q,
        total: results.length,
        results,
      };
    } catch (e) {
      server.log.error(e);
      return reply.code(500).send({ error: 'SEARCH_FAILED', message: String(e) });
    }
  });
}
