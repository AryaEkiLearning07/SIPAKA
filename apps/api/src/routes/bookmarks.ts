import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

export function registerBookmarkRoutes(server: FastifyInstance): void {
  // GET /api/v1/bookmarks
  server.get('/api/v1/bookmarks', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk mengakses markah buku.' });
    }

    const query = request.query as { instrumentSlug?: string; canonicalPath?: string };
    const where: any = { userId: user.id };
    if (query.instrumentSlug) where.instrumentSlug = query.instrumentSlug;
    if (query.canonicalPath) where.canonicalPath = query.canonicalPath;

    const bookmarks = await prisma.userBookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: bookmarks,
      count: bookmarks.length,
    };
  });

  // POST /api/v1/bookmarks
  server.post('/api/v1/bookmarks', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk menyimpan markah buku.' });
    }

    const body = request.body as {
      canonicalPath?: string;
      label?: string;
      instrumentSlug?: string;
      notes?: string;
    };

    if (!body.canonicalPath || !body.label) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'canonicalPath dan label wajib diisi.',
      });
    }

    const instrumentSlug = body.instrumentSlug || body.canonicalPath.split('/')[0] || 'general';

    // Cek apakah sudah ada bookmark pada pasal ini untuk user bersangkutan
    const existing = await prisma.userBookmark.findUnique({
      where: {
        userId_canonicalPath: {
          userId: user.id,
          canonicalPath: body.canonicalPath,
        },
      },
    });

    if (existing) {
      // Toggle off / hapus jika sudah ada
      await prisma.userBookmark.delete({
        where: { id: existing.id },
      });
      return {
        success: true,
        action: 'REMOVED',
        message: 'Markah buku berhasil dihapus.',
        data: null,
      };
    }

    const newBookmark = await prisma.userBookmark.create({
      data: {
        userId: user.id,
        canonicalPath: body.canonicalPath,
        label: body.label,
        instrumentSlug,
        notes: body.notes ?? null,
      },
    });

    return reply.code(201).send({
      success: true,
      action: 'CREATED',
      message: 'Markah buku berhasil disimpan.',
      data: newBookmark,
    });
  });

  // DELETE /api/v1/bookmarks/:id
  server.delete('/api/v1/bookmarks/:id', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    }

    const { id } = request.params as { id: string };

    const bookmark = await prisma.userBookmark.findUnique({
      where: { id },
    });

    if (!bookmark) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Markah buku tidak ditemukan.' });
    }

    if (bookmark.userId !== user.id) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Anda tidak memiliki hak atas markah buku ini.' });
    }

    await prisma.userBookmark.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Markah buku berhasil dihapus.',
    };
  });
}
