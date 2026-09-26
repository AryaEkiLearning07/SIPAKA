import { FastifyInstance } from 'fastify';
import { prisma } from '@lexvera/database';

/** Dasbor pemilik: agregasi nyata dari catalog_index + instrumen (dipakai halaman /pipeline). */
export function registerMonitoringRoutes(server: FastifyInstance): void {
  server.get('/api/v1/monitoring', async () => {
    const [perStatus, perTahun, instruments, provisions, karantina] = await Promise.all([
      prisma.$queryRawUnsafe<{ status: string; jml: bigint }[]>(
        "SELECT status, COUNT(*) AS jml FROM catalog_index GROUP BY status"
      ),
      prisma.$queryRawUnsafe<{ tahun: string; jml: bigint }[]>(
        "SELECT tahun, COUNT(*) AS jml FROM catalog_index WHERE jenis='UU' GROUP BY tahun ORDER BY CAST(tahun AS UNSIGNED) DESC LIMIT 12"
      ),
      prisma.legalInstrument.findMany({
        select: { confidenceScore: true },
      }),
      prisma.provision.count(),
      prisma.catalogIndex.findMany({
        where: { status: 'KARANTINA' },
        select: { slug: true, tahun: true, skor: true },
        orderBy: { diupdate: 'desc' },
        take: 12,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const r of perStatus) statusMap[r.status] = Number(r.jml);
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    const skorList = instruments.map((i) => i.confidenceScore).filter((s): s is number => typeof s === 'number');
    const rataSkor = skorList.length ? Math.round(skorList.reduce((a, b) => a + b, 0) / skorList.length) : null;

    return {
      katalog: {
        total,
        terdaftar: statusMap['TERDAFTAR'] ?? 0,
        terunduh: statusMap['TERUNDUH'] ?? 0,
        terparse: statusMap['TERPARSE'] ?? 0,
        lolos: statusMap['LOLOS'] ?? 0,
        karantina: statusMap['KARANTINA'] ?? 0,
        gagalUnduh: statusMap['GAGAL_UNDUH'] ?? 0,
        gagalParse: statusMap['GAGAL_PARSE'] ?? 0,
      },
      perTahunUU: perTahun.map((r) => ({ tahun: r.tahun, jumlah: Number(r.jml) })),
      database: {
        instruments: instruments.length,
        provisions,
        teraSkor: skorList.length,
        rataSkor,
      },
      karantinaTerbaru: karantina,
      dihitungPada: new Date().toISOString(),
    };
  });
}
