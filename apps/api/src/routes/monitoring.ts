import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PKG = fs.existsSync(path.resolve(process.cwd(), 'packages/database'))
  ? path.resolve(process.cwd(), 'packages/database')
  : path.resolve(__dirname, '../../../../packages/database');

/** Dasbor pemilik: agregasi nyata dari catalog_index + instrumen + worker telemetry (dipakai halaman /pipeline). */
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

  // Antrean per dokumen: UU apa, status, berapa pasal/ayat, berapa perubahan
  server.get('/api/v1/monitoring/queue', async (request) => {
    const q = request.query as { status?: string; jenis?: string; limit?: string };
    const status = q.status ?? 'LOLOS';
    const jenis = q.jenis ?? 'UU';
    const limit = Math.min(parseInt(q.limit ?? '50', 10) || 50, 200);

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ci.slug AS slug, ci.nomor AS nomor, ci.tahun AS tahun, ci.status AS status,
              ci.skor AS skor,
              COALESCE(ci.pasalCount, (SELECT COUNT(*) FROM provisions p
                WHERE p.legalInstrumentId = li.id AND p.type = 'PASAL')) AS pasal,
              (SELECT COUNT(*) FROM provisions p
                WHERE p.legalInstrumentId = li.id AND p.type IN ('AYAT','ANGKA')) AS ayat,
              (SELECT COUNT(*) FROM change_operations co
                WHERE co.changeSetId IN
                  (SELECT id FROM change_sets cs WHERE cs.targetInstrumentId = li.id)) AS perubahan
       FROM catalog_index ci
       LEFT JOIN legal_instruments li ON li.slug = ci.slug
       WHERE ci.jenis = ? AND ci.status = ?
       ORDER BY CAST(ci.tahun AS UNSIGNED) DESC, ci.slug
       LIMIT ?`,
      jenis, status, limit
    );

    const antrean = rows.map((r) => ({
      slug: String(r.slug ?? ''),
      nomor: r.nomor ? String(r.nomor) : null,
      tahun: r.tahun ? String(r.tahun) : null,
      status: String(r.status ?? ''),
      skor: r.skor === null || r.skor === undefined ? null : Number(r.skor),
      pasal: Number(r.pasal ?? 0),
      ayat: Number(r.ayat ?? 0),
      perubahan: Number(r.perubahan ?? 0),
    }));

    return { status, jenis, jumlah: antrean.length, antrean };
  });

  // Telemetri Live Worker Harvester (JDIH BPK)
  server.get('/api/v1/monitoring/crawler', async () => {
    const statusFile = path.join(DB_PKG, 'crawler_status.json');
    const checkpointFile = path.join(DB_PKG, 'crawler_checkpoint.json');
    const logFile = path.join(DB_PKG, 'logs/crawler_worker.log');
    const indexFile = path.join(DB_PKG, 'seed/structured/catalog-index.jsonl');
    const richFile = path.join(DB_PKG, 'seed/structured/catalog-rich.jsonl');

    let workerStatus = {
      state: 'IDLE',
      phase: 'IDLE',
      pid: null as number | null,
      currentSlug: null as string | null,
      currentTitle: null as string | null,
      lastHeartbeat: null as string | null,
      stats: { total_indexed: 0, processed: 0, published: 0, quarantined: 0, errors: 0 },
    };
    if (fs.existsSync(statusFile)) {
      try {
        workerStatus = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
      } catch {}
    }

    let checkpoint = { processed_slugs: [] as string[], total_processed: 0, last_run: null as string | null };
    if (fs.existsSync(checkpointFile)) {
      try {
        checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
      } catch {}
    }

    let logs: string[] = [];
    if (fs.existsSync(logFile)) {
      try {
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
        logs = lines.slice(-40);
      } catch {}
    }

    let totalIndexed = 0;
    if (fs.existsSync(indexFile)) {
      try {
        totalIndexed = fs.readFileSync(indexFile, 'utf-8').split('\n').filter(Boolean).length;
      } catch {}
    }

    let totalRich = 0;
    if (fs.existsSync(richFile)) {
      try {
        totalRich = fs.readFileSync(richFile, 'utf-8').split('\n').filter(Boolean).length;
      } catch {}
    }

    const processedSlugs = checkpoint.processed_slugs || [];

    return {
      success: true,
      worker: workerStatus,
      checkpoint: {
        totalProcessed: checkpoint.total_processed || processedSlugs.length,
        lastRun: checkpoint.last_run,
        processedCount: processedSlugs.length,
      },
      queue: {
        totalIndexed,
        totalRich,
        pending: Math.max(0, totalIndexed - processedSlugs.length),
      },
      logs,
      timestamp: new Date().toISOString(),
    };
  });

  // Picu Batch Pemanenan Worker Harvester
  server.post('/api/v1/monitoring/crawler/trigger', async (request, reply) => {
    const body = request.body as { limit?: number; delay?: number } | undefined;
    const limit = Math.min(Math.max(body?.limit || 5, 1), 50);
    const delay = Math.max(body?.delay || 1.5, 1.0);

    const workerScript = path.join(DB_PKG, 'scripts/crawler_worker.py');

    try {
      const child = spawn(
        process.platform === 'win32' ? 'python' : 'python3',
        [workerScript, '--batch', String(limit), '--delay', String(delay)],
        {
          cwd: DB_PKG,
          detached: true,
          stdio: 'ignore',
        }
      );
      child.unref();

      return {
        success: true,
        message: `Worker crawler berhasil dipicu untuk batch ${limit} dokumen (PID: ${child.pid}).`,
        pid: child.pid,
        limit,
        delay,
      };
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Hentikan Worker Harvester secara Graceful
  server.post('/api/v1/monitoring/crawler/stop', async () => {
    const statusFile = path.join(DB_PKG, 'crawler_status.json');
    if (fs.existsSync(statusFile)) {
      try {
        const st = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
        if (st.pid && typeof st.pid === 'number') {
          process.kill(st.pid, 'SIGTERM');
        }
        st.state = 'STOPPED';
        st.phase = 'INTERRUPTED_BY_USER';
        fs.writeFileSync(statusFile, JSON.stringify(st, null, 2), 'utf-8');
        return { success: true, message: `Signal henti dikirim ke worker (PID: ${st.pid}).` };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    return { success: true, message: 'Tidak ada status worker aktif.' };
  });

  // Produk Launching & Naskah Konsolidasi Jadi Terkini
  server.get('/api/v1/monitoring/consolidations', async () => {
    const [instruments, recentOperations] = await Promise.all([
      prisma.legalInstrument.findMany({
        take: 12,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          type: true,
          number: true,
          year: true,
          title: true,
          shortTitle: true,
          status: true,
          confidenceScore: true,
          publishMode: true,
          promulgatedAt: true,
          _count: {
            select: {
              provisions: true,
              modificationsReceived: true,
              modificationsMade: true,
            },
          },
        },
      }),
      prisma.changeOperation.findMany({
        take: 8,
        orderBy: { orderInSet: 'asc' },
        select: {
          id: true,
          operationType: true,
          sourceReference: true,
          orderInSet: true,
          targetProvision: {
            select: {
              canonicalPath: true,
              label: true,
            },
          },
          changeSet: {
            select: {
              title: true,
              amendingInstrument: {
                select: { slug: true, shortTitle: true, number: true, year: true },
              },
              targetInstrument: {
                select: { slug: true, shortTitle: true, number: true, year: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      instruments: instruments.map((i) => ({
        id: i.id,
        slug: i.slug,
        label: `${i.type} No. ${i.number} Thn ${i.year}`,
        title: i.shortTitle || i.title,
        status: i.status,
        score: i.confidenceScore,
        publishMode: i.publishMode,
        provisionsCount: i._count.provisions,
        amendmentsReceived: i._count.modificationsReceived,
        amendmentsMade: i._count.modificationsMade,
      })),
      recentOperations: recentOperations.map((op) => ({
        id: op.id,
        type: op.operationType,
        targetPath: op.targetProvision?.canonicalPath || op.targetProvision?.label || 'Pasal',
        sourceReference: op.sourceReference,
        changeSetTitle: op.changeSet.title,
        amending: op.changeSet.amendingInstrument
          ? `${op.changeSet.amendingInstrument.shortTitle || `UU ${op.changeSet.amendingInstrument.number}/${op.changeSet.amendingInstrument.year}`}`
          : 'Amandemen',
        target: op.changeSet.targetInstrument
          ? `${op.changeSet.targetInstrument.shortTitle || `UU ${op.changeSet.targetInstrument.number}/${op.changeSet.targetInstrument.year}`}`
          : 'Pokok',
      })),
    };
  });

  // Daftar Rumpun / Keluarga Hukum & Pemetaan ke Antrean Pemanenan
  server.get('/api/v1/monitoring/families', async () => {
    const families = [
      {
        id: 'siber-ite',
        name: 'Siber, Transaksi Elektronik & Informasi',
        description: 'Regulasi ruang digital, tanda tangan elektronik, transaksi sistem, dan tindak pidana siber.',
        coreLaw: 'UU No. 11 Tahun 2008 (UU ITE)',
        status: 'TERKONSOLIDASI_PENUH',
        documents: [
          { slug: 'ite', label: 'UU No. 11 Tahun 2008', role: 'UU POKOK', status: 'DIUBAH', inDb: true, provisions: 209 },
          { slug: 'uu-19-2016', label: 'UU No. 19 Tahun 2016', role: 'AMANDEMEN 1', status: 'BERLAKU', inDb: true, provisions: 0 },
          { slug: 'uu-1-2024', label: 'UU No. 1 Tahun 2024', role: 'AMANDEMEN 2', status: 'BERLAKU', inDb: true, provisions: 0 },
          { slug: 'putusan-mk-50-2008', label: 'Putusan MK 50/PUU-VI/2008', role: 'PUTUSAN MK', status: 'ERGA_OMNES', inDb: true, provisions: 1 },
        ],
      },
      {
        id: 'pidana-kodifikasi',
        name: 'Hukum Pidana & Kodifikasi Nasional',
        description: 'Kodifikasi hukum pidana materiil Indonesia menggantikan KUHP warisan kolonial WvS 1915.',
        coreLaw: 'UU No. 1 Tahun 2023 (KUHP Baru)',
        status: 'TERINGEST_100_PERSEN',
        documents: [
          { slug: 'kuhp-wvs-1915', label: 'KUHP (WvS 1915 jo. UU 1/1946)', role: 'UU POKOK LAMA', status: 'TRANSISI', inDb: false, provisions: 569 },
          { slug: 'uu-1-2023', label: 'UU No. 1 Tahun 2023', role: 'KODIFIKASI BARU', status: 'BERLAKU', inDb: true, provisions: 1336 },
        ],
      },
      {
        id: 'data-pribadi',
        name: 'Perlindungan Data Pribadi & Privasi',
        description: 'Standar pelindungan hak subjek data, kewajiban pengendali & prosesor data, serta transfer data.',
        coreLaw: 'UU No. 27 Tahun 2022 (UU PDP)',
        status: 'TERINGEST_100_PERSEN',
        documents: [
          { slug: 'uu-27-2022', label: 'UU No. 27 Tahun 2022', role: 'UU POKOK', status: 'BERLAKU', inDb: true, provisions: 272 },
        ],
      },
      {
        id: 'korporasi-konsumen',
        name: 'Hukum Korporasi, Bisnis & Konsumen',
        description: 'Tata kelola perseroan terbatas, tanggung jawab direksi/komisaris, serta hak konsumen nasional.',
        coreLaw: 'UU No. 40 Tahun 2007 & UU No. 8 Tahun 1999',
        status: 'TERINGEST_100_PERSEN',
        documents: [
          { slug: 'uu-40-2007', label: 'UU No. 40 Tahun 2007 (UU PT)', role: 'UU POKOK', status: 'BERLAKU', inDb: true, provisions: 909 },
          { slug: 'uu-8-1999', label: 'UU No. 8 Tahun 1999 (UUPK)', role: 'UU POKOK', status: 'BERLAKU', inDb: true, provisions: 250 },
        ],
      },
      {
        id: 'cipta-kerja',
        name: 'Ketenagakerjaan & Kemudahan Berusaha (Cipta Kerja)',
        description: 'Regulasi omnibus law perizinan berusaha, ketenagakerjaan, investasi, dan perpajakan terpadu.',
        coreLaw: 'UU No. 6 Tahun 2023',
        status: 'SIAP_DIPANEN',
        documents: [
          { slug: 'uu-13-2003', label: 'UU No. 13 Tahun 2003 (Ketenagakerjaan)', role: 'UU POKOK LAMA', status: 'DIUBAH', inDb: false, provisions: 193 },
          { slug: 'uu-11-2020', label: 'UU No. 11 Tahun 2020 (Ciptaker 1)', role: 'OMNIBUS LAMA', status: 'DICABUT', inDb: false, provisions: 186 },
          { slug: 'uu-no-6-tahun-2023', label: 'UU No. 6 Tahun 2023 (Penetapan Perpu Ciptaker)', role: 'OMNIBUS AKTIF', status: 'TERDAFTAR', inDb: false, provisions: 186 },
        ],
      },
      {
        id: 'wilayah-daerah',
        name: 'Penataan Daerah & Pemekaran Wilayah (2024–2025)',
        description: 'Kluster undang-undang pembentukan provinsi, kabupaten, dan kota hasil legislasi DPR/Presiden.',
        coreLaw: '14 Undang-Undang Pemekaran & Pembentukan Wilayah',
        status: 'TERINGEST_100_PERSEN',
        documents: [
          { slug: 'uu-no-146-tahun-2024', label: 'UU No. 146 Tahun 2024', role: 'PEMBENTUKAN', status: 'BERLAKU', inDb: true, provisions: 22 },
          { slug: 'uu-no-147-tahun-2024', label: 'UU No. 147 Tahun 2024', role: 'PEMBENTUKAN', status: 'BERLAKU', inDb: true, provisions: 22 },
          { slug: 'uu-no-148-tahun-2024', label: 'UU No. 148 Tahun 2024', role: 'PEMBENTUKAN', status: 'BERLAKU', inDb: true, provisions: 21 },
          { slug: 'uu-no-149-tahun-2024', label: 'UU No. 149 Tahun 2024', role: 'PEMBENTUKAN', status: 'BERLAKU', inDb: true, provisions: 21 },
          { slug: 'uu-no-150-tahun-2024', label: 'UU No. 150 Tahun 2024', role: 'PEMBENTUKAN', status: 'BERLAKU', inDb: true, provisions: 18 },
          { slug: 'uu-no-4-tahun-2025', label: 'UU No. 4 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 22 },
          { slug: 'uu-no-5-tahun-2025', label: 'UU No. 5 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 20 },
          { slug: 'uu-no-6-tahun-2025', label: 'UU No. 6 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 21 },
          { slug: 'uu-no-7-tahun-2025', label: 'UU No. 7 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 21 },
          { slug: 'uu-no-8-tahun-2025', label: 'UU No. 8 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 17 },
          { slug: 'uu-no-9-tahun-2025', label: 'UU No. 9 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 25 },
          { slug: 'uu-no-11-tahun-2025', label: 'UU No. 11 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 20 },
          { slug: 'uu-no-12-tahun-2025', label: 'UU No. 12 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 21 },
          { slug: 'uu-no-15-tahun-2025', label: 'UU No. 15 Tahun 2025', role: 'PENATAAN', status: 'BERLAKU', inDb: true, provisions: 13 },
        ],
      },
      {
        id: 'tipikor-integritas',
        name: 'Tindak Pidana Korupsi (Tipikor) & Integritas Penegakan Hukum',
        description: 'Kluster delik korupsi, kelembagaan KPK, peradilan tipikor khusus, serta pencegahan tindak pidana pencucian uang.',
        coreLaw: 'UU No. 31 Tahun 1999 jo. UU No. 20 Tahun 2001',
        status: 'ANTREAN_PRIORITAS_1',
        documents: [
          { slug: 'uu-31-1999', label: 'UU No. 31 Tahun 1999 (Pemberantasan Tipikor)', role: 'UU POKOK', status: 'DIUBAH', inDb: false, provisions: 44 },
          { slug: 'uu-20-2001', label: 'UU No. 20 Tahun 2001 (Perubahan UU Tipikor)', role: 'AMANDEMEN 1', status: 'BERLAKU', inDb: false, provisions: 0 },
          { slug: 'uu-30-2002', label: 'UU No. 30 Tahun 2002 (Komisi Pemberantasan Korupsi)', role: 'KELEMBAGAAN', status: 'DIUBAH', inDb: false, provisions: 72 },
          { slug: 'uu-19-2019', label: 'UU No. 19 Tahun 2019 (Perubahan UU KPK)', role: 'AMANDEMEN 2', status: 'BERLAKU', inDb: false, provisions: 0 },
          { slug: 'uu-46-2009', label: 'UU No. 46 Tahun 2009 (Pengadilan Tindak Pidana Korupsi)', role: 'PERADILAN KHUSUS', status: 'BERLAKU', inDb: false, provisions: 38 },
          { slug: 'uu-8-2010', label: 'UU No. 8 Tahun 2010 (Pencegahan & Pemberantasan TPPU)', role: 'TERKAIT / TPPU', status: 'BERLAKU', inDb: false, provisions: 100 },
        ],
      },
      {
        id: 'perkawinan-keluarga',
        name: 'Hukum Perkawinan & Hubungan Sipil Keluarga',
        description: 'Tata hukum dasar ikatan perkawinan, keabsahan perkawinan, hak dan kewajiban suami isteri, serta batas usia perkawinan nasional.',
        coreLaw: 'UU No. 1 Tahun 1974 jo. UU No. 16 Tahun 2019',
        status: 'TERINGEST_100_PERSEN',
        documents: [
          { slug: 'uu-1-1974', label: 'UU No. 1 Tahun 1974 tentang Perkawinan', role: 'UU POKOK', status: 'BERLAKU', inDb: true, provisions: 190 },
          { slug: 'uu-16-2019', label: 'UU No. 16 Tahun 2019 (Perubahan Batas Usia Nikah)', role: 'AMANDEMEN 1', status: 'BERLAKU', inDb: false, provisions: 0 },
        ],
      },
    ];

    return {
      success: true,
      families,
      totalFamilies: families.length,
    };
  });

  // Pelacakan Silsilah & Mutasi Mendalam Per 1 UU (Genealogy & Mutation Tracker)
  server.get('/api/v1/monitoring/genealogy/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const instrument = await prisma.legalInstrument.findUnique({
      where: { slug },
      include: {
        provisions: {
          take: 40,
          select: { id: true, label: true, canonicalPath: true, type: true },
        },
        modificationsReceived: {
          include: {
            amendingInstrument: {
              select: { id: true, slug: true, shortTitle: true, number: true, year: true, title: true, effectiveFrom: true },
            },
            operations: {
              include: {
                targetProvision: {
                  select: { label: true, canonicalPath: true },
                },
              },
              orderBy: { orderInSet: 'asc' },
            },
          },
        },
        modificationsMade: {
          include: {
            targetInstrument: {
              select: { id: true, slug: true, shortTitle: true, number: true, year: true, title: true },
            },
            operations: {
              include: {
                targetProvision: {
                  select: { label: true, canonicalPath: true },
                },
              },
              orderBy: { orderInSet: 'asc' },
            },
          },
        },
        relasiKe: {
          include: {
            source: { select: { slug: true, shortTitle: true, number: true, year: true, title: true } },
          },
        },
        relasiDari: {
          include: {
            target: { select: { slug: true, shortTitle: true, number: true, year: true, title: true } },
          },
        },
      },
    });

    if (!instrument) {
      return reply.code(404).send({ success: false, error: 'Instrumen tidak ditemukan' });
    }

    const mutations = (instrument.modificationsReceived || []).flatMap((cs) =>
      cs.operations.map((op) => ({
        id: op.id,
        operationType: op.operationType,
        targetArticle: op.targetProvision?.label || op.targetProvision?.canonicalPath || 'Pasal',
        targetCanonicalPath: op.targetProvision?.canonicalPath,
        sourceReference: op.sourceReference,
        amendingInstrument: cs.amendingInstrument
          ? (cs.amendingInstrument.shortTitle || `UU ${cs.amendingInstrument.number}/${cs.amendingInstrument.year}`)
          : 'Amandemen',
        amendingYear: cs.amendingInstrument?.year,
        previousContent: op.previousContent,
        newContent: op.newContent,
      }))
    );

    const relatedLaws = [
      ...(instrument.modificationsReceived || []).map((cs) => ({
        law: cs.amendingInstrument.shortTitle || `UU ${cs.amendingInstrument.number}/${cs.amendingInstrument.year}`,
        slug: cs.amendingInstrument.slug,
        relation: 'AMANDEMEN_PENGUBAH',
        description: cs.title,
        year: cs.amendingInstrument.year,
      })),
      ...(instrument.modificationsMade || []).map((cs) => ({
        law: cs.targetInstrument.shortTitle || `UU ${cs.targetInstrument.number}/${cs.targetInstrument.year}`,
        slug: cs.targetInstrument.slug,
        relation: 'TARGET_YANG_DIUBAH',
        description: cs.title,
        year: cs.targetInstrument.year,
      })),
      ...(instrument.relasiKe || []).map((r) => ({
        law: r.source.shortTitle || `UU ${r.source.number}/${r.source.year}`,
        slug: r.source.slug,
        relation: r.jenis,
        description: r.sumberKlausa,
        year: r.source.year,
      })),
      ...(instrument.relasiDari || []).map((r) => ({
        law: r.target.shortTitle || `UU ${r.target.number}/${r.target.year}`,
        slug: r.target.slug,
        relation: r.jenis,
        description: r.sumberKlausa,
        year: r.target.year,
      })),
    ];

    return {
      success: true,
      data: {
        id: instrument.id,
        slug: instrument.slug,
        officialTitle: `${instrument.type} Nomor ${instrument.number} Tahun ${instrument.year}`,
        title: instrument.title,
        shortTitle: instrument.shortTitle,
        status: instrument.status,
        confidenceScore: instrument.confidenceScore,
        totalArticles: instrument.provisions.length,
        totalMutations: mutations.length,
        mutations,
        relatedLaws,
      },
    };
  });
}
