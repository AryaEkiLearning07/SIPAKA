import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

function getReputationTitle(points: number): string {
  if (points >= 1000) return 'Cendekiawan Agung Hukum (Grand Jurist)';
  if (points >= 500) return 'Pakar Doktrin & Kurator';
  if (points >= 250) return 'Peneliti Hukum Senior';
  if (points >= 100) return 'Yuris Muda Berprestasi';
  return 'Pemerhati Hukum Perundang-Undangan';
}

export function registerProfileRoutes(server: FastifyInstance): void {
  // GET /api/v1/profile/me
  server.get('/api/v1/profile/me', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MAHASISWA' } });
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk terlebih dahulu.' });
      }
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userBadges: { orderBy: { awardedAt: 'desc' } },
        _count: {
          select: {
            forumThreads: true,
            forumComments: true,
            repositoryEntries: true,
            bookmarks: true,
            annotations: true,
          },
        },
      },
    });

    if (!userData) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' });
    }

    return {
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bio: userData.bio || 'Pengkaji version control perundang-undangan Indonesia.',
        institution: userData.institution || 'Fakultas Hukum',
        reputationPoints: userData.reputationPoints,
        reputationTitle: getReputationTitle(userData.reputationPoints),
        badges: userData.userBadges,
        stats: {
          threadsCount: userData._count.forumThreads,
          commentsCount: userData._count.forumComments,
          repositoryCount: userData._count.repositoryEntries,
          bookmarksCount: userData._count.bookmarks,
          annotationsCount: userData._count.annotations,
        },
      },
    };
  });

  // PUT /api/v1/profile/me
  server.put('/api/v1/profile/me', async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk.' });
    }

    const body = request.body as { name?: string; bio?: string; institution?: string };

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name ? body.name.trim() : undefined,
        bio: body.bio !== undefined ? body.bio.trim() : undefined,
        institution: body.institution !== undefined ? body.institution.trim() : undefined,
      },
      select: { id: true, name: true, email: true, role: true, bio: true, institution: true, reputationPoints: true },
    });

    return {
      success: true,
      data: updated,
      message: 'Profil berhasil diperbarui.',
    };
  });

  // GET /api/v1/profile/leaderboard
  server.get('/api/v1/profile/leaderboard', async () => {
    const topUsers = await prisma.user.findMany({
      orderBy: { reputationPoints: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        role: true,
        institution: true,
        reputationPoints: true,
        userBadges: { take: 2, select: { badgeName: true, icon: true } },
      },
    });

    const formatted = topUsers.map((u, idx) => ({
      ...u,
      rank: idx + 1,
      reputationTitle: getReputationTitle(u.reputationPoints),
    }));

    return { success: true, data: formatted };
  });

  // GET /api/v1/profile/:userId
  server.get('/api/v1/profile/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const u = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBadges: true,
        forumThreads: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, category: true, upvotesCount: true, createdAt: true },
        },
        repositoryEntries: {
          where: { visibility: 'PUBLIK' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, category: true, createdAt: true },
        },
      },
    });

    if (!u) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Profil tidak ditemukan.' });
    }

    return {
      success: true,
      data: {
        id: u.id,
        name: u.name,
        role: u.role,
        bio: u.bio,
        institution: u.institution,
        reputationPoints: u.reputationPoints,
        reputationTitle: getReputationTitle(u.reputationPoints),
        badges: u.userBadges,
        recentThreads: u.forumThreads,
        publicRepository: u.repositoryEntries,
      },
    };
  });
}
