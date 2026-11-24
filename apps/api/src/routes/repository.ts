import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

export function registerRepositoryRoutes(server: FastifyInstance): void {
  // GET /api/v1/repository
  server.get('/api/v1/repository', async (request) => {
    const user = await getCurrentUser(request);
    const query = request.query as {
      category?: string;
      visibility?: string;
      search?: string;
      onlyMine?: string;
    };

    const where: any = {};

    if (query.onlyMine === 'true' && user) {
      where.userId = user.id;
    } else if (user) {
      where.OR = [
        { visibility: 'PUBLIK' },
        { userId: user.id },
      ];
    } else {
      where.visibility = 'PUBLIK';
    }

    if (query.category && query.category !== 'SEMUA') {
      where.category = query.category;
    }

    if (query.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.search } },
            { caseFact: { contains: query.search } },
            { legalAnalysis: { contains: query.search } },
            { tags: { contains: query.search } },
          ],
        },
      ];
    }

    const entries = await prisma.repositoryEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true, institution: true },
        },
      },
    });

    return {
      success: true,
      data: entries,
      count: entries.length,
    };
  });

  // POST /api/v1/repository
  server.post('/api/v1/repository', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MAHASISWA' } });
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk.' });
      }
    }

    const body = request.body as {
      title?: string;
      category?: string;
      caseFact?: string;
      legalAnalysis?: string;
      attachedProvisions?: any;
      visibility?: 'PUBLIK' | 'PRIVAT';
      tags?: string;
    };

    if (!body.title || body.title.trim().length < 5) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Judul minimal 5 karakter.' });
    }
    if (!body.legalAnalysis || body.legalAnalysis.trim().length < 10) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Analisis hukum minimal 10 karakter.' });
    }

    const entry = await prisma.repositoryEntry.create({
      data: {
        userId: user.id,
        title: body.title.trim(),
        category: body.category || 'STUDI_KASUS',
        caseFact: body.caseFact ? body.caseFact.trim() : null,
        legalAnalysis: body.legalAnalysis.trim(),
        attachedProvisions: body.attachedProvisions || null,
        visibility: body.visibility || 'PRIVAT',
        tags: body.tags || null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Tambah 5 poin reputasi untuk kontribusi repositori
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationPoints: { increment: 5 } },
    });

    return reply.code(201).send({
      success: true,
      data: entry,
      message: 'Entri repositori berhasil disimpan (+5 reputasi)!',
    });
  });

  // GET /api/v1/repository/:id
  server.get('/api/v1/repository/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await getCurrentUser(request);

    const entry = await prisma.repositoryEntry.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true, institution: true, reputationPoints: true } },
      },
    });

    if (!entry) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Entri repositori tidak ditemukan.' });
    }

    if (entry.visibility === 'PRIVAT' && (!user || user.id !== entry.userId)) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Entri ini bersifat privat.' });
    }

    return { success: true, data: entry };
  });

  // PUT /api/v1/repository/:id
  server.put('/api/v1/repository/:id', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk.' });
    }

    const { id } = request.params as { id: string };
    const entry = await prisma.repositoryEntry.findUnique({ where: { id } });
    if (!entry) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Entri tidak ditemukan.' });
    }

    if (entry.userId !== user.id && user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Anda hanya dapat mengubah entri milik sendiri.' });
    }

    const body = request.body as any;
    const updated = await prisma.repositoryEntry.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        category: body.category !== undefined ? body.category : undefined,
        caseFact: body.caseFact !== undefined ? body.caseFact : undefined,
        legalAnalysis: body.legalAnalysis !== undefined ? body.legalAnalysis.trim() : undefined,
        attachedProvisions: body.attachedProvisions !== undefined ? body.attachedProvisions : undefined,
        visibility: body.visibility !== undefined ? body.visibility : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
      },
    });

    return { success: true, data: updated, message: 'Entri repositori berhasil diperbarui.' };
  });

  // DELETE /api/v1/repository/:id
  server.delete('/api/v1/repository/:id', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk.' });
    }

    const { id } = request.params as { id: string };
    const entry = await prisma.repositoryEntry.findUnique({ where: { id } });
    if (!entry) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Entri tidak ditemukan.' });
    }

    if (entry.userId !== user.id && user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Anda hanya dapat menghapus entri milik sendiri.' });
    }

    await prisma.repositoryEntry.delete({ where: { id } });
    return { success: true, message: 'Entri repositori berhasil dihapus.' };
  });
}
