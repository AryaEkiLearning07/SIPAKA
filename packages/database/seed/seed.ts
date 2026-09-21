/**
 * Seeder Keluarga UU ITE (Pilot)
 * Sumber data: dataset terverifikasi @lexvera/legal-engine (sudah lolos golden test).
 *
 * Prinsip:
 * - Idempoten: keluarga yang sama dihapus lalu dibuat ulang.
 * - Lossless: payload operasi lengkap disimpan di change_operations.payload_json
 *   (kolom terstruktur tetap diisi untuk kebutuhan query/reporting).
 * - Node sisipan (Pasal 27A/27B) dibuat sebagai row Provision sejak seed agar
 *   FK change_operations.target_provision_id selalu valid; mesin konsolidasi
 *   tetap menganggapnya "belum ada" sebelum tanggal efektif (versinya terikat
 *   ProvisionRevision yang terhubung ChangeSet).
 */
import { prisma, Prisma } from '../src/index';
import {
  ITE_BASE_DOCUMENT_2008,
  ITE_ALL_CHANGESETS,
} from '@lexvera/legal-engine';
import type { ChangeSetPayload, ChangeOperationPayload, ProvisionNode } from '@lexvera/types';
import bcrypt from 'bcryptjs';

/** Akun demo bertanda isDemo — mudah dikenali & dihapus ulang saat re-seed. */
const DEMO_USERS = [
  { email: 'admin@lexvera.local', name: 'Administrator LexVera', role: 'ADMIN' as const, password: 'lexvera-admin' },
  { email: 'kurator@lexvera.local', name: 'Kurator Hukum', role: 'KURATOR' as const, password: 'lexvera-kurator' },
  { email: 'dosen@lexvera.local', name: 'Dosen Fakultas Hukum', role: 'DOSEN' as const, password: 'lexvera-dosen' },
  { email: 'mahasiswa@lexvera.local', name: 'Mahasiswa Fakultas Hukum', role: 'MAHASISWA' as const, password: 'lexvera-mahasiswa' },
];

const TARGET_SLUG = 'ite';

const INSTRUMENTS = {
  target: {
    slug: TARGET_SLUG,
    type: 'UU' as const,
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE',
    legalDate: new Date('2008-04-21T00:00:00Z'),
    lnNumber: 58,
    tlnNumber: 4843,
  },
  amender2016: {
    slug: 'uu-19-2016',
    type: 'UU' as const,
    number: 19,
    year: 2016,
    title: 'Perubahan Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE (Amandemen 1)',
    legalDate: new Date('2016-11-28T00:00:00Z'),
    lnNumber: 251,
    tlnNumber: 5952,
  },
  amender2024: {
    slug: 'uu-1-2024',
    type: 'UU' as const,
    number: 1,
    year: 2024,
    title: 'Perubahan Kedua Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE (Amandemen 2)',
    legalDate: new Date('2024-01-02T00:00:00Z'),
    lnNumber: 8,
    tlnNumber: 6916,
  },
};

async function seedProvisionTree(
  legalInstrumentId: string,
  nodes: ProvisionNode[],
  parentId: string | null,
  effectiveFrom: Date
): Promise<number> {
  let count = 0;
  for (const node of nodes) {
    const provision = await prisma.provision.create({
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
    await prisma.provisionRevision.create({
      data: {
        provisionId: provision.id,
        versionTag: node.versionTag,
        content: node.content,
        explanation: node.explanation ?? null,
        effectiveFrom,
        changeSetId: null,
      },
    });
    count += 1 + (await seedProvisionTree(legalInstrumentId, node.children ?? [], provision.id, effectiveFrom));
  }
  return count;
}

async function resolveOrCreateProvision(
  legalInstrumentId: string,
  canonicalPath: string,
  newNode: ProvisionNode | undefined,
  changeSetId: string,
  effectiveFrom: Date
): Promise<{ id: string }> {
  const existing = await prisma.provision.findFirst({
    where: { legalInstrumentId, canonicalPath },
    select: { id: true },
  });
  if (existing) return existing;

  if (!newNode) {
    throw new Error(
      `[seed] Provision '${canonicalPath}' tidak ditemukan dan operasi tanpa newNode — data tidak konsisten.`
    );
  }

  const created = await prisma.provision.create({
    data: {
      legalInstrumentId,
      parentId: null, // akan diperbaiki di bawah berdasarkan posisi pada pohon
      type: newNode.type,
      orderIndex: newNode.orderIndex,
      label: newNode.label,
      title: newNode.title ?? null,
      canonicalPath: newNode.canonicalPath,
    },
  });

  // Pasang parent dari parentCanonicalPath operasi bila ada
  const op = ITE_ALL_CHANGESETS.flatMap((cs) => cs.operations).find(
    (o) => (o as { targetCanonicalPath: string }).targetCanonicalPath === canonicalPath &&
      (o as { parentCanonicalPath?: string }).parentCanonicalPath
  ) as { parentCanonicalPath?: string } | undefined;

  if (op?.parentCanonicalPath) {
    const parent = await prisma.provision.findFirst({
      where: { legalInstrumentId, canonicalPath: op.parentCanonicalPath },
      select: { id: true },
    });
    if (parent) {
      await prisma.provision.update({ where: { id: created.id }, data: { parentId: parent.id } });
    }
  }

  await prisma.provisionRevision.create({
    data: {
      provisionId: created.id,
      versionTag: newNode.versionTag,
      content: newNode.content,
      explanation: newNode.explanation ?? null,
      effectiveFrom,
      changeSetId,
    },
  });

  return { id: created.id };
}

async function seedChangeSet(cs: ChangeSetPayload, amenderSlug: string, targetInstrumentId: string) {
  const amender = await prisma.legalInstrument.findUniqueOrThrow({
    where: { slug: amenderSlug },
    select: { id: true },
  });

  const changeSet = await prisma.changeSet.create({
    data: {
      amendingInstrumentId: amender.id,
      targetInstrumentId,
      title: cs.title,
      legalBasisNote: cs.operations[0]?.sourceReference ?? null,
      status: 'PUBLISHED',
    },
  });

  for (const op of cs.operations as ChangeOperationPayload[]) {
    const target = await resolveOrCreateProvision(
      targetInstrumentId,
      op.targetCanonicalPath,
      op.operationType === 'ADD_PROVISION' ? op.newNode : undefined,
      changeSet.id,
      new Date(cs.effectiveFrom)
    );

    await prisma.changeOperation.create({
      data: {
        changeSetId: changeSet.id,
        targetProvisionId: target.id,
        operationType: op.operationType,
        sourceReference: op.sourceReference,
        previousContent:
          op.operationType === 'REPLACE_PROVISION' ? op.previousContent : null,
        newContent:
          op.operationType === 'REPLACE_PROVISION'
            ? op.newContent
            : op.operationType === 'ADD_PROVISION'
              ? op.newNode.content
              : null,
        payloadJson: op as unknown as Prisma.InputJsonValue,
        orderInSet: op.orderInSet,
      },
    });
  }
  return changeSet.id;
}

async function main() {
  console.log('[seed] Keluarga UU ITE — mulai…');

  // 1. Bersihkan keluarga lama (idempoten)
  const slugs = [INSTRUMENTS.target.slug, INSTRUMENTS.amender2016.slug, INSTRUMENTS.amender2024.slug];
  const oldIds = await prisma.legalInstrument.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  });
  if (oldIds.length > 0) {
    const ids = oldIds.map((i) => i.id);
    await prisma.changeOperation.deleteMany({
      where: { changeSet: { OR: [{ targetInstrumentId: { in: ids } }, { amendingInstrumentId: { in: ids } }] } },
    });
    await prisma.changeSet.deleteMany({
      where: { OR: [{ targetInstrumentId: { in: ids } }, { amendingInstrumentId: { in: ids } }] },
    });
    await prisma.provision.deleteMany({ where: { legalInstrumentId: { in: ids } } });
    await prisma.legalInstrument.deleteMany({ where: { id: { in: ids } } });
    console.log(`[seed] ${oldIds.length} instrument lama dibersihkan`);
  }

  // 2. Instrument target
  const target = await prisma.legalInstrument.create({
    data: {
      slug: INSTRUMENTS.target.slug,
      type: INSTRUMENTS.target.type,
      number: INSTRUMENTS.target.number,
      year: INSTRUMENTS.target.year,
      title: INSTRUMENTS.target.title,
      shortTitle: INSTRUMENTS.target.shortTitle,
      description:
        'Mengatur transaksi elektronik, tanda tangan digital, perbuatan yang dilarang, fitnah online, dan alat bukti elektronik. Diubah dua kali (2016, 2024) dan menjadi pilot konsolidasi deterministik.',
      status: 'BERLAKU',
      enactedAt: INSTRUMENTS.target.legalDate,
      promulgatedAt: INSTRUMENTS.target.legalDate,
      effectiveFrom: INSTRUMENTS.target.legalDate,
      lnNumber: INSTRUMENTS.target.lnNumber,
      tlnNumber: INSTRUMENTS.target.tlnNumber,
    },
  });

  // 3. Pohon provision naskah asli
  const provisionCount = await seedProvisionTree(
    target.id,
    ITE_BASE_DOCUMENT_2008.nodes,
    null,
    INSTRUMENTS.target.legalDate
  );

  // 4. Instrument pengubah
  for (const key of ['amender2016', 'amender2024'] as const) {
    const a = INSTRUMENTS[key];
    await prisma.legalInstrument.create({
      data: {
        slug: a.slug,
        type: a.type,
        number: a.number,
        year: a.year,
        title: a.title,
        shortTitle: a.shortTitle,
        status: 'BERLAKU',
        enactedAt: a.legalDate,
        promulgatedAt: a.legalDate,
        effectiveFrom: a.legalDate,
        lnNumber: a.lnNumber,
        tlnNumber: a.tlnNumber,
      },
    });
  }

  // 5. Change sets + operasi
  const csSlugs = [INSTRUMENTS.amender2016.slug, INSTRUMENTS.amender2024.slug];
  for (let i = 0; i < ITE_ALL_CHANGESETS.length; i++) {
    await seedChangeSet(ITE_ALL_CHANGESETS[i], csSlugs[i], target.id);
  }

  await prisma.legalInstrument.update({ where: { id: target.id }, data: { status: 'DIUBAH' } });

  // 6. Akun demo (upsert — password di-reset saat re-seed)
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: await bcrypt.hash(u.password, 10), name: u.name, role: u.role, isDemo: true },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: await bcrypt.hash(u.password, 10), isDemo: true },
    });
  }

  // 7. Ringkasan
  const counts = {
    instruments: await prisma.legalInstrument.count({ where: { slug: { in: slugs } } }),
    provisions: await prisma.provision.count({ where: { legalInstrumentId: target.id } }),
    changeSets: await prisma.changeSet.count({ where: { targetInstrumentId: target.id } }),
    changeOperations: await prisma.changeOperation.count({
      where: { changeSet: { targetInstrumentId: target.id } },
    }),
    users: await prisma.user.count({ where: { isDemo: true } }),
  };
  console.log('[seed] Selesai:', JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error('[seed] GAGAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
