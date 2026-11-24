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
import type { ProvisionNode, InstrumentType } from '@sipaka/types';

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
    await prisma.provisionRevision.create({
      data: {
        provisionId: row.id,
        versionTag: node.versionTag || 'ORIGINAL',
        content: node.content || '',
        effectiveFrom: new Date(),
        changeSetId: null,
      },
    });
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

  // Parsing Pola Regulasi Nasional & Daerah (UU, PP, Perpres, Perppu, Permen, Perda, Pergub, Perbup, Perwali)
  let instType: InstrumentType = 'UU';
  let nomor = 0;
  let tahun = 2000;
  let typeLabel = 'Peraturan';

  const mNas = slug.match(/^(uu|pp|perpres|perpu|perppu)-(?:no-)?(\d+)(?:-tahun)+-(\d{3,4})/i);
  const mPermen = slug.match(/^(permen[a-z]*|perma|pojk|pbi|pmk)-(?:no-)?(\d+)(?:-tahun)+-(\d{3,4})/i);
  const mPergub = slug.match(/^pergub(?:-[a-z0-9-]+)?-(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)+(\d{3,4})/i);
  const mPerkada = slug.match(/^(perbup|perwali)(?:-[a-z0-9-]+)?-(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)+(\d{3,4})/i);
  const mPerda = slug.match(/^(perda|qanun)(?:-[a-z0-9-]+)?-(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)+(\d{3,4})/i);
  const mGen = slug.match(/(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)+(\d{3,4})/i) || slug.match(/(\d+)-(\d{3,4})/);

  if (mNas) {
    const raw = mNas[1].toLowerCase();
    nomor = parseInt(mNas[2], 10);
    tahun = parseInt(mNas[3], 10);
    if (raw === 'uu') { instType = 'UU'; typeLabel = 'Undang-Undang'; }
    else if (raw === 'pp') { instType = 'PP'; typeLabel = 'Peraturan Pemerintah'; }
    else if (raw === 'perpres') { instType = 'PERPRES'; typeLabel = 'Peraturan Presiden'; }
    else if (raw === 'perpu' || raw === 'perppu') { instType = 'PERPPU'; typeLabel = 'Peraturan Pemerintah Pengganti Undang-Undang'; }
  } else if (mPermen) {
    nomor = parseInt(mPermen[2], 10);
    tahun = parseInt(mPermen[3], 10);
    instType = 'PERMEN';
    typeLabel = slug.toLowerCase().startsWith('pmk-') ? 'Peraturan Menteri Keuangan' : 'Peraturan Menteri';
  } else if (mPergub) {
    nomor = parseInt(mPergub[1], 10);
    tahun = parseInt(mPergub[2], 10);
    instType = 'PERGUB';
    typeLabel = 'Peraturan Gubernur';
  } else if (mPerkada) {
    nomor = parseInt(mPerkada[2], 10);
    tahun = parseInt(mPerkada[3], 10);
    instType = mPerkada[1].toLowerCase() === 'perbup' ? 'PERBUP' : 'PERWALI';
    typeLabel = mPerkada[1].toLowerCase() === 'perbup' ? 'Peraturan Bupati' : 'Peraturan Walikota';
  } else if (mPerda) {
    nomor = parseInt(mPerda[2], 10);
    tahun = parseInt(mPerda[3], 10);
    const isProv = slug.includes('prov') || slug.includes('dki') || slug.includes('diy');
    instType = mPerda[1].toLowerCase() === 'qanun' ? 'QANUN' : (isProv ? 'PERDA_PROV' : 'PERDA_KABKOT');
    typeLabel = mPerda[1].toLowerCase() === 'qanun' ? 'Qanun' : (isProv ? 'Peraturan Daerah Provinsi' : 'Peraturan Daerah Kabupaten/Kota');
  } else if (mGen) {
    nomor = parseInt(mGen[1], 10);
    tahun = parseInt(mGen[2], 10);
    if (slug.startsWith('pp-')) { instType = 'PP'; typeLabel = 'Peraturan Pemerintah'; }
    else if (slug.startsWith('perpres-')) { instType = 'PERPRES'; typeLabel = 'Peraturan Presiden'; }
    else if (slug.startsWith('perpu-') || slug.startsWith('perppu-')) { instType = 'PERPPU'; typeLabel = 'Perpu'; }
    else if (slug.startsWith('permen-')) { instType = 'PERMEN'; typeLabel = 'Peraturan Menteri'; }
    else if (slug.includes('prov') || slug.includes('pergub')) { instType = 'PERGUB'; typeLabel = 'Peraturan Gubernur'; }
    else if (slug.includes('kab') || slug.includes('perbup')) { instType = 'PERBUP'; typeLabel = 'Peraturan Bupati'; }
    else if (slug.includes('kota') || slug.includes('perwali')) { instType = 'PERWALI'; typeLabel = 'Peraturan Walikota'; }
    else { instType = 'UU'; typeLabel = 'Peraturan'; }
  } else {
    // Fallback darurat: deteksi dari jenis awal slug
    if (slug.startsWith('pergub-')) { instType = 'PERGUB'; typeLabel = 'Peraturan Gubernur'; }
    else if (slug.startsWith('perbup-')) { instType = 'PERBUP'; typeLabel = 'Peraturan Bupati'; }
    else if (slug.startsWith('perwali-')) { instType = 'PERWALI'; typeLabel = 'Peraturan Walikota'; }
    else if (slug.startsWith('perda-')) { instType = 'PERDA_KABKOT'; typeLabel = 'Peraturan Daerah'; }
    else { instType = 'UU'; typeLabel = 'Peraturan'; }
  }

  // Jika tahun terpotong (misal 3 digit '201') atau 0, pulihkan dari metadata judul dokumen
  const srcTitle = typeof doc.source?.url === 'object' ? (doc.source.url as any)?.judul : (doc.source as any)?.judul;
  if (tahun < 1900 || tahun > 2030) {
    const mYear = (srcTitle || '').match(/Tahun\s+(\d{4})/i) || (doc.source?.url ? String(doc.source.url).match(/(\d{4})/i) : null);
    if (mYear) tahun = parseInt(mYear[1], 10);
    else if (tahun >= 200 && tahun <= 203) tahun = tahun * 10 + 5; // Estimasi aman dekade
  }

  // Ambil metadata dari catalog-rich bila tersedia
  const meta = rich.get(slug) || rich.get(`${instType.toLowerCase()}-${nomor}-${tahun}`) || rich.get(`${instType.toLowerCase()}-no-${nomor}-tahun-${tahun}`) || {};
  let judul = meta.judul;
  if (!judul || judul.match(new RegExp(`^${typeLabel} Nomor \\d+ Tahun \\d+$`, 'i'))) {
    if (meta.tentang) {
      judul = `${typeLabel} Nomor ${nomor} Tahun ${tahun} tentang ${meta.tentang}`;
    } else {
      judul = `${typeLabel} Nomor ${nomor} Tahun ${tahun}`;
    }
  }
  const shortTitle = `${instType} No. ${nomor} Tahun ${tahun}`;
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
    where: { type: instType, number: nomor, year: tahun },
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
    await prisma.changeOperation.deleteMany({
      where: { changeSet: { OR: [{ targetInstrumentId: id }, { amendingInstrumentId: id }] } },
    }).catch(() => null);
    await prisma.changeSet.deleteMany({
      where: { OR: [{ targetInstrumentId: id }, { amendingInstrumentId: id }] },
    }).catch(() => null);
    await prisma.provision.deleteMany({ where: { legalInstrumentId: id } });
    await prisma.legalInstrument.delete({ where: { id } });
  }

  const instrument = await prisma.legalInstrument.create({
    data: {
      slug,
      type: instType,
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
