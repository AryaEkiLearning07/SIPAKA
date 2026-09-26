import { prisma, LegalInstrument } from '@lexvera/database';
import {
  ITE_BASE_DOCUMENT_2008,
  ITE_ALL_CHANGESETS,
} from '@lexvera/legal-engine';
import {
  ConsolidatedLawDocument,
  ChangeSetPayload,
  ChangeOperationPayload,
  ProvisionNode,
} from '@lexvera/types';

/**
 * Mode demo: saat database belum tersambung, API melayani dataset pilot
 * terverifikasi langsung dari legal-engine (sumber yang sama dengan golden test).
 * Flag source:'engine-demo' selalu ikut di respons agar UI menandainya jujur.
 * Matikan di produksi dengan DEMO_FALLBACK=false.
 */
export const DEMO_FALLBACK = process.env.DEMO_FALLBACK !== 'false';

type FamilySource = 'database' | 'engine-demo';

export interface Family {
  source: FamilySource;
  instrument: Pick<LegalInstrument, 'type' | 'number' | 'year' | 'title' | 'shortTitle' | 'status' | 'slug' | 'description' | 'effectiveFrom' | 'promulgatedAt' | 'preambleJson' | 'penutupTeks' | 'lnNumber' | 'tlnNumber'>;
  baseDocument: ConsolidatedLawDocument;
  changeSets: ChangeSetPayload[];
}

export function demoFamily(): Family {
  return {
    source: 'engine-demo',
    instrument: {
      type: 'UU',
      number: 11,
      year: 2008,
      title: 'Informasi dan Transaksi Elektronik',
      shortTitle: 'UU ITE',
      status: 'DIUBAH',
      slug: 'ite',
      description:
        'Mengatur transaksi elektronik, tanda tangan digital, perbuatan yang dilarang, fitnah online, dan alat bukti elektronik. Diubah dua kali (2016, 2024) dan menjadi pilot konsolidasi deterministik.',
      effectiveFrom: new Date('2008-04-21T00:00:00Z'),
      promulgatedAt: new Date('2008-04-21T00:00:00Z'),
      preambleJson: null,
      penutupTeks: null,
      lnNumber: 58,
      tlnNumber: 4843,
    },
    baseDocument: ITE_BASE_DOCUMENT_2008,
    changeSets: ITE_ALL_CHANGESETS,
  };
}

/** Cache keluarga peraturan dalam memori (data pilot statis antar-request). */
const familyCache = new Map<string, Family>();

export function labelOf(inst: { type: string; number: number; year: number }): string {
  return `${inst.type} No. ${inst.number} Tahun ${inst.year}`;
}

/** Ambil keluarga peraturan dari DB dan rakit payload untuk mesin konsolidasi. */
async function loadFamilyFromDb(slug: string): Promise<Family> {
  const cached = familyCache.get(slug);
  if (cached) return cached;

  const instrument = await prisma.legalInstrument.findUnique({
    where: { slug },
    include: {
      provisions: { include: { revisions: true } },
      modificationsReceived: {
        include: {
          amendingInstrument: true,
          operations: { orderBy: { orderInSet: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!instrument) {
    const total = await prisma.legalInstrument.count();
    const err = new Error(total === 0 ? 'DATABASE_EMPTY' : 'INSTRUMENT_NOT_FOUND');
    throw err;
  }

  // --- Rakit pohon naskah asli dari provision + revisi ORIGINAL (changeSetId null) ---
  const originalRevision = new Map<string, { content: string; explanation: string | null; versionTag: string }>();
  for (const p of instrument.provisions) {
    const rev = p.revisions.find((r) => r.changeSetId === null);
    if (rev) originalRevision.set(p.id, rev);
  }

  const byParent = new Map<string | null, typeof instrument.provisions>();
  for (const p of instrument.provisions) {
    const key = p.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(p);
    byParent.set(key, list);
  }

  const toNode = (p: (typeof instrument.provisions)[number]): ProvisionNode | null => {
    // Node sisipan masa depan (mis. Pasal 27A prapaser 2024) sengaja dibuat sejak seed
    // demi FK — tapi TIDAK BOLEH tampil di naskah dasar sebelum operasinya efektif.
    const rev = originalRevision.get(p.id);
    if (!rev) return null;
    const children = (byParent.get(p.id) ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(toNode)
      .filter((n): n is ProvisionNode => n !== null);
    return {
      canonicalPath: p.canonicalPath,
      type: p.type,
      orderIndex: p.orderIndex,
      label: p.label,
      title: p.title ?? undefined,
      content: rev.content,
      explanation: rev.explanation ?? undefined,
      versionTag: rev.versionTag,
      isRepealed: false,
      children,
    };
  };

  const baseDocument: ConsolidatedLawDocument = {
    instrumentType: instrument.type,
    number: instrument.number,
    year: instrument.year,
    title: instrument.title,
    shortTitle: instrument.shortTitle ?? undefined,
    status: instrument.status,
    asOfDate: instrument.effectiveFrom.toISOString(),
    activeAmendingInstruments: [],
    nodes: (byParent.get(null) ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(toNode)
      .filter((n): n is ProvisionNode => n !== null),
  };

  // --- Rakit ChangeSet payloads (lossless dari payload_json) ---
  const changeSets: ChangeSetPayload[] = instrument.modificationsReceived.map((cs) => ({
    id: cs.id,
    amendingInstrument: labelOf(cs.amendingInstrument),
    targetInstrument: labelOf(instrument),
    effectiveFrom: cs.amendingInstrument.effectiveFrom.toISOString(),
    title: cs.title,
    operations: cs.operations.map((op) => {
      if (!op.payloadJson) {
        throw new Error(`change_operation ${op.id} tanpa payload_json — jalankan ulang db:seed`);
      }
      return op.payloadJson as unknown as ChangeOperationPayload;
    }),
  }));

  const family: Family = { source: 'database', instrument, baseDocument, changeSets };
  familyCache.set(slug, family);
  return family;
}

/**
 * Circuit breaker: setelah gagal konek DB, jangan sentuh DB selama 30 dtk agar
 * mode demo respons instan. Setelah itu dicoba lagi — begitu database hidup
 * (mis. VPS), platform otomatis beralih dari demo ke data asli.
 */
let dbDownUntil = 0;
const DB_BREAKER_MS = 30_000;

/**
 * Pintu masuk tunggal: database lebih dulu; jika DB tidak tersedia/kosong dan
 * DEMO_FALLBACK aktif, keluarga pilot dilayani dari dataset engine (mode demo).
 */
export async function loadFamily(slug: string): Promise<Family> {
  if (DEMO_FALLBACK && slug === 'ite' && Date.now() < dbDownUntil) return demoFamily();
  try {
    return await loadFamilyFromDb(slug);
  } catch (e) {
    const connFail = isDbConnectionError(e);
    if (connFail) dbDownUntil = Date.now() + DB_BREAKER_MS;
    const isDataGap =
      connFail ||
      (e instanceof Error &&
        (e.message === 'INSTRUMENT_NOT_FOUND' || e.message === 'DATABASE_EMPTY'));
    if (DEMO_FALLBACK && slug === 'ite' && isDataGap) return demoFamily();
    throw e;
  }
}

/** Tanggal snapshot untuk satu "tahun timeline": akhir tahun itu (semua changeset tahun itu sudah efektif). */
export function dateForYear(family: { baseDocument: ConsolidatedLawDocument; changeSets: ChangeSetPayload[] }, year: string): string {
  return `${year}-12-31T23:59:59Z`;
}

export function timelineYears(family: { baseDocument: ConsolidatedLawDocument; changeSets: ChangeSetPayload[] }): string[] {
  const years = new Set<string>([String(family.baseDocument.year)]);
  for (const cs of family.changeSets) years.add(String(new Date(cs.effectiveFrom).getUTCFullYear()));
  return [...years].sort();
}

export function isDbConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /P1001|P1002|Can't reach database|DATABASE_URL/i.test(msg);
}

/** Cari node di pohon konsolidasi berdasarkan canonicalPath. */
export function findNodeInTree(nodes: ProvisionNode[], target: string): ProvisionNode | null {
  for (const n of nodes) {
    if (n.canonicalPath === target) return n;
    if (n.children) {
      const res = findNodeInTree(n.children, target);
      if (res) return res;
    }
  }
  return null;
}
