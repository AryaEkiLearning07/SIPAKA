/**
 * Intelligence Store: Hukum Internasional & Risalah Pembentukan (Original Intent)
 * Memenuhi 2 Inovasi Utama SIPAKA:
 * 1. Instrumen Hukum Internasional, Perjanjian Bilateral/Multilateral & Treaty Room Kemlu RI.
 * 2. Risalah Pembentukan Hukum, Naskah Akademik (NA), DIM Fraksi DPR RI, & Transkrip Sidang Terbuka MKRI.
 */

export interface InternationalBenchmark {
  id: string;
  scope: 'BILATERAL' | 'MULTILATERAL' | 'MODEL_LAW' | 'REGIONAL';
  title: string;
  sourceOrg: string;
  year: number;
  treatyStatusRI: 'DIRATIFIKASI' | 'PENANDATANGAN' | 'OBSERVER_FRAMEWORK' | 'ACUAN_HARMONISASI';
  ratificationLegalBasis?: string;
  relevantArticles: string;
  nationalComparison: {
    nationalProvision: string;
    internationalNorm: string;
    gapAnalysis: string;
  };
  summary: string;
  officialDocUrl?: string;
}

export interface OriginalIntentRecord {
  id: string;
  canonicalPath: string;
  provisionLabel: string;
  naskahAkademik: {
    latarBelakang: string;
    landasanFilosofis: string;
    landasanSosiologis: string;
  };
  dimDpr: {
    nomorDim: string;
    sikapPemerintah: string;
    sikapFraksiDpr: string;
    catatanKompromi: string;
  };
  risalahMk: {
    nomorPerkara: string;
    tahun: number;
    keteranganDprPresiden: string;
    ratioDecidendi: string;
    statusAmar: string;
  };
  penjelasanResmi: string;
}

// ── 1. DATASET INSTRUMEN INTERNASIONAL (INOVASI A) ──────────────────────────
export const INTERNATIONAL_BENCHMARKS: InternationalBenchmark[] = [
  {
    id: 'budapest-convention-ets-185',
    scope: 'MULTILATERAL',
    title: 'Budapest Convention on Cybercrime (ETS No. 185)',
    sourceOrg: 'Council of Europe (CoE) / Global Reference',
    year: 2001,
    treatyStatusRI: 'ACUAN_HARMONISASI',
    ratificationLegalBasis: 'Harmonisasi Materiil Materi UU ITE (Proses Pengkajian Aksesi Ditjen HPI Kemlu)',
    relevantArticles: 'Articles 2–6 (Offences against confidentiality, integrity and availability of computer data)',
    nationalComparison: {
      nationalProvision: 'Pasal 30, 31, 32 UU ITE (Illegal Access, Interception, Data Interference)',
      internationalNorm: 'Articles 2, 3, 4 Budapest Convention (Illegal Access, Illegal Interception, Data Interference)',
      gapAnalysis: 'Substansi delik telah teradopsi 90% secara harmonis ke dalam UU ITE. UU ITE menerapkan ancaman pidana maksimum lebih tinggi dibanding yurisdiksi Eropa barat.',
    },
    summary: 'Perjanjian multilateral pertama yang mengikat mengenai kejahatan internet dan jaringan komputer. Menjadi benchmark global penyusunan delik cybercrime di Indonesia.',
    officialDocUrl: 'https://www.coe.int/en/web/cybercrime/the-budapest-convention',
  },
  {
    id: 'uncitral-model-law-e-commerce',
    scope: 'MODEL_LAW',
    title: 'UNCITRAL Model Law on Electronic Commerce (1996) with additional article 5 bis',
    sourceOrg: 'United Nations Commission on International Trade Law (UNCITRAL)',
    year: 1996,
    treatyStatusRI: 'ACUAN_HARMONISASI',
    ratificationLegalBasis: 'Prinsip Non-Diskriminasi Data Elektronik dalam Konsiderans & Pasal 5 UU ITE',
    relevantArticles: 'Article 5 (Legal recognition of data messages), Article 6 (Writing requirement), Article 7 (Signature)',
    nationalComparison: {
      nationalProvision: 'Pasal 5 & Pasal 11 UU ITE (Alat Bukti Elektronik & Tanda Tangan Elektronik)',
      internationalNorm: 'Articles 5–7 UNCITRAL (Functional Equivalence Principle)',
      gapAnalysis: 'Prinsip kesetaraan fungsional (functional equivalence) antara dokumen kertas dan dokumen elektronik dalam Pasal 5 UU ITE mengadopsi penuh standar UNCITRAL.',
    },
    summary: 'Standar model hukum PBB yang memberikan pengakuan legalitas yang sama bagi transaksi berbasis kertas dan transaksi digital.',
    officialDocUrl: 'https://uncitral.un.org/en/texts/ecommerce/modellaw/electronic_commerce',
  },
  {
    id: 'gdpr-eu-2016-679-rtbf',
    scope: 'REGIONAL',
    title: 'Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR)',
    sourceOrg: 'European Parliament and Council of the European Union',
    year: 2016,
    treatyStatusRI: 'ACUAN_HARMONISASI',
    ratificationLegalBasis: 'Rujukan Pembaruan UU No. 19/2016 (Pasal 26 ayat 3) & UU No. 27/2022 (UU PDP)',
    relevantArticles: 'Article 17 (Right to erasure / Right to be forgotten)',
    nationalComparison: {
      nationalProvision: 'Pasal 26 ayat (3) UU ITE (Penghapusan Informasi Elektronik Tidak Relevan)',
      internationalNorm: 'Article 17 GDPR (Right to erasure without undue delay)',
      gapAnalysis: 'UU ITE mewajibkan adanya penetapan pengadilan negeri bagi pelaksanaan hak untuk dihapus, sedangkan GDPR membebankan kewajiban proaktif langsung pada pengendali data (data controller).',
    },
    summary: 'Regulasi perlindungan data terkuat dunia yang memperkenalkan hak setiap orang untuk menuntut penghapusan data pribadi yang tidak relevan di internet.',
    officialDocUrl: 'https://gdpr-info.eu/art-17-gdpr/',
  },
  {
    id: 'iccpr-un-article-19',
    scope: 'MULTILATERAL',
    title: 'International Covenant on Civil and Political Rights (ICCPR)',
    sourceOrg: 'United Nations General Assembly',
    year: 1966,
    treatyStatusRI: 'DIRATIFIKASI',
    ratificationLegalBasis: 'UU Republik Indonesia No. 12 Tahun 2005 (LNRI 2005 No. 119)',
    relevantArticles: 'Article 19 (Freedom of expression and its legitimate limitations)',
    nationalComparison: {
      nationalProvision: 'Pasal 27 ayat (3), Pasal 27A, Pasal 28 ayat (2) UU ITE',
      internationalNorm: 'Article 19 paragraph (3) ICCPR (Legality, Legitimacy, and Necessity/Proportionality Test)',
      gapAnalysis: 'Pembaruan UU 1/2024 (menjadikan delik aduan absolut dan menurunkan ancaman pidana) dilakukan untuk memenuhi standar uji proporsionalitas ICCPR yang telah diratifikasi Indonesia.',
    },
    summary: 'Kovenan internasional induk hak sipil dan politik yang telah disahkan menjadi hukum nasional Indonesia melalui UU 12/2005.',
    officialDocUrl: 'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-covenant-civil-and-political-rights',
  },
  {
    id: 'bilateral-sg-id-mla-extradition',
    scope: 'BILATERAL',
    title: 'Perjanjian Ekstradisi & Bantuan Hukum Timbal Balik RI - Singapura (Treaty Room Kemlu No. 03/TR/2022)',
    sourceOrg: 'Pemerintah RI & Pemerintah Republik Singapura',
    year: 2022,
    treatyStatusRI: 'DIRATIFIKASI',
    ratificationLegalBasis: 'UU No. 5 Tahun 2023 (Pengesahan Perjanjian Ekstradisi RI-Singapura)',
    relevantArticles: 'Mutual Legal Assistance (MLA) in Criminal Matters on Cyber-enabled Financial Crimes',
    nationalComparison: {
      nationalProvision: 'Pasal 2 UU ITE (Yurisdiksi Ekstrateritorial Indonesia)',
      internationalNorm: 'Bilateral Cyber Law Enforcement & Cross-Border Server Evidence Seizure',
      gapAnalysis: 'Memfasilitasi eksekusi yurisdiksi ekstrateritorial Pasal 2 UU ITE terhadap pelaku kejahatan siber finansial yang mengendalikan server dari wilayah Singapura.',
    },
    summary: 'Perjanjian bilateral strategis penegakan hukum lintas yurisdiksi untuk penyitaan barang bukti elektronik dan ekstradisi pelaku kejahatan siber.',
    officialDocUrl: 'https://treaty.kemlu.go.id/',
  },
];

// ── 2. DATASET RISALAH & ORIGINAL INTENT DPR/MK (INOVASI B) ─────────────────
export const ORIGINAL_INTENT_RECORDS: Record<string, OriginalIntentRecord> = {
  'uu-11-2008/pasal-26': {
    id: 'oi-pasal-26',
    canonicalPath: 'uu-11-2008/pasal-26',
    provisionLabel: 'Pasal 26',
    naskahAkademik: {
      latarBelakang: 'Perkembangan profil digital (digital profiling) dan agregasi data personal masyarakat oleh platform internet tanpa batas memerlukan instrumen persetujuan eksplisit (explicit informed consent) guna melindungi hak asasi privasi warga negara.',
      landasanFilosofis: 'Hak atas privasi merupakan bagian dari hak mempertahankan integritas diri dan kehormatan martabat manusia sebagaimana diamanatkan Pasal 28G ayat (1) UUD 1945.',
      landasanSosiologis: 'Mencegah eksploitasi dan monetisasi data pribadi konsumen tanpa hak dalam transaksi bisnis digital dan pemasaran langsung (direct marketing).',
    },
    dimDpr: {
      nomorDim: 'DIM RUU ITE No. 142-145 (Komisi I DPR RI 2008 & Pembaruan 2016)',
      sikapPemerintah: 'Mengusulkan kewajiban pengendali sistem elektronik menghapus data atas permintaan subjek data melalui mekanisme rechtbank / pengadilan.',
      sikapFraksiDpr: 'Fraksi DPR menyetujui penambahan mekanisme "right to be forgotten" (Pasal 26 ayat 3) pada perubahan 2016 guna mencegah stigma abadi korban di internet.',
      catatanKompromi: 'Disepakati bahwa penghapusan data tidak berlaku mutlak dan harus melalui penetapan pengadilan agar tidak menghapus arsip penegakan hukum atau kepentingan historis publik.',
    },
    risalahMk: {
      nomorPerkara: 'Putusan MK No. 5/PUU-VIII/2010',
      tahun: 2010,
      keteranganDprPresiden: 'Pemerintah dan DPR menegaskan di hadapan Mahkamah Konstitusi bahwa hak privasi data elektronik tidak bersifat absolut (derogable rights) dan tunduk pada pembatasan demi keamanan nasional dan penegakan hukum.',
      ratioDecidendi: 'Mahkamah menegaskan bahwa perlindungan data pribadi adalah hak konstitusional, dan penyadapan/akses tanpa hak terhadap data pribadi hanya sah jika diatur melalui Undang-Undang, bukan sekadar Peraturan Pemerintah.',
      statusAmar: 'Konstitusional Bersyarat (Mengharuskan syarat penegakan hukum diatur setingkat UU).',
    },
    penjelasanResmi: 'Dalam pemanfaatan Teknologi Informasi, perlindungan data pribadi merupakan salah satu bagian dari hak pribadi (privacy rights) yang mencakup hak untuk menikmati kehidupan pribadi dan bebas dari segala macam gangguan.',
  },

  'uu-11-2008/pasal-27': {
    id: 'oi-pasal-27',
    canonicalPath: 'uu-11-2008/pasal-27',
    provisionLabel: 'Pasal 27',
    naskahAkademik: {
      latarBelakang: 'Penyalahgunaan internet sebagai ruang publik virtual tanpa etika telah menimbulkan maraknya tindakan pencemaran nama baik, fitnah, dan pemerasan yang merugikan kehormatan warga negara.',
      landasanFilosofis: 'Keseimbangan antara hak kebebasan berekspresi (Pasal 28E ayat 3 UUD 1945) dengan kewajiban menghormati hak dan kehormatan orang lain dalam tertib hukum (Pasal 28J ayat 2 UUD 1945).',
      landasanSosiologis: 'Menghindari konflik horizontal, main hakim sendiri, dan disintegrasi sosial yang dipicu oleh penyebaran muatan fitnah digital.',
    },
    dimDpr: {
      nomorDim: 'DIM Panja Komisi I RUU Perubahan UU ITE 2023–2024',
      sikapPemerintah: 'Pemerintah mengusulkan perombakan total Pasal 27: memecah pencemaran nama baik ke Pasal 27A baru dan memindahkan ancaman pemerasan ke Pasal 27B.',
      sikapFraksiDpr: 'Seluruh fraksi sepakat menghapus Pasal 27 ayat (3) lama yang multitafsir ("pasal karet") dan menetapkan Pasal 27A sebagai delik aduan absolut (hanya korban asli yang berhak melapor).',
      catatanKompromi: 'Ancaman pidana diturunkan dari 4 tahun menjadi maksimum 2 tahun, sehingga tersangka tidak dapat ditahan secara sewenang-wenang selama proses penyidikan kepolisian.',
    },
    risalahMk: {
      nomorPerkara: 'Putusan MK No. 50/PUU-VI/2008 & No. 76/PUU-XV/2017',
      tahun: 2008,
      keteranganDprPresiden: 'DPR dan Pemerintah memberikan keterangan resmi bahwa frasa pencemaran nama baik dalam UU ITE tidak dapat dipisahkan dari norma pokok penghinaan dalam Pasal 310 dan 311 KUHP.',
      ratioDecidendi: 'MK menolak permohonan pembatalan pasal dan menyatakan Pasal 27 ayat (3) konstitusional bersyarat: tidak berlaku untuk kritik, kepentingan umum, atau pembelaan diri, dan semata-mata mengacu pada delik aduan dalam KUHP.',
      statusAmar: 'Ditolak dengan pertimbangan penafsiran mengikat (Constitutional Interpretation).',
    },
    penjelasanResmi: 'Bukan merupakan tindak pidana jika perbuatan dilakukan demi kepentingan umum atau karena terpaksa untuk membela diri.',
  },

  'uu-11-2008/pasal-28': {
    id: 'oi-pasal-28',
    canonicalPath: 'uu-11-2008/pasal-28',
    provisionLabel: 'Pasal 28',
    naskahAkademik: {
      latarBelakang: 'Penyebaran informasi bohong (hoaks) di media sosial dan ujaran kebencian berbasis identitas berpotensi memicu kerusuhan massa dan merusak stabilitas ekonomi digital.',
      landasanFilosofis: 'Melindungi kepastian hukum yang adil dan memelihara kerukunan hidup berbangsa dalam bingkai Bhinneka Tunggal Ika.',
      landasanSosiologis: 'Transaksi elektronik membutuhkan kepercayaan publik (public trust). Berita bohong yang merugikan konsumen merusak ekosistem e-commerce nasional.',
    },
    dimDpr: {
      nomorDim: 'DIM RUU UU 1/2024 Komisi I DPR RI (Klaster Pasal 28)',
      sikapPemerintah: 'Mengusulkan penambahan ayat (3) baru mengenai penyebaran pemberitahuan bohong yang menimbulkan keonaran di masyarakat guna mengisi kekosongan hukum UU 1/1946.',
      sikapFraksiDpr: 'Fraksi DPR meminta pembatasan ketat unsur "menghasut dan mengajak" pada ayat (2) agar tidak menjerat kebebasan mimbar akademik atau ekspresi kritik keagamaan/sosiologis.',
      catatanKompromi: 'Disepakati penambahan frasa "yang sifatnya menghasut, mengajak, atau memengaruhi" untuk mencegah pemidanaan terhadap opini pribadi yang pasif.',
    },
    risalahMk: {
      nomorPerkara: 'Putusan MK No. 78/PUU-XXI/2023',
      tahun: 2023,
      keteranganDprPresiden: 'Keterangan DPR menjelaskan bahwa norma Pasal 28 ayat (2) bukan ditujukan untuk membungkam kebebasan berekspresi, melainkan mencegah propaganda kebencian (hate speech) yang memicu kekerasan.',
      ratioDecidendi: 'Mahkamah menegaskan bahwa penerapan delik kebencian SARA harus dibuktikan adanya unsur niat jahat (mens rea) untuk menimbulkan perpecahan fisik antargolongan, bukan sekadar ketidaksukaan ideologis.',
      statusAmar: 'Konstitusional Bersyarat.',
    },
    penjelasanResmi: 'Yang dimaksud dengan "antargolongan" mencakup suku, agama, ras, dan golongan masyarakat di luar batas-batas perbedaan politik elektoral.',
  },
};

/** Ambil benchmark internasional relevan untuk pasal tertentu atau default instrumen. */
export function getInternationalBenchmarksFor(canonicalPath?: string): InternationalBenchmark[] {
  if (!canonicalPath) return INTERNATIONAL_BENCHMARKS;
  if (canonicalPath.includes('pasal-26')) {
    return INTERNATIONAL_BENCHMARKS.filter((b) => b.id.includes('gdpr') || b.id.includes('uncitral'));
  }
  if (canonicalPath.includes('pasal-27')) {
    return INTERNATIONAL_BENCHMARKS.filter((b) => b.id.includes('iccpr') || b.id.includes('budapest'));
  }
  if (canonicalPath.includes('pasal-28')) {
    return INTERNATIONAL_BENCHMARKS.filter((b) => b.id.includes('iccpr') || b.id.includes('bilateral'));
  }
  if (canonicalPath.includes('pasal-5') || canonicalPath.includes('pasal-11')) {
    return INTERNATIONAL_BENCHMARKS.filter((b) => b.id.includes('uncitral'));
  }
  return INTERNATIONAL_BENCHMARKS;
}

/** Ambil catatan original intent untuk pasal tertentu. */
export function getOriginalIntentFor(canonicalPath?: string): OriginalIntentRecord | null {
  if (!canonicalPath) return null;
  // Cari path pasalnya (misal uu-11-2008/pasal-27/ayat-1 -> uu-11-2008/pasal-27)
  const segments = canonicalPath.split('/');
  const pasalPath = segments.slice(0, 2).join('/');
  return ORIGINAL_INTENT_RECORDS[pasalPath] ?? ORIGINAL_INTENT_RECORDS[canonicalPath] ?? null;
}
