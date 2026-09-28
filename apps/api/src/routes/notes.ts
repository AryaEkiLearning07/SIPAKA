import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';
import { getCurrentUser } from '../auth';

export function registerNoteRoutes(server: FastifyInstance): void {
  // GET /api/v1/notes
  server.get('/api/v1/notes', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk melihat catatan hukum.' });
    }

    const query = request.query as { canonicalPath?: string };
    const where: any = { userId: user.id };
    if (query.canonicalPath) {
      where.canonicalPath = query.canonicalPath;
    }

    const notes = await prisma.userAnnotation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: notes,
      count: notes.length,
    };
  });

  // POST /api/v1/notes
  server.post('/api/v1/notes', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk menyimpan catatan.' });
    }

    const body = request.body as {
      id?: string;
      canonicalPath?: string;
      noteText?: string;
      color?: string;
      tags?: string;
    };

    if (!body.canonicalPath || !body.noteText) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'canonicalPath dan noteText wajib diisi.',
      });
    }

    if (body.id) {
      // Update existing note
      const existing = await prisma.userAnnotation.findUnique({
        where: { id: body.id },
      });

      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Catatan tidak ditemukan.' });
      }

      const updated = await prisma.userAnnotation.update({
        where: { id: body.id },
        data: {
          noteText: body.noteText,
          color: body.color ?? existing.color,
          tags: body.tags ?? existing.tags,
        },
      });

      return {
        success: true,
        action: 'UPDATED',
        data: updated,
      };
    }

    // Create new note
    const newNote = await prisma.userAnnotation.create({
      data: {
        userId: user.id,
        canonicalPath: body.canonicalPath,
        noteText: body.noteText,
        color: body.color || 'amber',
        tags: body.tags || null,
      },
    });

    return reply.code(201).send({
      success: true,
      action: 'CREATED',
      data: newNote,
    });
  });

  // DELETE /api/v1/notes/:id
  server.delete('/api/v1/notes/:id', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    }

    const { id } = request.params as { id: string };

    const note = await prisma.userAnnotation.findUnique({
      where: { id },
    });

    if (!note) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Catatan tidak ditemukan.' });
    }

    if (note.userId !== user.id) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke catatan ini.' });
    }

    await prisma.userAnnotation.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Catatan berhasil dihapus.',
    };
  });
}
