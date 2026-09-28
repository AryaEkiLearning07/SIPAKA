import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@lexvera/database';
import { getCurrentUser } from '../auth';

/**
 * Middleware Proteksi Otoritas Administrator Utama
 */
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = await getCurrentUser(request);
  if (!user) {
    reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Sesi berakhir. Silakan masuk kembali.' });
    return null;
  }
  if (user.role !== 'ADMIN') {
    reply.code(403).send({
      error: 'FORBIDDEN_ACCESS',
      message: 'Akses Ditolak: Halaman dan wewenang ini eksklusif untuk Administrator Utama berstandar ISO 9001/27001.',
    });
    return null;
  }
  return user;
}

export function registerAdminRoutes(server: FastifyInstance): void {
  // GET /api/v1/admin/overview — Dashboard Telemetri & KPI Eksekutif
  server.get('/api/v1/admin/overview', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const [
      totalUsers,
      totalInstruments,
      totalProvisions,
      totalOperations,
      pendingChangeSets,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.legalInstrument.count(),
      prisma.provision.count(),
      prisma.changeOperation.count(),
      prisma.changeSet.count({
        where: { status: { in: ['DRAFT', 'IN_REVIEW'] } },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      admin: { name: admin.name, email: admin.email, role: admin.role },
      stats: {
        totalUsers,
        totalInstruments,
        totalProvisions,
        totalOperations,
        pendingApprovalCount: pendingChangeSets,
      },
      recentLogs: recentAuditLogs,
      isoCompliance: {
        standard: 'ISO 9001:2015 Clause 7.5 & ISO 27001',
        auditTrailStatus: 'ACTIVE_APPEND_ONLY',
        databaseEngine: 'MariaDB 10.4/10.11 InnoDB',
      },
    };
  });

  // GET /api/v1/admin/users — Tata Kelola Pengguna (User Governance)
  server.get('/api/v1/admin/users', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDemo: true,
        createdAt: true,
        _count: {
          select: {
            bookmarks: true,
            annotations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: users,
      count: users.length,
    };
  });

  // PATCH /api/v1/admin/users/:id/role — Perubahan Peran Pengguna
  server.patch('/api/v1/admin/users/:id/role', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const body = request.body as { role: 'MAHASISWA' | 'DOSEN' | 'KURATOR' | 'ADMIN' };

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
    });

    // Catat ke Audit Log ISO
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        userRole: admin.role,
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: id,
        details: {
          targetUserEmail: targetUser.email,
          previousRole: targetUser.role,
          newRole: body.role,
        },
      },
    });

    return {
      success: true,
      message: `Peran ${updated.name} berhasil diperbarui menjadi ${updated.role}.`,
      data: updated,
    };
  });

  // GET /api/v1/admin/changesets — Gerbang Kurasi Dokumen & Persetujuan (ISO 7.5.3)
  server.get('/api/v1/admin/changesets', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const changeSets = await prisma.changeSet.findMany({
      include: {
        amendingInstrument: {
          select: { title: true, shortTitle: true, number: true, year: true, type: true },
        },
        targetInstrument: {
          select: { title: true, shortTitle: true, number: true, year: true, type: true },
        },
        _count: {
          select: { operations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: changeSets,
    };
  });

  // POST /api/v1/admin/changesets/:id/approval — Stempel Persetujuan ISO 9001
  server.post('/api/v1/admin/changesets/:id/approval', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const body = request.body as { decision: 'APPROVED' | 'CHANGES_REQUESTED'; notes?: string };

    const changeSet = await prisma.changeSet.findUnique({
      where: { id },
      include: { targetInstrument: true, amendingInstrument: true },
    });

    if (!changeSet) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Peristiwa amandemen tidak ditemukan.' });
    }

    const nextStatus = body.decision === 'APPROVED' ? 'PUBLISHED' : 'IN_REVIEW';

    const [updatedChangeSet, reviewRecord] = await prisma.$transaction([
      prisma.changeSet.update({
        where: { id },
        data: { status: nextStatus },
      }),
      prisma.reviewRecord.create({
        data: {
          changeSetId: id,
          reviewerName: admin.name,
          reviewerRole: admin.role,
          decision: body.decision,
          notes: body.notes || 'Persetujuan resmi Administrator Utama berstandar ISO 9001:2015 Klausul 7.5.3.',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          userName: admin.name,
          userRole: admin.role,
          action: body.decision === 'APPROVED' ? 'CHANGESET_APPROVED_PUBLISHED' : 'CHANGESET_REVISION_REQUESTED',
          entity: 'ChangeSet',
          entityId: id,
          details: {
            title: changeSet.title,
            amending: changeSet.amendingInstrument.shortTitle || changeSet.amendingInstrument.title,
            target: changeSet.targetInstrument.shortTitle || changeSet.targetInstrument.title,
            decision: body.decision,
            notes: body.notes,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: `Amandemen "${changeSet.title}" telah disetujui dan berstatus ${nextStatus} (ISO Stamped).`,
      data: { changeSet: updatedChangeSet, review: reviewRecord },
    };
  });

  // GET /api/v1/admin/audit-logs — Buku Log Audit ISO 27001 (Append-Only)
  server.get('/api/v1/admin/audit-logs', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const query = request.query as { limit?: string };
    const take = parseInt(query.limit || '50', 10);

    const logs = await prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  });
}
