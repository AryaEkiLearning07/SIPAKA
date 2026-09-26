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
 * - Idempoten: instrument lama dengan slug sama dihapus lalu dibuat ulang.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/index';
import type { ProvisionNode } from '@lexvera/types';

const STRUCT = path.join(__dirname, '..', 'seed', 'structured');

interface ParsedDoc {
  slug: string;
  source: { url: string; sha256: string; status: string };
  validation?: { skor: number; keputusan: string; publishMode: string; issues: string[] };
  stats: { bab: number; pasal: number; ayat_angka: number; huruf: number };
  nodes: ProvisionNode[];
}

async function seedProvisionTree(
  legalInstrumentId: string,
  nodes: ProvisionNode[],
  parentId: string | null,
): Promise<number> {
  let count = 0;
  for (const node of nodes) {
    const row = await prisma.provision.create({
      data: {
        legalInstrumentId,
        parentId,
        type: node.type,
        orderIndex: node.orderIndex,
        label: node.label,
        title: node.title ?? null,
        canonicalPath: node.canonicalPath,
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
    count += 1 + (await seedProvisionTree(legalInstrumentId, node.children ?? [], row.id));
  }
  return count;
}

async function ingest(slug: string, force: boolean): Promise<string> {
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

  const bentrok = await prisma.legalInstrument.findFirst({
    where: { type: 'UU', number: nomor, year: tahun },
    select: { slug: true },
  });
  if (bentrok && bentrok.slug !== slug) {
    return `LEWATI ${slug} (sudah ada sebagai ${bentrok.slug} — dokumen yang sama dari keluarga pilot)`;
  }

  const existing = await prisma.legalInstrument.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    await prisma.provision.deleteMany({ where: { legalInstrumentId: existing.id } });
    await prisma.legalInstrument.delete({ where: { id: existing.id } });
  }

  const instrument = await prisma.legalInstrument.create({
    data: {
      slug,
      type: 'UU',
      number: nomor,
      year: tahun,
      title: `Undang-Undang Nomor ${nomor} Tahun ${tahun}`,
      shortTitle: `UU ${nomor}/${tahun}`,
      status: 'BERLAKU',
      enactedAt: new Date(`${tahun}-01-01`),
      promulgatedAt: new Date(`${tahun}-01-01`),
      effectiveFrom: new Date(`${tahun}-01-01`),
      confidenceScore: doc.validation?.skor ?? null,
      publishMode: mode === 'AUTO_PUBLISH' ? 'AUTO_PUBLISH' : 'QUARANTINE',
    },
  });

  const count = await seedProvisionTree(instrument.id, doc.nodes, null);
  return `MASUK ${slug}: ${count} provisions (skor ${doc.validation?.skor}, mode ${mode})`;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugs = args.filter((a) => !a.startsWith('--'));

  let daftar = slugs;
  if (daftar.length === 0) {
    // default: semua JSON PASS di structured/ (kecuali ite)
    daftar = fs.readdirSync(STRUCT)
      .filter((f) => f.endsWith('.json') && !f.startsWith('_') && f !== 'uu-11-2008.json')
      .map((f) => f.replace('.json', ''));
  }

  console.log(`[ingest] ${daftar.length} dokumen…`);
  for (const slug of daftar) {
    try {
      console.log('  ' + await ingest(slug, force));
    } catch (e) {
      console.log(`  GAGAL ${slug}: ${e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120)}`);
    }
  }
}

main()
  .catch((e) => {
    console.error('[ingest] GAGAL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
