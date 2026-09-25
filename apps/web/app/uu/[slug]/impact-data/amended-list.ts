import { ProvisionAmendmentDetail } from './types';

export interface AmendedProvisionItem {
  canonicalPath: string;
  label: string;
  status: 'DIUBAH' | 'SISIPAN_BARU' | 'DICABUT';
  statusLabel: string;
  amendingLaw: string;
  summary: string;
}

export const ALL_AMENDED_PROVISIONS: AmendedProvisionItem[] = [
  {
    canonicalPath: 'uu-11-2008/pasal-26',
    label: 'Pasal 26',
    status: 'DIUBAH',
    statusLabel: '🟡 Diubah (UU 19/2016 jo. UU PDP)',
    amendingLaw: 'UU No. 19/2016 & UU No. 27/2022',
    summary: 'Penambahan Right to be Forgotten dan harmonisasi perlindungan data pribadi.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27',
    label: 'Pasal 27',
    status: 'DIUBAH',
    statusLabel: '🟡 Diubah & Dipecah (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 2)',
    summary: 'Restrukturisasi 4 ayat: ayat (1)-(2) diubah, ayat (3)-(4) dicabut dan dipisah ke Pasal 27A & 27B.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-1',
    label: 'Pasal 27 ayat (1)',
    status: 'DIUBAH',
    statusLabel: '🟡 Redaksi Diperjelas',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 2 huruf a)',
    summary: 'Menambahkan klausul "untuk diketahui umum" dan pengecualian karya seni/pembelaan diri.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-3',
    label: 'Pasal 27 ayat (3)',
    status: 'DICABUT',
    statusLabel: '🔴 Dihapus / Dicabut',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 2 huruf b)',
    summary: 'Dicabut secara permanen. Norma dipindahkan dan diperketat ke dalam Pasal 27A.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-4',
    label: 'Pasal 27 ayat (4)',
    status: 'DICABUT',
    statusLabel: '🔴 Dihapus / Dicabut',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 2 huruf c)',
    summary: 'Dicabut secara permanen. Norma pemerasan siber dialihkan ke Pasal 27B.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27a',
    label: 'Pasal 27A',
    status: 'SISIPAN_BARU',
    statusLabel: '🟢 Sisipan Baru (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 3)',
    summary: 'Delik penyerangan kehormatan/nama baik dengan syarat tuduhan perbuatan spesifik.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-27b',
    label: 'Pasal 27B',
    status: 'SISIPAN_BARU',
    statusLabel: '🟢 Sisipan Baru (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 3)',
    summary: 'Delik pemerasan dan pengancaman membuka rahasia/aib di ruang digital.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-28',
    label: 'Pasal 28',
    status: 'DIUBAH',
    statusLabel: '🟡 Diubah & Ditambah Ayat',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 4)',
    summary: 'Penyempurnaan hoaks transaksi & SARA, serta penambahan delik kerusuhan (ayat 3).',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-28/ayat-3',
    label: 'Pasal 28 ayat (3)',
    status: 'SISIPAN_BARU',
    statusLabel: '🟢 Sisipan Baru (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 4 huruf c)',
    summary: 'Larangan menyebarkan berita bohong yang menimbulkan kerusuhan fisik nyata di masyarakat.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-36',
    label: 'Pasal 36',
    status: 'DICABUT',
    statusLabel: '🔴 Dihapus / Dicabut',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 8)',
    summary: 'Pasal pemberatan kerugian dicabut 100% untuk mencegah kesewenang-wenangan penahanan.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-40',
    label: 'Pasal 40',
    status: 'DIUBAH',
    statusLabel: '🟡 Diubah (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 9)',
    summary: 'Kewenangan pemerintah dalam memutus akses informasi elektronik yang melanggar hukum.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-40a',
    label: 'Pasal 40A',
    status: 'SISIPAN_BARU',
    statusLabel: '🟢 Sisipan Baru (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 10)',
    summary: 'Kewajiban PSE memberikan pelindungan komprehensif bagi anak di ruang siber.',
  },
  {
    canonicalPath: 'uu-11-2008/pasal-45',
    label: 'Pasal 45',
    status: 'DIUBAH',
    statusLabel: '🟡 Sanksi Diubah (UU 1/2024)',
    amendingLaw: 'UU No. 1 Tahun 2024 (Pasal I angka 14)',
    summary: 'Sanksi pencemaran dipangkas dari 4 tahun menjadi maks. 2 tahun (tersangka tidak dapat ditahan).',
  },
];
