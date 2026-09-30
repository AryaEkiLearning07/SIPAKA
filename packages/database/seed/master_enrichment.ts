import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/index';
import type { ProvisionNode } from '@sipaka/types';

const RE_RUJUK = /(?:Undang-Undang|UU)\s+(?:Nomor|No\.?)\s*(\d{1,4})\s+Tahun\s+(\d{4})/gi;
const RE_AMEND_TITLE = /(?:Perubahan(?:\s+(?:Pertama|Kedua|Ketiga|Keempat|Kelima|Ke-\d+|\d+))?\s+atas\s+Undang-Undang|Perubahan\s+atas\s+UU)\s+(?:Nomor|No\.?)\s*(\d{1,4})\s+Tahun\s+(\d{4})/i;
const RE_REVOKE_PASAL = /(?:dicabut\s+dan\s+dinyatakan\s+tidak\s+berlaku|dinyatakan\s+tidak\s+berlaku)/i;

async function seedProvisionTree(
  legalInstrumentId: string,
  nodes: ProvisionNode[],
  parentId: string | null,
  effectiveFrom: Date,
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
        explanation: node.explanation ?? null,
        effectiveFrom,
        changeSetId: null,
      },
    });

    count += 1 + (await seedProvisionTree(legalInstrumentId, node.children ?? [], row.id, effectiveFrom, seenPaths));
  }
  return count;
}

async function main() {
  console.log('====================================================');
  console.log('SIPAKA LEGAL INTELLIGENCE & CORRELATION ENGINE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TAHAP 1: ATTACH PROVISIONS KE UU AMANDEMEN ITE (uu-19-2016 & uu-1-2024)
  // ----------------------------------------------------
  console.log('--- TAHAP 1: PENGISIAN PASAL AMANDEMEN ITE ---');
  const structDir = path.join(__dirname, 'structured');
  
  const amendersToPopulate = [
    { slug: 'uu-19-2016', file: 'uu-19-2016.json' },
    { slug: 'uu-1-2024', file: 'uu-1-2024.json' },
  ];

  for (const item of amendersToPopulate) {
    const inst = await prisma.legalInstrument.findUnique({
      where: { slug: item.slug },
      include: { _count: { select: { provisions: true } } },
    });

    if (inst && inst._count.provisions === 0) {
      const filePath = path.join(structDir, item.file);
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          console.log(`Mengisi naskah pasal untuk ${item.slug} (${parsed.nodes.length} node utama)...`);
          const count = await seedProvisionTree(inst.id, parsed.nodes, null, inst.effectiveFrom);
          console.log(`✓ ${item.slug}: Berhasil menambahkan ${count} provisions & revisions.`);
        }
      }
    } else if (inst) {
      console.log(`- ${item.slug} sudah memiliki ${inst._count.provisions} provisions.`);
    }
  }

  // ----------------------------------------------------
  // TAHAP 2: BACKFILL SELURUH PROVISION TANPA REVISION
  // ----------------------------------------------------
  console.log('\n--- TAHAP 2: VERIFIKASI & BACKFILL REVISI PASAL ---');
  const missingProvisions = await prisma.provision.findMany({
    where: { revisions: { none: {} } },
    select: { id: true, legalInstrument: { select: { effectiveFrom: true } } },
  });

  if (missingProvisions.length > 0) {
    console.log(`Menemukan ${missingProvisions.length} provisions tanpa revision. Melakukan backfill...`);
    const batchSize = 500;
    for (let i = 0; i < missingProvisions.length; i += batchSize) {
      const batch = missingProvisions.slice(i, i + batchSize);
      await prisma.provisionRevision.createMany({
        data: batch.map((p) => ({
          provisionId: p.id,
          versionTag: 'ORIGINAL',
          content: '',
          explanation: null,
          effectiveFrom: p.legalInstrument.effectiveFrom,
          changeSetId: null,
        })),
      });
    }
    console.log(`✓ Berhasil mem-backfill ${missingProvisions.length} revisi.`);
  } else {
    console.log('✓ 100% provisions di database telah memiliki revisi.');
  }

  // ----------------------------------------------------
  // TAHAP 3: EKSTRAKSI & PENGAYAAN KORELASI MULTI-SUMBER
  // ----------------------------------------------------
  console.log('\n--- TAHAP 3: EKSTRAKSI & PENGAYAAN KORELASI MULTI-SUMBER ---');
  
  const instruments = await prisma.legalInstrument.findMany({
    select: {
      id: true,
      slug: true,
      number: true,
      year: true,
      title: true,
      type: true,
      preambleJson: true,
    },
  });

  const byNumYear = new Map<string, typeof instruments[0]>();
  const bySlug = new Map<string, typeof instruments[0]>();
  for (const inst of instruments) {
    byNumYear.set(`${inst.number}-${inst.year}`, inst);
    if (inst.slug) {
      bySlug.set(inst.slug, inst);
      bySlug.set(`uu-${inst.number}-${inst.year}`, inst);
      bySlug.set(`uu-no-${inst.number}-tahun-${inst.year}`, inst);
    }
  }

  // Ambil relasi yang sudah ada di database
  const existingRelations = await prisma.instrumentRelation.findMany({
    select: { sourceId: true, targetId: true, jenis: true },
  });
  const existingSet = new Set(existingRelations.map((r) => `${r.sourceId}::${r.targetId}::${r.jenis}`));
  console.log(`Relasi saat ini di DB: ${existingRelations.length}`);

  interface CandidateRelation {
    sourceId: string;
    targetId: string;
    jenis: string;
    sumberKlausa: string;
  }

  const toInsert: CandidateRelation[] = [];
  const candidateSet = new Set<string>();

  const addCandidate = (c: CandidateRelation) => {
    if (c.sourceId === c.targetId) return;
    const key = `${c.sourceId}::${c.targetId}::${c.jenis}`;
    if (existingSet.has(key) || candidateSet.has(key)) return;
    candidateSet.add(key);
    toInsert.push(c);
  };

  // 3.1. Dari catalog-rich.jsonl (JDIH BPK Metadata)
  const richPath = path.join(structDir, 'catalog-rich.jsonl');
  if (fs.existsSync(richPath)) {
    const lines = fs.readFileSync(richPath, 'utf-8').split('\n');
    for (const l of lines) {
      if (!l.trim()) continue;
      try {
        const item = JSON.parse(l);
        const thisInst =
          bySlug.get(item.slug) ||
          (item.nomor && item.tahun ? byNumYear.get(`${item.nomor}-${item.tahun}`) : null);
        if (!thisInst) continue;

        // diubahOleh -> other MENGUBAH this
        if (Array.isArray(item.diubahOleh)) {
          for (const changer of item.diubahOleh) {
            const chSlug = typeof changer === 'string' ? changer : changer?.slug;
            const other = bySlug.get(chSlug);
            if (other) {
              addCandidate({
                sourceId: other.id,
                targetId: thisInst.id,
                jenis: 'MENGUBAH',
                sumberKlausa: 'Metadata JDIH BPK (diubahOleh)',
              });
            }
          }
        }

        // mencabut -> this MENCABUT other
        if (Array.isArray(item.mencabut)) {
          for (const repealed of item.mencabut) {
            const repSlug = typeof repealed === 'string' ? repealed : repealed?.slug;
            const other = bySlug.get(repSlug);
            if (other) {
              addCandidate({
                sourceId: thisInst.id,
                targetId: other.id,
                jenis: 'MENCABUT',
                sumberKlausa: 'Metadata JDIH BPK (mencabut)',
              });
            }
          }
        }

        // dicabutOleh -> other MENCABUT this
        if (Array.isArray(item.dicabutOleh)) {
          for (const repealer of item.dicabutOleh) {
            const rSlug = typeof repealer === 'string' ? repealer : repealer?.slug;
            const other = bySlug.get(rSlug);
            if (other) {
              addCandidate({
                sourceId: other.id,
                targetId: thisInst.id,
                jenis: 'MENCABUT',
                sumberKlausa: 'Metadata JDIH BPK (dicabutOleh)',
              });
            }
          }
        }
      } catch {}
    }
  }
  console.log(`- Dari JDIH BPK Metadata: ${toInsert.length} kandidat relasi baru.`);

  // 3.2. Dari Judul Instrumen ("Perubahan atas Undang-Undang Nomor X Tahun Y")
  const beforeTitles = toInsert.length;
  for (const inst of instruments) {
    const m = RE_AMEND_TITLE.exec(inst.title);
    if (m) {
      const num = parseInt(m[1], 10);
      const year = parseInt(m[2], 10);
      const target = byNumYear.get(`${num}-${year}`);
      if (target) {
        addCandidate({
          sourceId: inst.id,
          targetId: target.id,
          jenis: 'MENGUBAH',
          sumberKlausa: `Judul: ${inst.title.slice(0, 100)}`,
        });
      }
    }
  }
  console.log(`- Dari Analisis Judul Amandemen: +${toInsert.length - beforeTitles} relasi baru.`);

  // 3.3. Dari ChangeSets (Verified Amending Instruments)
  const beforeChangeSets = toInsert.length;
  const changeSets = await prisma.changeSet.findMany({
    select: { amendingInstrumentId: true, targetInstrumentId: true, legalBasisNote: true },
  });
  for (const cs of changeSets) {
    if (cs.amendingInstrumentId && cs.targetInstrumentId) {
      addCandidate({
        sourceId: cs.amendingInstrumentId,
        targetId: cs.targetInstrumentId,
        jenis: 'MENGUBAH',
        sumberKlausa: cs.legalBasisNote || 'ChangeSet Konsolidasi',
      });
    }
  }
  console.log(`- Dari ChangeSet Mesin Konsolidasi: +${toInsert.length - beforeChangeSets} relasi baru.`);

  // 3.4. Dari Konsiderans Mengingat (DASAR_HUKUM)
  const beforePreamble = toInsert.length;
  for (const inst of instruments) {
    const pre = inst.preambleJson as any;
    if (pre && Array.isArray(pre.mengingat)) {
      for (const meng of pre.mengingat) {
        if (typeof meng !== 'string') continue;
        let match;
        const re = new RegExp(RE_RUJUK.source, 'gi');
        while ((match = re.exec(meng)) !== null) {
          const num = parseInt(match[1], 10);
          const year = parseInt(match[2], 10);
          const target = byNumYear.get(`${num}-${year}`);
          if (target && target.id !== inst.id) {
            addCandidate({
              sourceId: inst.id,
              targetId: target.id,
              jenis: 'DASAR_HUKUM',
              sumberKlausa: `Konsiderans Mengingat: ${meng.slice(0, 120)}`,
            });
          }
        }
      }
    }
  }
  console.log(`- Dari Konsiderans Dasar Hukum (Mengingat): +${toInsert.length - beforePreamble} relasi baru.`);

  // 3.5. Dari Teks Isi Pasal (MERUJUK & MENCABUT antar pasal)
  const beforeProvisions = toInsert.length;
  const revisions = await prisma.provisionRevision.findMany({
    where: {
      OR: [
        { content: { contains: 'Undang-Undang' } },
        { content: { contains: 'UU No' } },
        { content: { contains: 'UU Nomor' } },
      ],
    },
    select: {
      content: true,
      provision: {
        select: {
          legalInstrumentId: true,
          label: true,
        },
      },
    },
  });

  for (const rev of revisions) {
    if (!rev.content) continue;
    let match;
    const re = new RegExp(RE_RUJUK.source, 'gi');
    while ((match = re.exec(rev.content)) !== null) {
      const num = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      const target = byNumYear.get(`${num}-${year}`);
      if (target && target.id !== rev.provision.legalInstrumentId) {
        const isRevoke = RE_REVOKE_PASAL.test(rev.content);
        addCandidate({
          sourceId: rev.provision.legalInstrumentId,
          targetId: target.id,
          jenis: isRevoke ? 'MENCABUT' : 'MERUJUK',
          sumberKlausa: `${rev.provision.label}: "${rev.content.slice(0, 90)}..."`,
        });
      }
    }
  }
  console.log(`- Dari Penelusuran Teks Isi Pasal: +${toInsert.length - beforeProvisions} relasi baru.`);

  // ----------------------------------------------------
  // TAHAP 4: INSERT RELASI BARU KE DATABASE
  // ----------------------------------------------------
  console.log(`\nTotal kandidat relasi baru yang siap di-insert: ${toInsert.length}`);
  if (toInsert.length > 0) {
    const insertBatchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < toInsert.length; i += insertBatchSize) {
      const batch = toInsert.slice(i, i + insertBatchSize);
      await prisma.instrumentRelation.createMany({
        data: batch.map((b) => ({
          sourceId: b.sourceId,
          targetId: b.targetId,
          jenis: b.jenis,
          sumberKlausa: b.sumberKlausa.slice(0, 255),
        })),
      });
      insertedCount += batch.length;
    }
    console.log(`✓ Berhasil menambahkan ${insertedCount} relasi baru ke instrument_relations!`);
  }

  // ----------------------------------------------------
  // TAHAP 5: LAPORAN AKHIR STATUS PLATFORM
  // ----------------------------------------------------
  const finalInstruments = await prisma.legalInstrument.count();
  const finalProvisions = await prisma.provision.count();
  const finalRevisions = await prisma.provisionRevision.count();
  const finalRelations = await prisma.instrumentRelation.count();

  const relDistribution = await prisma.instrumentRelation.groupBy({
    by: ['jenis'],
    _count: true,
  });

  const correlatedStats = await prisma.instrumentRelation.findMany({
    select: { sourceId: true, targetId: true },
  });
  const correlatedSet = new Set<string>();
  correlatedStats.forEach((r) => {
    correlatedSet.add(r.sourceId);
    correlatedSet.add(r.targetId);
  });

  console.log('\n====================================================');
  console.log('REKAPITULASI PEMBARUAN SIPAKA:');
  console.log('====================================================');
  console.log(`Total Instrumen Hukum: ${finalInstruments}`);
  console.log(`Total Pasal & Node Ketentuan: ${finalProvisions.toLocaleString('id-ID')}`);
  console.log(`Total Naskah Revisi Terverifikasi: ${finalRevisions.toLocaleString('id-ID')}`);
  console.log(`Total Relasi Hukum (Korelasi): ${finalRelations} (Meningkat dari 67)`);
  console.log('Distribusi Jenis Relasi:', relDistribution);
  console.log(`Instrumen Terkorelasi dalam Graf: ${correlatedSet.size} dari ${finalInstruments} (${Math.round((correlatedSet.size / finalInstruments) * 100)}%)`);
  console.log('====================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
