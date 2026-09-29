/**
 * Seeder Generik (Mesin 4) — memuat hasil pipeline (structured/<slug>.json)
 * ke database untuk dokumen APA PUN, tanpa hardcode per-UU.
 *
 * Pemakaian:
 *   npx tsx ./seed/ingest-json.ts                 # semua dokumen PASS (publishMode AUTO_PUBLISH)
 *   npx tsx ./seed/ingest-json.ts uu-40-2007      # dokumen tertentu
 *   npx tsx ./seed/ingest-json.ts --force uu-1-2023  # paksa masukkan yang karantina
 *
 * Aturan:
 * - Slug 'ite' dilewati (keluarga pilot dengan changeset ditangani seed utama).
 * - publishMode QUARANTINE ditolak kecuali --force.
 * - Idempoten: instrument lama dengan slug ATAU (type+number+year) yang sama dihapus lalu dibuat ulang.
 * - Judul: diambil dari catalog-rich.jsonl bila ada, lalu preamble JSON, lalu template fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/index';
import type { ProvisionNode } from '@sipaka/types';

const STRUCT = path.join(__dirname, '..', 'seed', 'structured');
const RICH   = path.join(__dirname, '..', 'seed', 'structured', 'catalog-rich.jsonl');

interface ParsedDoc {
  slug: string;
  source: { url: string; sha256: string; status: string };
  validation?: { skor: number; keputusan: string; publishMode: string; issues: string[] };
  preamble?: { menimbang: string[]; mengingat: string[] } | null;
  penutup?: string | null;
  stats: { bab: number; pasal: number; ayat_angka: number; huruf: number };
  nodes: ProvisionNode[];
}

/** Muat catalog-rich.jsonl → map slug → metadata */
function loadRich(): Map<string, Record<string, any>> {
  const map = new Map<string, Record<string, any>>();
  if (!fs.existsSync(RICH)) return map;
  for (const line of fs.readFileSync(RICH, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e.slug) {
        map.set(e.slug, e);
        if (e.nomor && e.tahun) {
          map.set(`uu-${e.nomor}-${e.tahun}`, e);
          map.set(`uu-no-${e.nomor}-tahun-${e.tahun}`, e);
        }
      }
    } catch { /* skip */ }
  }
  return map;
}

async function seedProvisionTree(
  legalInstrumentId: string,
  nodes: ProvisionNode[],
  parentId: string | null,
  seenPaths: Set<string> = new Set<string>()
): Promise<number> {
  let count = 0;
  for (const node of nodes) {
    let cPath = node.canonicalPath;
    if (seenPaths.has(cPath)) {
      let suffix = 2;
      while (seenPaths.has(`${cPath}-dup${suffix}`)) {
        suffix++;
      }
      cPath = `${cPath}-dup${suffix}`;
    }
    seenPaths.add(cPath);

    const row = await prisma.provision.create({
      data: {
        legalInstrumentId,
        parentId,
        type: node.type,
        orderIndex: node.orderIndex,
        label: node.label,
        title: node.title ?? null,
        canonicalPath: cPath,
      },
    });
    if (node.content.trim() || node.type === 'BAB' || node.type === 'BUKU') {
      await prisma.provisionRevision.create({
        data: {
          provisionId: row.id,
          versionTag: node.versionTag,
          content: node.content,
          effectiveFrom: new Date(),
          changeSetId: null,
        },
      });
    }
    count += 1 + (await seedProvisionTree(legalInstrumentId, node.children ?? [], row.id, seenPaths));
  }
  return count;
}

async function ingest(slug: string, force: boolean, rich: ReturnType<typeof loadRich>): Promise<string> {
  const file = path.join(STRUCT, `${slug}.json`);
  if (!fs.existsSync(file)) return `LEWATI ${slug} (JSON tidak ada)`;
  const doc: ParsedDoc = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const mode = doc.validation?.publishMode ?? 'QUARANTINE';
  if (mode === 'QUARANTINE' && !force) {
    return `KARANTINA ${slug} (skor ${doc.validation?.skor}) — pakai --force untuk memaksa`;
  }
  if (slug === 'ite') return 'LEWATI ite (keluarga pilot via seed utama)';

  const m = slug.match(/^uu-(?:no-)?(\d+)(?:-tahun)?-(\d{4})$/);
  if (!m) return `LEWATI ${slug} (slug tidak berpola UU)`;
  const nomor = parseInt(m[1], 10);
  const tahun = parseInt(m[2], 10);

  // Ambil metadata dari catalog-rich bila tersedia
  const meta = rich.get(slug) || rich.get(`uu-${nomor}-${tahun}`) || rich.get(`uu-no-${nomor}-tahun-${tahun}`) || {};
  let judul = meta.judul;
  if (!judul || judul.match(/^Undang-Undang Nomor \d+ Tahun \d+$/i)) {
    if (meta.tentang) {
      judul = `Undang-Undang Nomor ${nomor} Tahun ${tahun} tentang ${meta.tentang}`;
    } else {
      judul = `Undang-Undang Nomor ${nomor} Tahun ${tahun}`;
    }
  }
  const shortTitle = `UU No. ${nomor} Tahun ${tahun}`;
  const lnNumber  = meta.lnNumber  ? parseInt(meta.lnNumber, 10)  : null;
  const tlnNumber = meta.tlnNumber ? parseInt(meta.tlnNumber, 10) : null;
  const enactedAt = meta.enactedAt ? new Date(meta.enactedAt) : new Date(`${tahun}-01-01`);
  
  let description: string | null = null;
  if (Array.isArray(meta.abstrak) && meta.abstrak.length > 0) {
    description = meta.abstrak[0];
  } else if (typeof meta.abstrak === 'string' && meta.abstrak.trim()) {
    description = meta.abstrak.trim();
  } else if (meta.description) {
    description = String(meta.description);
  }

  // Hapus duplikat berdasarkan slug ATAU (type+number+year) — lebih agresif
  const toDelete: string[] = [];
  const bySlug = await prisma.legalInstrument.findUnique({ where: { slug }, select: { id: true } });
  if (bySlug) toDelete.push(bySlug.id);

  const byNumYear = await prisma.legalInstrument.findFirst({
    where: { type: 'UU', number: nomor, year: tahun },
    select: { id: true, slug: true },
  });
  if (byNumYear && !toDelete.includes(byNumYear.id)) {
    // Hanya hapus bila bukan keluarga ITE (pilot punya changeset, jangan rusak)
    if (!['ite', 'uu-19-2016', 'uu-1-2024'].includes(byNumYear.slug ?? '')) {
      toDelete.push(byNumYear.id);
    } else {
      return `LEWATI ${slug} (sudah ada sebagai ${byNumYear.slug} — keluarga pilot, tidak ditimpa)`;
    }
  }

  for (const id of toDelete) {
    await prisma.provision.deleteMany({ where: { legalInstrumentId: id } });
    await prisma.legalInstrument.delete({ where: { id } });
  }

  const instrument = await prisma.legalInstrument.create({
    data: {
      slug,
      type: 'UU',
      number: nomor,
      year: tahun,
      title: judul,
      shortTitle,
      description,
      status: 'BERLAKU',
      enactedAt,
      promulgatedAt: enactedAt,
      effectiveFrom: enactedAt,
      lnNumber,
      tlnNumber,
      confidenceScore: doc.validation?.skor ?? null,
      publishMode: mode === 'AUTO_PUBLISH' ? 'AUTO_PUBLISH' : 'QUARANTINE',
      preambleJson: (doc.preamble ?? null) as unknown as object,
      penutupTeks: doc.penutup ?? null,
    },
  });

  const count = await seedProvisionTree(instrument.id, doc.nodes, null);
  return `MASUK ${slug}: ${count} provisions | judul: ${judul.slice(0, 60)} | skor ${doc.validation?.skor}`;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugs = args.filter((a) => !a.startsWith('--'));

  const rich = loadRich();
  console.log(`[ingest] catalog-rich: ${rich.size} entri metadata dimuat`);

  let daftar = slugs;
  if (daftar.length === 0) {
    daftar = fs.readdirSync(STRUCT)
      .filter((f) => f.endsWith('.json') && !f.startsWith('_') && f !== 'uu-11-2008.json')
      .map((f) => f.replace('.json', ''));
  }

  console.log(`[ingest] ${daftar.length} dokumen…`);
  for (const slug of daftar) {
    try {
      console.log('  ' + await ingest(slug, force, rich));
    } catch (e) {
      const err = e as { code?: string; message?: string; meta?: unknown };
      const detail = err.meta ? JSON.stringify(err.meta).slice(0, 150) : (err.message ?? '').slice(0, 150);
      console.log(`  GAGAL ${slug}: [${err.code ?? 'ERR'}] ${detail}`);
    }
  }
}

main()
  .catch((e) => {
    console.error('[ingest] GAGAL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
