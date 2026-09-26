import { ConsolidatedLawDocument, ProvisionDiffResult } from '@lexvera/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface InstrumentMeta {
  slug: string;
  type: string;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: string;
  source?: 'database' | 'engine-demo';
  preamble?: { menimbang: string[]; mengingat: string[] } | null;
  penutup?: string | null;
  lnNumber?: number | null;
  tlnNumber?: number | null;
  availableTimelines: string[];
  amendments: { title: string; amendingInstrument: string; effectiveFrom: string }[];
}

export interface RiwayatVersi {
  year: string;
  ada: boolean;
  isRepealed: boolean;
  versionTag: string | null;
  content: string | null;
}

export interface LedgerOp {
  operationType: string;
  targetCanonicalPath: string;
  sourceReference: string;
  ringkas: string;
}

export interface LedgerChangeSet {
  id: string;
  amendingInstrument: string;
  title: string;
  effectiveFrom: string;
  operations: LedgerOp[];
}

export interface InspectorState {
  canonicalPath: string;
  label: string;
  parentLabel?: string;
  status: string;
  amendedBy?: string;
  versionTag: string;
  isRepealed?: boolean;
  repealBasis?: string;
  fromText: string;
  toText: string;
  diff: ProvisionDiffResult;
  riwayat?: RiwayatVersi[];
  ops?: OpsRow[];
  loading?: boolean;
}

export interface OpsRow {
  id: string;
  operationType: string;
  sourceReference: string;
  targetCanonicalPath: string;
  targetLabel: string;
  previousContent: string | null;
  newContent: string | null;
  changeSetTitle: string;
  effectiveFrom: string;
  amender: string;
  amenderSlug: string | null;
}

export type InspectorTab = 'diff' | 'affected_list' | 'relasi';

export async function fetchSnapshot(slug: string, year: string): Promise<ConsolidatedLawDocument> {
  const res = await fetch(`${API_BASE}/api/v1/instruments/${slug}/snapshot?year=${year}`);
  if (!res.ok) throw new Error(`snapshot ${year} gagal (HTTP ${res.status})`);
  const json = await res.json();
  return json.data as ConsolidatedLawDocument;
}
