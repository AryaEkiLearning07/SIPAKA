export * from './types';
export { ALL_AMENDED_PROVISIONS } from './amended-list';
export type { AmendedProvisionItem } from './amended-list';

import { ProvisionAmendmentDetail } from './types';
import { MAP_PASAL_27 } from './map-pasal-27';
import { MAP_LAINNYA } from './map-lainnya';

/** Peta gabungan seluruh detail amandemen per provision. */
export const PROVISION_AMENDMENT_MAP: Record<string, ProvisionAmendmentDetail> = {
  ...MAP_PASAL_27,
  ...MAP_LAINNYA,
};

/**
 * Helper untuk mendapatkan detail perubahan berdasarkan path pasal atau ayat
 */
export function getProvisionAmendmentDetail(canonicalPath: string, label: string): ProvisionAmendmentDetail {
  // 1. Coba kecocokan langsung
  if (PROVISION_AMENDMENT_MAP[canonicalPath]) {
    return PROVISION_AMENDMENT_MAP[canonicalPath];
  }

  // 2. Coba cocokkan ke pasal induknya (misal uu-11-2008/pasal-27/ayat-1 -> uu-11-2008/pasal-27)
  const parts = canonicalPath.split('/');
  if (parts.length >= 2) {
    const parentPath = `${parts[0]}/${parts[1]}`;
    if (PROVISION_AMENDMENT_MAP[parentPath]) {
      const parent = PROVISION_AMENDMENT_MAP[parentPath];
      return {
        ...parent,
        pasalLabel: label,
      };
    }
  }

  // 3. Fallback cerdas untuk pasal lainnya
  return {
    canonicalPath,
    pasalLabel: label,
    diubahOleh: 'UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (Naskah Pokok)',
    tanggalPengundangan: 'Disahkan di Jakarta: 21 April 2008 | Diundangkan: 21 April 2008',
    disahkanOleh: 'Presiden RI Dr. H. Susilo Bambang Yudhoyono & Diundangkan oleh Menkumham Andi Mattalatta',
    lembaranNegara: 'Lembaran Negara Republik Indonesia Tahun 2008 Nomor 58, Tambahan Lembaran Negara Nomor 4843',
    statusPerubahan: 'ASLI',
    statusBadge: 'Naskah Asli Berlaku (Stabil)',
    textSebelum: 'Naskah asli UU 11/2008 yang sah diundangkan pada 21 April 2008.',
    textSesudah: 'Norma hukum positif asli berlaku stabil tanpa modifikasi teks.',
    latarBelakangPerubahan: 'Norma pasal ini belum mengalami amandemen dalam perubahan UU No. 19 Tahun 2016 maupun UU No. 1 Tahun 2024. Norma tetap mengikat secara penuh sesuai naskah asli pengundangan.',
    peraturanTerdampak: [
      {
        id: 'pp-71-2019-general',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'Penyelenggaraan Sistem dan Transaksi Elektronik',
        pasalTurunan: 'Ketentuan Umum & Aturan Pelaksana Terkait',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: 'Pelaksanaan Stabil',
        ringkasanDampak: 'Ketentuan operasional berpijak pada pasal atribusi undang-undang induk ini.',
        uuIndukSebelum: 'Naskah asli UU 11/2008.',
        uuIndukSesudah: 'Norma stabil tidak mengalami modifikasi redaksional.',
        ketentuanTurunanTerdampak: 'Aturan teknis operasional penyelenggaraan sistem elektronik.',
        penjelasanPertentangan: 'Tidak ditemukan pertentangan norma hukum karena pasal induk berstatus stabil.',
        rekomendasiHarmonisasi: 'Pertahankan keselarasan penafsiran dengan doktrin hukum siber nasional.',
      },
    ],
  };
}
