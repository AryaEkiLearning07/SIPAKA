export type InstrumentType =
  | 'UUD1945'
  | 'TAP_MPR'
  | 'UU'
  | 'PERPPU'
  | 'PP'
  | 'PERPRES'
  | 'PERMEN'
  | 'PERDA_PROV'
  | 'PERDA_KABKOT'
  | 'PERGUB'
  | 'PERBUP'
  | 'PERWALI'
  | 'QANUN';

export type InstrumentStatus =
  | 'BERLAKU'
  | 'DIUBAH'
  | 'DICABUT'
  | 'TIDAK_BERLAKU_SEBAGIAN';

export type ProvisionType =
  | 'BUKU'
  | 'LAMPIRAN'
  | 'BAB'
  | 'BAGIAN'
  | 'PARAGRAF'
  | 'PASAL'
  | 'AYAT'
  | 'HURUF'
  | 'ANGKA'
  | 'PENJELASAN_UMUM'
  | 'PENJELASAN_PASAL';

export interface ProvisionNode {
  canonicalPath: string; // e.g. "uu-11-2008/pasal-27/ayat-3"
  type: ProvisionType;
  orderIndex: number;
  label: string; // e.g. "Pasal 27", "Ayat (3)"
  title?: string;
  content: string;
  explanation?: string;
  versionTag: string; // e.g. "ORIGINAL_2008", "AMENDMENT_2016"
  isRepealed?: boolean;
  repealBasis?: string;
  judicialAnnotations?: Array<{
    id?: string;
    court?: string;
    caseNumber: string;
    rulingDate: string;
    effect: 'BATAL_SELURUHNYA' | 'INKONSTITUSIONAL_BERSYARAT' | 'KONSTITUSIONAL_BERSYARAT' | 'TIDAK_DITERIMA_NO' | 'DITOLAK' | string;
    affectedPhrase?: string;
    ratioDecidendi?: string;
    rulingVerdict?: string;
    sourceUrl?: string;
  }>;
  children: ProvisionNode[];
}

export interface ConsolidatedLawDocument {
  instrumentType: InstrumentType;
  number: number;
  year: number;
  title: string;
  shortTitle?: string;
  status: InstrumentStatus;
  asOfDate: string; // ISO 8601
  activeAmendingInstruments: string[];
  nodes: ProvisionNode[];
}
