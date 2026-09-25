// Detail dampak regulasi & amandemen per provision (dipisah dari satu file raksasa).

export interface ImpactedRegulation {
  id: string;
  type: 'PP' | 'PERMEN' | 'SKB' | 'UU' | 'PUTUSAN_MK';
  number: string;
  year: number;
  title: string;
  pasalTurunan: string;
  status: 'HILANG_CANTOLAN' | 'PERLU_PENYESUAIAN' | 'MANDAT_BARU' | 'USANG';
  statusLabel: string;
  ringkasanDampak: string;
  // Detail untuk Modal Pratinjau Perubahan
  uuIndukSebelum: string;
  uuIndukSesudah: string;
  ketentuanTurunanTerdampak: string;
  penjelasanPertentangan: string;
  rekomendasiHarmonisasi: string;
}

export interface ProvisionAmendmentDetail {
  canonicalPath: string;
  pasalLabel: string;
  diubahOleh: string;
  tanggalPengundangan: string;
  disahkanOleh?: string;
  lembaranNegara: string;
  statusPerubahan: 'DIUBAH' | 'SISIPAN_BARU' | 'DICABUT' | 'ASLI';
  statusBadge: string;
  textSebelum?: string;
  textSesudah?: string;
  putusanMk?: {
    nomor: string;
    tahun: number;
    amarPutusan: string;
    ratioDecidendi: string;
  };
  latarBelakangPerubahan: string;
  peraturanTerdampak: ImpactedRegulation[];
}
