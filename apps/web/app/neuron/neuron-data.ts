/** Data statis peta silsilah & matriks harmonisasi lintas regulasi pokok. */

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
  urgensi: 'KRITIS' | 'TINGGI' | 'SEDANG';
  kategori: 'DELEGASI_KOSONG' | 'KONFLIK_NORMA' | 'PERUBAHAN_ASAS' | 'PUTUSAN_MK';
}

export interface HarmonisasiDataset {
  id: string;
  slug: string;
  label: string;
  shortTitle: string;
  nomorTahun: string;
  totalAturanTerdampak: number;
  deskripsi: string;
  rows: HarmonisasiRow[];
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

export const HARMONISASI_DATASETS: HarmonisasiDataset[] = [
  {
    id: 'ite',
    slug: 'ite',
    label: 'UU Informasi & Transaksi Elektronik',
    shortTitle: 'UU ITE (UU 1/2024)',
    nomorTahun: 'UU No. 11/2008 jo UU No. 1/2024',
    totalAturanTerdampak: 4,
    deskripsi: 'Analisis ketidaksinkronan norma pasca-Amandemen Kedua UU ITE 2024 terhadap Peraturan Pemerintah & Peraturan Menteri eksisting.',
    rows: [
      {
        pasalUu: 'Pasal 27 ayat (3) UU 11/2008 → Dipecah ke Pasal 27A & 27B UU 1/2024',
        statusUuTerbaru: 'Pencemaran nama baik dipisah dari pemerasan/pengancaman. Unsur "menyerang kehormatan demi kepentingan umum" dikecualikan secara eksplisit.',
        aturanTurunan: 'PP No. 71/2019 (PSTE)',
        pasalTurunan: 'Pasal 5 ayat (1) & (2)',
        potensiKonflik: 'PP 71/2019 masih memakai klausul umum "informasi yang melanggar kesusilaan/penghinaan" tanpa pengecualian pembelaan kepentingan umum.',
        rekomendasi: 'Harmonisasi definisi konten terlarang di PP 71/2019 agar tidak terjadi pemutusan akses administratif atas pengawasan publik yang sah.',
        urgensi: 'KRITIS',
        kategori: 'KONFLIK_NORMA',
      },
      {
        pasalUu: 'Pasal 28 ayat (3) UU 1/2024 (Pemberitahuan Bohong yang Memicu Kerusuhan)',
        statusUuTerbaru: 'Mensyaratkan akibat riil: "kerusuhan fisik di masyarakat" (delik materiil, bukan sekadar kegaduhan daring).',
        aturanTurunan: 'Permenkominfo No. 5/2020 (PSE Privat)',
        pasalTurunan: 'Pasal 9 ayat (4) huruf a',
        potensiKonflik: 'Permenkominfo masih menggunakan frasa "meresahkan masyarakat" sebagai dasar takedown kilat 4 jam tanpa verifikasi bukti benturan fisik.',
        rekomendasi: 'Revisi Permenkominfo agar pedoman moderasi konten Komdigi selaras dengan standar pembuktian kerusuhan pada UU 1/2024.',
        urgensi: 'TINGGI',
        kategori: 'KONFLIK_NORMA',
      },
      {
        pasalUu: 'Pasal 16A UU 1/2024 (Kewajiban Pelindungan Anak di Ruang Siber)',
        statusUuTerbaru: 'Norma baru mewajibkan PSE menyediakan fitur pelindungan anak dan sistem verifikasi usia pengguna.',
        aturanTurunan: 'PP No. 71/2019',
        pasalTurunan: 'Belum diatur (Kekosongan Regulasi Pelaksana)',
        potensiKonflik: 'Belum ada petunjuk teknis batas usia minimum anak dan sanksi operasional atas kelalaian PSE dalam menyaring konten dewasa.',
        rekomendasi: 'Pemerintah wajib menerbitkan PP Perubahan PSTE atau Rancangan PP Perlindungan Anak di Ranah Daring sebagai mandat Pasal 16A ayat (4).',
        urgensi: 'KRITIS',
        kategori: 'DELEGASI_KOSONG',
      },
      {
        pasalUu: 'Pasal 40 ayat (2a) & (2b) UU 1/2024 (Wewenang Pemutusan Akses)',
        statusUuTerbaru: 'Pemerintah berwenang memutus akses konten yang melanggar hukum, dengan kewajiban menyampaikan alasan tertulis kepada PSE.',
        aturanTurunan: 'Kepmenkominfo / SOP Dirjen Aptika',
        pasalTurunan: 'SOP Internal Moderasi Konten',
        potensiKonflik: 'Ketiadaan mekanisme banding administratif (due process of law) yang independen bagi pemilik situs yang terblokir keliru.',
        rekomendasi: 'Penyusunan Peraturan Menteri Komdigi yang mengatur hak sanggah (right to appeal) dan komite independen pemulihan akses (restoration).',
        urgensi: 'SEDANG',
        kategori: 'PERUBAHAN_ASAS',
      },
    ],
  },
  {
    id: 'kuhp-2023',
    slug: 'kuhp-2023',
    label: 'KUHP Nasional (UU No. 1/2023)',
    shortTitle: 'KUHP Baru (UU 1/2023)',
    nomorTahun: 'UU No. 1 Tahun 2023',
    totalAturanTerdampak: 5,
    deskripsi: 'Pemetaan mandat regulasi pelaksana KUHP Nasional menjelang pemberlakuan penuh 2 Januari 2026 (Transisi Stufenbau & Lex Posteriori).',
    rows: [
      {
        pasalUu: 'Pasal 2 & Pasal 597 UU 1/2023 (Living Law / Hukum Adat yang Hidup)',
        statusUuTerbaru: 'Hukum yang hidup dalam masyarakat diakui sebagai dasar pemidanaan sepanjang tidak bertentangan dengan Pancasila dan UUD 1945.',
        aturanTurunan: 'Rancangan Peraturan Pemerintah (RPP) Living Law',
        pasalTurunan: 'Mandat Pasal 2 ayat (3) UU 1/2023',
        potensiKonflik: 'Kekosongan kriteria objektif penetapan norma hukum adat ke dalam Peraturan Daerah (Perda) berisiko memicu ketidakpastian hukum lokal.',
        rekomendasi: 'Kementerian Hukum wajib mempercepat penerbitan PP Pedoman Tata Cara Penetapan Perda Hukum yang Hidup dalam Masyarakat.',
        urgensi: 'KRITIS',
        kategori: 'DELEGASI_KOSONG',
      },
      {
        pasalUu: 'Pasal 64, 65, & 66 UU 1/2023 (Pidana Kerja Sosial & Pidana Pengawasan)',
        statusUuTerbaru: 'Pengenalan sanksi non-pemenjaraan sebagai alternatif pidana penjara di bawah 3-5 tahun untuk mengurangi overkapasitas lapas.',
        aturanTurunan: 'RPP Tata Cara Pelaksanaan Pidana Pengawasan & Kerja Sosial',
        pasalTurunan: 'Mandat Pasal 66 ayat (4) & Pasal 77 UU 1/2023',
        potensiKonflik: 'Aparat Penegak Hukum (Jaksa Eksekutor & Pembimbing Kemasyarakatan Bapas) belum memiliki SOP integrasi dengan pemerintah daerah penyedia tempat kerja sosial.',
        rekomendasi: 'Harmonisasi regulasi Kemenkumham, Kejaksaan Agung, dan Kemendagri dalam penyusunan MoU dan juknis pengawasan kerja sosial terpadu.',
        urgensi: 'KRITIS',
        kategori: 'DELEGASI_KOSONG',
      },
      {
        pasalUu: 'Pasal 100 UU 1/2023 (Masa Percobaan Pidana Mati 10 Tahun)',
        statusUuTerbaru: 'Hakim wajib menjatuhkan pidana mati bersyarat dengan tenggang percobaan 10 tahun apabila terdakwa memenuhi syarat remorse.',
        aturanTurunan: 'RPP Penilaian Perilaku Narapidana Pidana Mati',
        pasalTurunan: 'Mandat Pasal 100 ayat (6) UU 1/2023',
        potensiKonflik: 'Belum adanya rubrik penilaian obyektif dan independen atas klausul "menunjukkan rasa menyesal dan ada harapan untuk diperbaiki".',
        rekomendasi: 'Pembentukan dewan asesmen psikologis/koreksional independen guna menjamin akuntabilitas perubahan pidana mati menjadi pidana seumur hidup.',
        urgensi: 'TINGGI',
        kategori: 'PERUBAHAN_ASAS',
      },
      {
        pasalUu: 'Pasal 613 - 624 UU 1/2023 (Aturan Peralihan Transisi KUHP Lama WvS)',
        statusUuTerbaru: 'Pemberlakuan asas retroaktif menguntungkan (lex favor reo) jika terjadi perubahan perundang-undangan saat perkara berjalan.',
        aturanTurunan: 'SOP Kejaksaan Agung & Mahkamah Agung',
        pasalTurunan: 'Pedoman Penuntutan & Vonis Transisi',
        potensiKonflik: 'Perbedaan interpretasi jaksa dan hakim dalam menangani perkara tindak pidana yang ancaman hukumannya lebih ringan pada KUHP Baru.',
        rekomendasi: 'Mahkamah Agung dan Kejagung perlu menerbitkan SEMA (Surat Edaran MA) serta Perja Pedoman Transisi sebelum 2 Januari 2026.',
        urgensi: 'TINGGI',
        kategori: 'PERUBAHAN_ASAS',
      },
    ],
  },
  {
    id: 'pdp',
    slug: 'pdp',
    label: 'UU Pelindungan Data Pribadi (UU No. 27/2022)',
    shortTitle: 'UU PDP (UU 27/2022)',
    nomorTahun: 'UU No. 27 Tahun 2022',
    totalAturanTerdampak: 4,
    deskripsi: 'Audit regulasi pasca-berakhirnya masa transisi 2 tahun UU PDP (Oktober 2024) dan kepatuhan pengendali/pemroses data.',
    rows: [
      {
        pasalUu: 'Pasal 58, 59, & 60 UU 27/2022 (Pembentukan Lembaga Pengawas PDP)',
        statusUuTerbaru: 'Lembaga pengawas independen berwenang menjatuhkan sanksi administratif hingga 2% dari pendapatan tahunan pengendali data.',
        aturanTurunan: 'Rancangan Perpres Lembaga Pelindungan Data Pribadi',
        pasalTurunan: 'Mandat Pasal 60 UU 27/2022',
        potensiKonflik: 'Hingga lewat masa transisi 2 tahun (17 Oktober 2024), Perpres pembentukan Lembaga PDP belum kunjung diundangkan, memicu ketidakpastian otoritas penegakan sanksi.',
        rekomendasi: 'Pemerintah RI wajib segera menerbitkan Perpres Pembentukan Lembaga Otoritas PDP guna memberikan kepastian hukum industri dan kepatuhan publik.',
        urgensi: 'KRITIS',
        kategori: 'DELEGASI_KOSONG',
      },
      {
        pasalUu: 'Pasal 53 & 54 UU 27/2022 (Pejabat/Petugas Pelindungan Data - DPO)',
        statusUuTerbaru: 'Pengendali data yang memproses data berisiko tinggi wajib menunjuk Pejabat Pelindungan Data Pribadi (Data Protection Officer).',
        aturanTurunan: 'RPP Tata Kelola PDP & SKKNI DPO',
        pasalTurunan: 'Mandat Pasal 54 ayat (3) UU 27/2022',
        potensiKonflik: 'Belum ada kurikulum akreditasi resmi dan standar kompetensi DPO di Indonesia, menyebabkan risiko salah tafsir peran DPO di korporasi.',
        rekomendasi: 'Harmonisasi BNSP dan Kementerian Komdigi dalam penetapan skema sertifikasi kompetensi kerja DPO nasional yang berstandar internasional.',
        urgensi: 'TINGGI',
        kategori: 'DELEGASI_KOSONG',
      },
      {
        pasalUu: 'Pasal 56 UU 27/2022 (Transfer Data Pribadi Lintas Batas / Cross-Border)',
        statusUuTerbaru: 'Transfer data ke luar negeri mensyaratkan tingkat pelindungan data yang setara atau lebih tinggi di negara penerima (Adequacy Decision).',
        aturanTurunan: 'RPP Pedoman Transfer Data Internasional',
        pasalTurunan: 'Mandat Pasal 56 ayat (4) UU 27/2022',
        potensiKonflik: 'Tanpa adanya daftar resmi negara setara (white-list adequacy), perusahaan multinasional dan fintech terhambat dalam kepatuhan komputasi awan.',
        rekomendasi: 'Penerbitan daftar negara layak (adequacy countries) serta klausul kontrak standar (Standard Contractual Clauses - SCCs) versi yurisdiksi Indonesia.',
        urgensi: 'TINGGI',
        kategori: 'KONFLIK_NORMA',
      },
    ],
  },
  {
    id: 'ciptaker',
    slug: 'ciptaker',
    label: 'UU Cipta Kerja (UU No. 6/2023)',
    shortTitle: 'UU Ciptaker (UU 6/2023)',
    nomorTahun: 'UU No. 6 Tahun 2023',
    totalAturanTerdampak: 4,
    deskripsi: 'Harmonisasi regulasi pasca-Putusan Mahkamah Konstitusi No. 168/PUU-XXI/2023 terhadap kluster ketenagakerjaan.',
    rows: [
      {
        pasalUu: 'Kluster Ketenagakerjaan UU 6/2023 jo Putusan MK No. 168/PUU-XXI/2023',
        statusUuTerbaru: 'MK membatalkan sebagian klausul PKWT, outsourcing sepihak, dan formula upah minimum tanpa indeks daya beli lokal.',
        aturanTurunan: 'PP No. 35/2021 & PP No. 36/2021',
        pasalTurunan: 'Pasal-pasal durasi PKWT & formula perhitungan UMP',
        potensiKonflik: 'PP 35/2021 dan PP 36/2021 yang masih berlaku bertentangan langsung dengan amar Putusan MK No. 168/PUU-XXI/2023.',
        rekomendasi: 'Kementerian Ketenagakerjaan wajib merevisi PP 35/2021 dan PP 36/2021, serta menyusun UU Ketenagakerjaan baru tersendiri sesuai instruksi MK paling lambat 2 tahun.',
        urgensi: 'KRITIS',
        kategori: 'PUTUSAN_MK',
      },
      {
        pasalUu: 'Kluster AMDAL & Perizinan Berusaha Berbasis Risiko (PBBR)',
        statusUuTerbaru: 'Penyederhanaan izin lingkungan menjadi Persetujuan Lingkungan melalui sistem OSS terpadu.',
        aturanTurunan: 'PP No. 5/2021 (PBBR) & PP No. 22/2021 (Penyelenggaraan Lingkungan Hidup)',
        pasalTurunan: 'Pasal 88 - 95 PP 22/2021',
        potensiKonflik: 'Keterbatasan pelibatan masyarakat terdampak langsung dalam uji kelayakan lingkungan perizinan berisiko tinggi.',
        rekomendasi: 'Pemerintah daerah dan KLHK perlu memperkuat instrumen verifikasi faktual lapangan sebelum persetujuan lingkungan diterbitkan secara otomatis oleh sistem OSS.',
        urgensi: 'SEDANG',
        kategori: 'KONFLIK_NORMA',
      },
    ],
  },
];

/** Alias untuk backward compatibility */
export const MATRIKS_HARMONISASI: HarmonisasiRow[] = HARMONISASI_DATASETS[0].rows;
