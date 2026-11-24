import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';

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
      // 1. Coba FULLTEXT search berkecepatan tinggi via index MATCH...AGAINST
      const cleanTerms = q
        .split(/\s+/)
        .map((t) => t.replace(/[^\w]/g, ''))
        .filter((t) => t.length > 0);

      if (cleanTerms.length > 0) {
        try {
          const booleanQuery = cleanTerms.map((t) => `+${t}*`).join(' ');
          const naturalQuery = cleanTerms.join(' ');

          let sql = `
            SELECT 
              pr.id, pr.content, pr.versionTag,
              p.canonicalPath, p.label, p.title as provisionTitle,
              li.slug as instrumentSlug, li.title as instrumentTitle, li.shortTitle as instrumentShortTitle,
              li.type as instrumentType, li.number as instrumentNumber, li.year as instrumentYear, li.status as instrumentStatus,
              MATCH(pr.content) AGAINST(? IN BOOLEAN MODE) as score
            FROM provision_revisions pr
            JOIN provisions p ON pr.provisionId = p.id
            JOIN legal_instruments li ON p.legalInstrumentId = li.id
            WHERE MATCH(pr.content) AGAINST(? IN BOOLEAN MODE)
              AND pr.effectiveUntil IS NULL
          `;
          const params: unknown[] = [naturalQuery, booleanQuery];

          if (query.slug) {
            sql += ` AND li.slug = ?`;
            params.push(query.slug);
          }

          sql += ` ORDER BY score DESC LIMIT ?`;
          params.push(limit);

          const rawResults = (await (prisma as any).$queryRawUnsafe(sql, ...params)) as any[];

          if (Array.isArray(rawResults) && rawResults.length > 0) {
            const results = rawResults.map((r) => ({
              id: r.id,
              canonicalPath: r.canonicalPath,
              label: r.label,
              title: r.provisionTitle,
              content: r.content,
              versionTag: r.versionTag,
              score: Number(r.score) || 0,
              instrument: {
                slug: r.instrumentSlug,
                title: r.instrumentTitle,
                shortTitle: r.instrumentShortTitle,
                type: r.instrumentType,
                number: r.instrumentNumber,
                year: r.instrumentYear,
                status: r.instrumentStatus,
              },
            }));

            return {
              query: q,
              mode: 'FULLTEXT_INDEX',
              total: results.length,
              results,
            };
          }
        } catch (ftErr) {
          server.log.warn({ err: ftErr }, 'FULLTEXT query fallback to Prisma contains');
        }
      }

      // 2. Fallback aman jika FULLTEXT tidak mengembalikan hasil atau kata terlalu pendek
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
          score: 1.0,
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
        mode: 'PRISMA_CONTAINS_FALLBACK',
        total: results.length,
        results,
      };
    } catch (e) {
      server.log.error(e);
      return reply.code(500).send({ error: 'SEARCH_FAILED', message: String(e) });
    }
  });
}
