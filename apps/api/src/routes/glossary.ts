import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

export function registerGlossaryRoutes(server: FastifyInstance): void {
  // GET /api/v1/glossary
  server.get('/api/v1/glossary', async (request) => {
    const query = request.query as {
      search?: string;
      category?: string;
      letter?: string;
    };

    const where: any = {};
    if (query.category && query.category !== 'SEMUA') {
      where.category = query.category;
    }
    if (query.letter) {
      where.term = { startsWith: query.letter };
    }
    if (query.search) {
      where.OR = [
        { term: { contains: query.search } },
        { literalTranslation: { contains: query.search } },
        { legalDefinition: { contains: query.search } },
        { contextExample: { contains: query.search } },
      ];
    }

    const terms = await prisma.latinGlossary.findMany({
      where,
      orderBy: { term: 'asc' },
    });

    return {
      success: true,
      count: terms.length,
      data: terms,
    };
  });

  // GET /api/v1/glossary/detect?text=...
  server.get('/api/v1/glossary/detect', async (request, reply) => {
    const query = request.query as { text?: string };
    if (!query.text || query.text.trim().length === 0) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Parameter teks wajib disertakan.' });
    }

    const allTerms = await prisma.latinGlossary.findMany();
    const textLower = query.text.toLowerCase();

    // Deteksi istilah yang muncul di dalam teks
    const matched = allTerms.filter((term) => {
      const termLower = term.term.toLowerCase();
      // Cek apakah seluruh frasa atau kata kunci utama ada di dalam teks
      return textLower.includes(termLower);
    });

    return {
      success: true,
      count: matched.length,
      data: matched,
    };
  });

  // GET /api/v1/glossary/:term
  server.get('/api/v1/glossary/:term', async (request, reply) => {
    const { term } = request.params as { term: string };
    const decoded = decodeURIComponent(term);

    const item = await prisma.latinGlossary.findFirst({
      where: {
        OR: [
          { term: decoded },
          { term: { contains: decoded } },
        ],
      },
    });

    if (!item) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Istilah latin tidak ditemukan.' });
    }

    return { success: true, data: item };
  });

  // POST /api/v1/glossary
  server.post('/api/v1/glossary', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user || (user.role !== 'DOSEN' && user.role !== 'KURATOR' && user.role !== 'ADMIN')) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'Hanya Dosen, Kurator, atau Administrator yang dapat menambah istilah glosarium.',
      });
    }

    const body = request.body as {
      term?: string;
      literalTranslation?: string;
      legalDefinition?: string;
      contextExample?: string;
      category?: string;
    };

    if (!body.term || !body.literalTranslation || !body.legalDefinition) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'term, literalTranslation, dan legalDefinition wajib diisi.',
      });
    }

    const entry = await prisma.latinGlossary.upsert({
      where: { term: body.term.trim() },
      update: {
        literalTranslation: body.literalTranslation.trim(),
        legalDefinition: body.legalDefinition.trim(),
        contextExample: body.contextExample ? body.contextExample.trim() : null,
        category: body.category || 'ASAS_HUKUM',
      },
      create: {
        term: body.term.trim(),
        literalTranslation: body.literalTranslation.trim(),
        legalDefinition: body.legalDefinition.trim(),
        contextExample: body.contextExample ? body.contextExample.trim() : null,
        category: body.category || 'ASAS_HUKUM',
      },
    });

    return reply.code(201).send({
      success: true,
      data: entry,
      message: 'Istilah glosarium latin berhasil disimpan.',
    });
  });
}
