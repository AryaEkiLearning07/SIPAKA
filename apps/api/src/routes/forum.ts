import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

export function registerForumRoutes(server: FastifyInstance): void {
  // GET /api/v1/forum/categories
  server.get('/api/v1/forum/categories', async () => {
    const categories = [
      { id: 'SEMUA', label: 'Semua Kategori', icon: 'scale' },
      { id: 'ITE', label: 'Hukum Siber & ITE', icon: 'cpu' },
      { id: 'PIDANA', label: 'Hukum Pidana & KUHP', icon: 'shield-alert' },
      { id: 'PERDATA', label: 'Hukum Perdata & Kontrak', icon: 'file-text' },
      { id: 'TATA_NEGARA', label: 'Hukum Tata Negara & MK', icon: 'landmark' },
      { id: 'KETENAGAKERJAAN', label: 'Ketenagakerjaan & Bisnis', icon: 'briefcase' },
      { id: 'UMUM', label: 'Teori & Filsafat Hukum', icon: 'book-open' },
    ];

    const stats = await prisma.forumThread.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const categoryStats = categories.map((cat) => {
      const count = stats.find((s) => s.category === cat.id)?._count.id || 0;
      return { ...cat, count };
    });

    return { success: true, categories: categoryStats };
  });

  // GET /api/v1/forum/threads
  server.get('/api/v1/forum/threads', async (request) => {
    const query = request.query as {
      category?: string;
      type?: string;
      search?: string;
      sort?: 'latest' | 'top' | 'commented';
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.category && query.category !== 'SEMUA') {
      where.category = query.category;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
        { tags: { contains: query.search } },
        { pasalLabel: { contains: query.search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'top') {
      orderBy = { upvotesCount: 'desc' };
    } else if (query.sort === 'commented') {
      orderBy = { commentsCount: 'desc' };
    }

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              institution: true,
              reputationPoints: true,
              userBadges: { take: 2, select: { badgeName: true, icon: true } },
            },
          },
          _count: {
            select: { comments: true, upvotes: true },
          },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    return {
      success: true,
      data: threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // POST /api/v1/forum/threads
  server.post('/api/v1/forum/threads', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      // Fallback untuk kemudahan interaksi: jika belum login, gunakan demo mahasiswa jika ada
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MAHASISWA' } });
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk untuk membuat thread diskusi.' });
      }
    }

    const body = request.body as {
      title?: string;
      content?: string;
      category?: string;
      type?: string;
      canonicalPath?: string;
      pasalLabel?: string;
      tags?: string;
    };

    if (!body.title || body.title.trim().length < 5) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Judul minimal 5 karakter.' });
    }
    if (!body.content || body.content.trim().length < 10) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Konten minimal 10 karakter.' });
    }

    const thread = await prisma.forumThread.create({
      data: {
        userId: user.id,
        title: body.title.trim(),
        content: body.content.trim(),
        category: body.category || 'UMUM',
        type: body.type || 'KASUS',
        canonicalPath: body.canonicalPath || null,
        pasalLabel: body.pasalLabel || null,
        tags: body.tags || null,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, institution: true, reputationPoints: true },
        },
      },
    });

    // Tambah 5 poin reputasi
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationPoints: { increment: 5 } },
    });

    return reply.code(201).send({
      success: true,
      data: thread,
      reputationEarned: 5,
      message: 'Thread diskusi berhasil diterbitkan (+5 reputasi)!',
    });
  });

  // GET /api/v1/forum/threads/:id
  server.get('/api/v1/forum/threads/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await getCurrentUser(request);

    const thread = await prisma.forumThread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            institution: true,
            bio: true,
            reputationPoints: true,
            userBadges: { select: { badgeName: true, icon: true } },
          },
        },
        comments: {
          orderBy: [{ isVerified: 'desc' }, { upvotesCount: 'desc' }, { createdAt: 'asc' }],
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                institution: true,
                reputationPoints: true,
                userBadges: { select: { badgeName: true, icon: true } },
              },
            },
            upvotes: user ? { where: { userId: user.id } } : false,
          },
        },
        upvotes: user ? { where: { userId: user.id } } : false,
      },
    });

    if (!thread) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Thread diskusi tidak ditemukan.' });
    }

    const hasUpvoted = user ? thread.upvotes.length > 0 : false;
    const formattedComments = thread.comments.map((c) => ({
      ...c,
      hasUpvoted: user ? (c.upvotes as any)?.length > 0 : false,
    }));

    return {
      success: true,
      data: {
        ...thread,
        hasUpvoted,
        comments: formattedComments,
      },
    };
  });

  // POST /api/v1/forum/threads/:id/comments
  server.post('/api/v1/forum/threads/:id/comments', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MAHASISWA' } });
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk untuk mengirim komentar.' });
      }
    }

    const { id } = request.params as { id: string };
    const body = request.body as { content?: string };

    if (!body.content || body.content.trim().length < 3) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Komentar minimal 3 karakter.' });
    }

    const thread = await prisma.forumThread.findUnique({ where: { id } });
    if (!thread) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Thread tidak ditemukan.' });
    }

    const comment = await prisma.forumComment.create({
      data: {
        threadId: id,
        userId: user.id,
        content: body.content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, institution: true, reputationPoints: true },
        },
      },
    });

    // Update komentar count dan user reputasi (+2)
    await Promise.all([
      prisma.forumThread.update({
        where: { id },
        data: { commentsCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { reputationPoints: { increment: 2 } },
      }),
    ]);

    return reply.code(201).send({
      success: true,
      data: comment,
      reputationEarned: 2,
      message: 'Komentar terkirim (+2 reputasi)!',
    });
  });

  // POST /api/v1/forum/threads/:id/upvote
  server.post('/api/v1/forum/threads/:id/upvote', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk untuk upvote.' });
      }
    }

    const { id } = request.params as { id: string };
    const thread = await prisma.forumThread.findUnique({ where: { id } });
    if (!thread) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Thread tidak ditemukan.' });
    }

    const existing = await prisma.threadUpvote.findUnique({
      where: { threadId_userId: { threadId: id, userId: user.id } },
    });

    let upvoted = false;
    if (existing) {
      // Hapus upvote
      await prisma.threadUpvote.delete({ where: { id: existing.id } });
      await prisma.forumThread.update({
        where: { id },
        data: { upvotesCount: { decrement: 1 } },
      });
      // Kurangi reputasi pembuat thread
      await prisma.user.update({
        where: { id: thread.userId },
        data: { reputationPoints: { decrement: 1 } },
      });
      upvoted = false;
    } else {
      // Tambah upvote
      await prisma.threadUpvote.create({
        data: { threadId: id, userId: user.id },
      });
      await prisma.forumThread.update({
        where: { id },
        data: { upvotesCount: { increment: 1 } },
      });
      // Tambah reputasi pembuat thread
      await prisma.user.update({
        where: { id: thread.userId },
        data: { reputationPoints: { increment: 1 } },
      });
      upvoted = true;
    }

    const updated = await prisma.forumThread.findUnique({
      where: { id },
      select: { upvotesCount: true },
    });

    return {
      success: true,
      upvoted,
      upvotesCount: updated?.upvotesCount || 0,
    };
  });

  // POST /api/v1/forum/comments/:commentId/upvote
  server.post('/api/v1/forum/comments/:commentId/upvote', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk untuk upvote.' });
      }
    }

    const { commentId } = request.params as { commentId: string };
    const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Komentar tidak ditemukan.' });
    }

    const existing = await prisma.commentUpvote.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    let upvoted = false;
    if (existing) {
      await prisma.commentUpvote.delete({ where: { id: existing.id } });
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { upvotesCount: { decrement: 1 } },
      });
      await prisma.user.update({
        where: { id: comment.userId },
        data: { reputationPoints: { decrement: 1 } },
      });
      upvoted = false;
    } else {
      await prisma.commentUpvote.create({
        data: { commentId, userId: user.id },
      });
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { upvotesCount: { increment: 1 } },
      });
      await prisma.user.update({
        where: { id: comment.userId },
        data: { reputationPoints: { increment: 1 } },
      });
      upvoted = true;
    }

    const updated = await prisma.forumComment.findUnique({
      where: { id: commentId },
      select: { upvotesCount: true },
    });

    return {
      success: true,
      upvoted,
      upvotesCount: updated?.upvotesCount || 0,
    };
  });

  // POST /api/v1/forum/comments/:commentId/verify
  server.post('/api/v1/forum/comments/:commentId/verify', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user || (user.role !== 'DOSEN' && user.role !== 'KURATOR' && user.role !== 'ADMIN')) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'Hanya Dosen atau Kurator Hukum yang berhak memverifikasi argumen hukum.',
      });
    }

    const { commentId } = request.params as { commentId: string };
    const body = request.body as { verificationNote?: string };

    const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Komentar tidak ditemukan.' });
    }

    const updated = await prisma.forumComment.update({
      where: { id: commentId },
      data: {
        isVerified: true,
        verifiedBy: user.name,
        verificationNote: body.verificationNote || 'Argumen hukum terverifikasi oleh dosen/kurator.',
        verifiedAt: new Date(),
      },
    });

    // Beri bonus reputasi 15 poin kepada penulis komentar
    await prisma.user.update({
      where: { id: comment.userId },
      data: { reputationPoints: { increment: 15 } },
    });

    return {
      success: true,
      data: updated,
      message: 'Argumen hukum berhasil diverifikasi (+15 reputasi ke penulis)!',
    };
  });
}
