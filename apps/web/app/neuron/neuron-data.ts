/** Data statis peta silsilah & matriks harmonisasi keluarga UU ITE. */

export interface LegalNode {
  id: string;
  label: string;
  type: 'UU_INDUK' | 'AMANDEMEN' | 'PP' | 'PERMEN' | 'PUTUSAN_MK';
  level: string;
  title: string;
  year: number;
  status: 'STABIL' | 'TERDAMPAK' | 'BATAL_BERSYARAT';
  statusLabel: string;
  delegasiBasis?: string;
  pasalTerdampak?: string[];
  description: string;
  harmonisasiRekomendasi?: string;
  linkSlug?: string;
}

export interface HarmonisasiRow {
  pasalUu: string;
  statusUuTerbaru: string;
  aturanTurunan: string;
  pasalTurunan: string;
  potensiKonflik: string;
  rekomendasi: string;
}

export const NODES_DATA: LegalNode[] = [
  {
    id: 'mk-50-2008',
    label: 'Putusan MK No. 50/PUU-VI/2008',
    type: 'PUTUSAN_MK',
    level: 'Tingkat I: Pengujian Konstitusionalitas (Mahkamah Konstitusi)',
    year: 2008,
    status: 'STABIL',
    statusLabel: 'Ditolak — Norma Tetap Berlaku; Tafsir Delik Aduan Ditegaskan',
    title: 'Pengujian Materiil Konstitusionalitas Pasal 27 ayat (3) UU ITE terhadap UUD 1945',
    description: 'Mahkamah Konstitusi MENOLAK permohonan pengujian untuk seluruhnya sehingga Pasal 27 ayat (3) tetap berlaku. Dalam pertimbangannya, MK menegaskan delik penghinaan dan pencemaran nama baik dalam ketentuan tersebut bersifat delik materiel aduan absolut (klachtdelict) yang merujuk pada Pasal 310 dan Pasal 311 KUHP — tafsir yang kemudian dikodifikasi dalam Penjelasan UU No. 19 Tahun 2016.',
    delegasiBasis: 'Pasal 24C ayat (1) UUD 1945',
    pasalTerdampak: ['Pasal 27 ayat (3)', 'Pasal 45 ayat (1)'],
    harmonisasiRekomendasi: 'Setiap proses penyidikan kepolisian dan dakwaan jaksa penuntut umum wajib mensyaratkan adanya pengaduan langsung dari korban (bukan laporan pihak ketiga).',
  },
  {
    id: 'uu-11-2008',
    label: 'UU No. 11 Tahun 2008',
    type: 'UU_INDUK',
    level: 'Tingkat II: Undang-Undang Pokok (Induk Kodifikasi)',
    year: 2008,
    status: 'STABIL',
    statusLabel: 'Naskah Pokok (Telah Diubah 2x)',
    title: 'Undang-Undang tentang Informasi dan Transaksi Elektronik',
    description: 'Pondasi hukum siber pertama di Indonesia yang mengatur alat bukti elektronik, tanda tangan digital, penyelenggaraan transaksi daring, serta delik perbuatan yang dilarang di ruang digital.',
    delegasiBasis: 'Pasal 5 ayat (1) dan Pasal 20 UUD 1945',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Seluruh regulasi turunan (PP dan Peraturan Menteri) berpijak pada pasal delegasi atribusi undang-undang ini.',
  },
  {
    id: 'uu-19-2016',
    label: 'UU No. 19 Tahun 2016',
    type: 'AMANDEMEN',
    level: 'Tingkat II: Amandemen Pertama',
    year: 2016,
    status: 'STABIL',
    statusLabel: 'Amandemen Historis',
    title: 'Perubahan Atas Undang-Undang Nomor 11 Tahun 2008 tentang ITE',
    description: 'Menindaklanjuti Putusan MK No. 50/PUU-VI/2008 dengan menurunkan ancaman pidana Pasal 27 ayat (3) dari 6 tahun menjadi 4 tahun (sehingga tersangka tidak dapat ditahan saat penyidikan) serta mempertegas sifat delik aduan.',
    delegasiBasis: 'Amandemen Pasal 27 ayat (3), Pasal 31, Pasal 40, Pasal 45 UU ITE',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Telah terintegrasi ke dalam naskah konsolidasi per 2016.',
  },
  {
    id: 'uu-1-2024',
    label: 'UU No. 1 Tahun 2024',
    type: 'AMANDEMEN',
    level: 'Tingkat II: Amandemen Kedua (Hukum Positif Berlaku)',
    year: 2024,
    status: 'STABIL',
    statusLabel: 'Revisi Terkini (Berlaku)',
    title: 'Perubahan Kedua Atas Undang-Undang Nomor 11 Tahun 2008 tentang ITE',
    description: 'Restrukturisasi radikal atas kluster delik konten ilegal: memecah Pasal 27, menyisipkan Pasal 27A (penyerangan kehormatan) dan Pasal 27B (pemerasan/pengancaman), memperketat pembuktian kerusuhan (Pasal 28 ayat 3), serta mewajibkan proteksi anak dalam penyelenggaraan sistem elektronik.',
    delegasiBasis: 'Pembaruan UU 11/2008 & penyesuaian asas KUHP Nasional (UU 1/2023)',
    linkSlug: 'ite',
    harmonisasiRekomendasi: 'Memerlukan pembaharuan aturan pelaksana pada tingkat Peraturan Pemerintah agar selaras dengan delik baru.',
  },
  {
    id: 'pp-71-2019',
    label: 'PP No. 71 Tahun 2019',
    type: 'PP',
    level: 'Tingkat III: Peraturan Pemerintah (Aturan Pelaksana)',
    year: 2019,
    status: 'TERDAMPAK',
    statusLabel: 'Terdampak Revisi UU 1/2024',
    title: 'Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE)',
    description: 'Mengatur klasifikasi Penyelenggara Sistem Elektronik (PSE Lingkup Publik dan Privat), tata kelola data pribadi, penempatan pusat data (data center), dan kewajiban penapisan/moderasi konten yang dilarang.',
    delegasiBasis: 'Atribusi dari Pasal 17 ayat (3), Pasal 22, dan Pasal 40 UU ITE 2008',
    pasalTerdampak: ['Pasal 5 (Konten yang Dilarang)', 'Pasal 21 (Pendaftaran PSE)', 'Pasal 96 (Sanksi Administratif)'],
    harmonisasiRekomendasi: 'Definisi "konten yang dilarang" dalam Pasal 5 PP 71/2019 masih merujuk rumusan lama Pasal 27 UU ITE 2008. Pemerintah wajib merevisi PP ini agar sinkron dengan batasan delik Pasal 27A dan Pasal 27B pada UU 1/2024.',
  },
  {
    id: 'permen-5-2020',
    label: 'Permenkominfo No. 5 Tahun 2020',
    type: 'PERMEN',
    level: 'Tingkat IV: Peraturan Menteri (Aturan Teknis Lapangan)',
    year: 2020,
    status: 'TERDAMPAK',
    statusLabel: 'Terdampak Harmonisasi Teknis',
    title: 'Penyelenggara Sistem Elektronik Lingkup Privat',
    description: 'Petunjuk teknis pendaftaran PSE privat domestik/asing, kewajiban permohonan pemutusan akses (takedown) konten dalam kurun waktu 1x24 jam (atau 4 jam untuk konten mendesak), serta pemberian akses data ke penegak hukum.',
    delegasiBasis: 'Delegasi teknis dari Pasal 6 dan Pasal 9 PP 71/2019',
    pasalTerdampak: ['Pasal 9 ayat (3)', 'Pasal 13 (Kriteria Konten Meresahkan)'],
    harmonisasiRekomendasi: 'Frasa "meresahkan masyarakat dan mengganggu ketertiban umum" rentan multitafsir pasca UU 1/2024 mensyaratkan timbulnya kerusuhan fisik nyata (bukan sekadar keresahan abstrak). Perlu penyesuaian SOP takedown konten.',
  },
];

export const MATRIKS_HARMONISASI: HarmonisasiRow[] = [
  {
    pasalUu: 'Pasal 27 ayat (3) UU 11/2008 → Dipecah ke Pasal 27A & 27B UU 1/2024',
    statusUuTerbaru: 'Pencemaran nama baik dipisah dari pemerasan/pengancaman. Unsur "menyerang kehormatan demi kepentingan umum" dikecualikan.',
    aturanTurunan: 'PP No. 71/2019',
    pasalTurunan: 'Pasal 5 ayat (1) & (2)',
    potensiKonflik: 'PP 71/2019 masih memakai istilah umum "informasi yang melanggar kesusilaan/penghinaan" tanpa klausul pengecualian pembelaan diri.',
    rekomendasi: 'Harmonisasi definisi konten terlarang di PP 71/2019 agar tidak terjadi pemblokiran sepihak atas kritik publik yang sah.',
  },
  {
    pasalUu: 'Pasal 28 ayat (3) UU 1/2024 (Pemberitahuan Bohong yang Memicu Kerusuhan)',
    statusUuTerbaru: 'Wajib ada akibat nyata: "kerusuhan fisik di masyarakat" (delik materiil).',
    aturanTurunan: 'Permenkominfo No. 5/2020',
    pasalTurunan: 'Pasal 9 ayat (4) huruf a',
    potensiKonflik: 'Permenkominfo masih menggunakan frasa "meresahkan masyarakat" sebagai dasar takedown cepat 4 jam.',
    rekomendasi: 'Menyesuaikan pedoman takedown Kementerian Komdigi agar selaras dengan standar pembuktian kerusuhan pada UU 1/2024.',
  },
  {
    pasalUu: 'Pasal 16A UU 1/2024 (Kewajiban Pelindungan Anak di Ruang Siber)',
    statusUuTerbaru: 'Norma baru mewajibkan PSE menyediakan fitur ramah anak dan verifikasi batas usia.',
    aturanTurunan: 'PP No. 71/2019',
    pasalTurunan: 'Belum diatur secara spesifik',
    potensiKonflik: 'Ketiadaan petunjuk teknis verifikasi usia dan sanksi operasional PSE ramah anak.',
    rekomendasi: 'Pemerintah perlu menerbitkan PP Perubahan atas PP 71/2019 atau Permen tersendiri terkait tata kelola pelindungan anak di ruang digital.',
  },
];
