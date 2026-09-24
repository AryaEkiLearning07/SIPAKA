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
  lembaranNegara: string;
  statusPerubahan: 'DIUBAH' | 'SISIPAN_BARU' | 'DICABUT' | 'ASLI';
  statusBadge: string;
  putusanMk?: {
    nomor: string;
    tahun: number;
    amarPutusan: string;
    ratioDecidendi: string;
  };
  latarBelakangPerubahan: string;
  peraturanTerdampak: ImpactedRegulation[];
}

export const PROVISION_AMENDMENT_MAP: Record<string, ProvisionAmendmentDetail> = {
  // ── Pasal 27 & Ayat-Ayatnya ───────────────────────────────────────────────
  'uu-11-2008/pasal-27': {
    canonicalPath: 'uu-11-2008/pasal-27',
    pasalLabel: 'Pasal 27',
    diubahOleh: 'UU No. 1 Tahun 2024 & UU No. 19 Tahun 2016',
    tanggalPengundangan: '2 Januari 2024 (UU 1/2024) & 28 November 2016 (UU 19/2016)',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916 (Amandemen II)',
    statusPerubahan: 'DIUBAH',
    statusBadge: 'Diubah & Dipecah (UU 1/2024)',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008 & No. 2/PUU-VII/2009',
      tahun: 2008,
      amarPutusan: 'Menolak permohonan untuk seluruhnya — Pasal 27 ayat (3) tetap berlaku; sifat delik aduan absolut (klachtdelict) dengan rujukan Pasal 310 dan 311 KUHP ditegaskan dalam pertimbangan MK.',
      ratioDecidendi: 'Penghormatan terhadap martabat seseorang adalah hak individual, sehingga penegakan hukum hanya boleh dilakukan atas kehendak bebas korban secara langsung.',
    },
    latarBelakangPerubahan: 'Pasal 27 direstrukturisasi secara mendasar dalam UU 1/2024: ayat (3) dihapus dan dipisahkan menjadi Pasal 27A (penyerangan kehormatan) dan Pasal 27B (pemerasan dan pengancaman) untuk mengakhiri multi-interpretasi "pasal karet" dan melindungi kemerdekaan berekspresi.',
    peraturanTerdampak: [
      {
        id: 'pp-71-2019-pasal-5',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE)',
        pasalTurunan: 'Pasal 5 ayat (2) & Pasal 21',
        status: 'HILANG_CANTOLAN',
        statusLabel: '⚠️ Kehilangan Cantolan Yuridis',
        ringkasanDampak: 'Kewajiban moderasi dan takedown konten pencemaran nama baik oleh PSE di PP 71/2019 masih bersandar pada Pasal 27 ayat (3) lama yang kini telah dicabut.',
        uuIndukSebelum: 'Pasal 27 ayat (3) UU 11/2008: "Setiap Orang dengan sengaja dan tanpa hak mendistribusikan... muatan penghinaan dan/atau pencemaran nama baik."',
        uuIndukSesudah: 'Pasal 27 ayat (3) DIHAPUS oleh UU 1/2024. Norma dialihkan ke Pasal 27A sebagai delik aduan khusus dengan syarat formil pengaduan korban langsung.',
        ketentuanTurunanTerdampak: 'Pasal 5 ayat (2) PP 71/2019: "PSE wajib memastikan Sistem Elektroniknya tidak memuat Informasi Elektronik yang dilarang sesuai ketentuan peraturan perundang-undangan."',
        penjelasanPertentangan: 'Karena Pasal 27 ayat (3) telah dihapus dari undang-undang pokok, PSE dan Kemenkominfo tidak dapat lagi melakukan takedown sepihak atas tuduhan pencemaran nama baik tanpa adanya aduan resmi dari pihak yang diserang kehormatannya.',
        rekomendasiHarmonisasi: 'Pemerintah perlu merevisi PP 71/2019 dengan menghapus kategori pencemaran nama baik dari daftar konten negatif yang dapat ditindak secara administratif tanpa penetapan pengadilan.',
      },
      {
        id: 'permenkominfo-5-2020-pasal-9',
        type: 'PERMEN',
        number: 'Permenkominfo No. 5 Tahun 2020',
        year: 2020,
        title: 'Penyelenggara Sistem Elektronik Lingkup Privat',
        pasalTurunan: 'Pasal 9 ayat (4) & Pasal 13',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Perlu Penyesuaian Harmonisasi',
        ringkasanDampak: 'Kewenangan pemutusan akses 1x24 jam terhadap konten yang "meresahkan masyarakat" bertentangan dengan asas kepastian hukum UU 1/2024.',
        uuIndukSebelum: 'Ketentuan pemutusan akses UU 19/2016 Pasal 40 ayat (2b) tanpa batasan delik aduan.',
        uuIndukSesudah: 'Pasal 27A & Pasal 28 ayat (3) UU 1/2024 mensyaratkan pembuktian kerusuhan fisik nyata di ruang publik dan delik aduan perseorangan.',
        ketentuanTurunanTerdampak: 'Pasal 9 ayat (4) huruf a Permenkominfo 5/2020: "Konten dilarang mencakup informasi yang meresahkan masyarakat dan mengganggu ketertiban umum."',
        penjelasanPertentangan: 'Frasa "meresahkan masyarakat" pada Permenkominfo tidak memiliki cantolan hukum dalam UU ITE terbaru, sehingga berpotensi menjadi dasar pemblokiran sepihak yang melanggar hak asasi.',
        rekomendasiHarmonisasi: 'Kementerian Komdigi wajib menyesuaikan Permenkominfo 5/2020 dengan mendefinisikan batas pemutusan akses secara ketat merujuk norma Pasal 27A dan 28 ayat (3) UU 1/2024.',
      },
      {
        id: 'skb-3-menteri-2021',
        type: 'SKB',
        number: 'SKB Menkominfo, Jaksa Agung, & Kapolri No. 229/2021',
        year: 2021,
        title: 'Pedoman Implementasi Kriteria Penerapan UU ITE',
        pasalTurunan: 'Pedoman Angka 3 (Pasal 27 ayat 3)',
        status: 'USANG',
        statusLabel: '🔴 Tidak Berlaku Lagi (Usang)',
        ringkasanDampak: 'Pedoman implementasi Pasal 27 ayat (3) kehilangan objek hukum karena pasalnya telah dihapus dari undang-undang pokok.',
        uuIndukSebelum: 'Pasal 27 ayat (3) UU ITE 2016.',
        uuIndukSesudah: 'Pasal 27 ayat (3) DICABUT dan digantikan oleh Pasal 27A & 27B UU 1/2024.',
        ketentuanTurunanTerdampak: 'Seluruh matriks interpretasi Pasal 27 ayat (3) dalam Lampiran SKB 3 Menteri Tahun 2021.',
        penjelasanPertentangan: 'Instrumen SKB tidak dapat lagi dijadikan rujukan hukum acara pidana bagi kepolisian dan kejaksaan karena pasalnya sudah tidak eksis dalam hukum positif.',
        rekomendasiHarmonisasi: 'Kapolri dan Jaksa Agung wajib menerbitkan Surat Edaran atau Peraturan Bersama baru yang mendasarkan penuntutan pada Pasal 27A dan 27B UU 1/2024.',
      },
    ],
  },

  // ── Pasal 27 ayat (3) ─────────────────────────────────────────────────────
  'uu-11-2008/pasal-27/ayat-3': {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-3',
    pasalLabel: 'Pasal 27 ayat (3)',
    diubahOleh: 'UU No. 1 Tahun 2024 (Dihapus) jo. UU No. 19 Tahun 2016',
    tanggalPengundangan: '2 Januari 2024 (LN RI Tahun 2024 No. 8)',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DICABUT',
    statusBadge: '🔴 Ketentuan Norma Dihapus / Dicabut',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008',
      tahun: 2008,
      amarPutusan: 'Ketentuan ini merupakan delik aduan dan merujuk pada Pasal 310 dan 311 KUHP.',
      ratioDecidendi: 'Menjamin agar penegak hukum tidak menggunakan delik ini secara ex-officio tanpa adanya permohonan dari korban yang merasa dicemarkan nama baiknya.',
    },
    latarBelakangPerubahan: 'Pembentuk Undang-Undang mencabut Pasal 27 ayat (3) secara eksplisit melalui Pasal I angka 2 UU No. 1 Tahun 2024 karena pasal ini paling sering disalahgunakan untuk mengkriminalisasi warga. Rumusan delik dipindahkan dan diperinci dalam Pasal 27A.',
    peraturanTerdampak: [
      {
        id: 'pp-71-2019-pasal-5-p27a3',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'Penyelenggaraan Sistem dan Transaksi Elektronik',
        pasalTurunan: 'Pasal 5 & Pasal 21',
        status: 'HILANG_CANTOLAN',
        statusLabel: '⚠️ Kehilangan Cantolan Yuridis',
        ringkasanDampak: 'Kewenangan takedown konten pencemaran nama baik pada PP 71/2019 kehilangan rujukan norma induk UU.',
        uuIndukSebelum: 'Pasal 27 ayat (3) memuat norma larangan penghinaan dan pencemaran nama baik di ruang siber.',
        uuIndukSesudah: 'Pasal 27 ayat (3) DICABUT 100% oleh Pasal I angka 2 UU 1/2024.',
        ketentuanTurunanTerdampak: 'Pasal 5 ayat (2) PP 71/2019 mengenai konten yang dilarang.',
        penjelasanPertentangan: 'PP tidak boleh mengatur sanksi atau pelarangan yang norma induknya dalam undang-undang telah dihapus.',
        rekomendasiHarmonisasi: 'Segera lakukan revisi PP 71/2019 untuk mencabut klausul terkait Pasal 27 ayat (3).',
      },
    ],
  },

  // ── Pasal 27A (Sisipan Baru UU 1/2024) ────────────────────────────────────
  'uu-11-2008/pasal-27a': {
    canonicalPath: 'uu-11-2008/pasal-27a',
    pasalLabel: 'Pasal 27A',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 3)',
    tanggalPengundangan: '2 Januari 2024',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Sisipan Baru (Hukum Positif Berlaku)',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008 (Pondasi Konstitusional)',
      tahun: 2008,
      amarPutusan: 'Konstruksi delik kehormatan wajib selaras dengan delik aduan KUHP.',
      ratioDecidendi: 'Membedakan secara tegas antara penghinaan biasa, penistaan, dan penyerangan kehormatan demi kepentingan umum.',
    },
    latarBelakangPerubahan: 'Disisipkan untuk menggantikan Pasal 27 ayat (3) lama dengan rumusan yang jauh lebih ketat: menuntut adanya tuduhan perbuatan spesifik (bukan sekadar kata-kata makian), mewajibkan maksud agar diketahui umum, serta mengecualikan kritik demi kepentingan umum atau pembelaan diri.',
    peraturanTerdampak: [
      {
        id: 'pp-71-2019-pasal-27a',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'PSTE (Penyelenggaraan Sistem dan Transaksi Elektronik)',
        pasalTurunan: 'Pasal 21 ayat (1)',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Perlu Sinkronisasi Standar Moderasi',
        ringkasanDampak: 'SOP takedown konten PSE harus memverifikasi bukti aduan korban sebelum melakukan penutupan akun/takedown.',
        uuIndukSebelum: 'Belum ada Pasal 27A (pada naskah UU ITE 2008/2016).',
        uuIndukSesudah: 'Pasal 27A UU 1/2024: Penyerangan kehormatan merupakan delik aduan absolut dengan klausul pembenar kepentingan umum.',
        ketentuanTurunanTerdampak: 'Kewajiban PSE melakukan penyaringan mandiri (filtering) konten terlarang.',
        penjelasanPertentangan: 'PSE dilarang secara sepihak memutus akses kritik publik terhadap pejabat karena Pasal 27A mengecualikan perbuatan demi kepentingan umum.',
        rekomendasiHarmonisasi: 'Kementerian Komdigi menerbitkan Peraturan Menteri petunjuk teknis verifikasi aduan Pasal 27A bagi platform PSE.',
      },
      {
        id: 'sema-kejaksaan-2024',
        type: 'PERMEN',
        number: 'Pedoman Penuntutan Kejaksaan Agung RI No. 1/2024',
        year: 2024,
        title: 'Pedoman Penanganan Perkara Tindak Pidana Siber',
        pasalTurunan: 'BAB IV Prosedur Pembuktian Delik Aduan',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Harmonisasi Acara Penuntutan',
        ringkasanDampak: 'Penuntut umum wajib memastikan berkas perkara memuat surat pengaduan asli dari korban langsung (bukan kuasa hukum/pihak ketiga).',
        uuIndukSebelum: 'Pasal 27 ayat (3) lama sering diterima tanpa pemeriksaan ketat legal standing pelapor.',
        uuIndukSesudah: 'Pasal 45 ayat (4) jo. Pasal 27A UU 1/2024 menegaskan hanya korban langsung yang memiliki hak mengadu.',
        ketentuanTurunanTerdampak: 'Instruksi Jaksa Agung mengenai syarat formil penuntutan siber.',
        penjelasanPertentangan: 'Bila jaksa menerima berkas tanpa aduan korban langsung, surat dakwaan batal demi hukum.',
        rekomendasiHarmonisasi: 'Kejaksaan menerbitkan surat edaran kepada seluruh Kejati & Kejari se-Indonesia untuk menolak berkas tanpa aduan prinsipal.',
      },
    ],
  },

  // ── Pasal 27B (Sisipan Baru UU 1/2024) ────────────────────────────────────
  'uu-11-2008/pasal-27b': {
    canonicalPath: 'uu-11-2008/pasal-27b',
    pasalLabel: 'Pasal 27B',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 3)',
    tanggalPengundangan: '2 Januari 2024',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Sisipan Baru (Hukum Positif Berlaku)',
    latarBelakangPerubahan: 'Disisipkan khusus untuk menjerat delik pemerasan digital dan ancaman pencemaran (doxing untuk memeras), memisahkan antara ancaman fisik dengan ancaman membuka rahasia/aib di media sosial.',
    peraturanTerdampak: [
      {
        id: 'permen-kominfo-fintech-2024',
        type: 'PERMEN',
        number: 'Permenkominfo / Regulasi OJK Pelindungan Konsumen',
        year: 2024,
        title: 'Perlindungan Konsumen Terhadap Praktik Penagihan Pinjaman Online',
        pasalTurunan: 'Ketentuan Larangan Teror & Ancaman Penagihan Digital',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Harmonisasi Penegakan Hukum Pinjol',
        ringkasanDampak: 'Praktik penagihan pinjol ilegal yang mengancam menyebarkan foto atau data debitur kini langsung terikat delik Pasal 27B UU 1/2024.',
        uuIndukSebelum: 'Diatur terpisah dalam delik umum pemerasan KUHP dan Pasal 27 ayat (4) UU ITE lama.',
        uuIndukSesudah: 'Pasal 27B UU 1/2024: Memuat ancaman pidana hingga 6 tahun bagi siapa pun yang mengancam membuka rahasia untuk memeras.',
        ketentuanTurunanTerdampak: 'Regulasi penagihan etis pinjol di OJK dan Kominfo.',
        penjelasanPertentangan: 'Aturan administratif sebelumnya hanya memuat sanksi pencabutan izin, kini wajib disinkronkan dengan laporan pidana Pasal 27B.',
        rekomendasiHarmonisasi: 'OJK dan Komdigi menyusun nota kesepahaman penanganan cepat pemblokiran rekening & aplikasi pinjol yang melanggar Pasal 27B.',
      },
    ],
  },

  // ── Pasal 28 & Ayat-Ayatnya ───────────────────────────────────────────────
  'uu-11-2008/pasal-28': {
    canonicalPath: 'uu-11-2008/pasal-28',
    pasalLabel: 'Pasal 28',
    diubahOleh: 'UU No. 1 Tahun 2024',
    tanggalPengundangan: '2 Januari 2024',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: 'Diubah & Ditambah Ayat (UU 1/2024)',
    putusanMk: {
      nomor: 'Putusan MK No. 78/PUU-XXI/2023',
      tahun: 2023,
      amarPutusan: 'Membatalkan Pasal 14 dan 15 UU No. 1 Tahun 1946 (delik menyiarkan berita bohong yang menerbitkan keonaran di kalangan rakyat).',
      ratioDecidendi: 'Ukuran keonaran dalam rumusan kuno tidak memiliki parameter objektif dan bertentangan dengan UUD 1945.',
    },
    latarBelakangPerubahan: 'Menambahkan Pasal 28 ayat (3) baru mengenai larangan penyebaran berita bohong yang menimbulkan kerusuhan di masyarakat, dengan ancaman pidana maksimal 6 tahun, menggantikan kekosongan hukum pasca pembatalan pasal keonaran di KUHP lama.',
    peraturanTerdampak: [
      {
        id: 'permenkominfo-5-2020-pasal-14',
        type: 'PERMEN',
        number: 'Permenkominfo No. 5 Tahun 2020',
        year: 2020,
        title: 'PSE Lingkup Privat',
        pasalTurunan: 'Pasal 14 (Takedown Mendesak 4 Jam)',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Perlu Penyesuaian Harmonisasi',
        ringkasanDampak: 'Kewenangan permintaan pemutusan akses darurat 4 jam untuk berita bohong harus dibuktikan memenuhi unsur kerusuhan nyata sesuai Pasal 28 ayat (3).',
        uuIndukSebelum: 'Pasal 28 hanya mengatur kerugian konsumen (ayat 1) dan ujaran kebencian SARA (ayat 2).',
        uuIndukSesudah: 'Ditambahkan ayat (3) tentang berita bohong penyebab kerusuhan fisik nyata di kalangan rakyat.',
        ketentuanTurunanTerdampak: 'Pasal 14 Permenkominfo No. 5 Tahun 2020 mengenai permohonan takedown mendesak.',
        penjelasanPertentangan: 'Permenkominfo saat ini mengizinkan pemblokiran informasi atas dasar permohonan instansi tanpa verifikasi ada tidaknya potensi kerusuhan riil di lapangan.',
        rekomendasiHarmonisasi: 'Revisi Permenkominfo dengan menetapkan SOP verifikasi faktual bersama aparat keamanan sebelum perintah takedown 4 jam diterbitkan.',
      },
    ],
  },

  // ── Pasal 26 (Data Pribadi & Right to be Forgotten) ───────────────────────
  'uu-11-2008/pasal-26': {
    canonicalPath: 'uu-11-2008/pasal-26',
    pasalLabel: 'Pasal 26',
    diubahOleh: 'UU No. 19 Tahun 2016 jo. UU No. 27 Tahun 2022 (UU PDP)',
    tanggalPengundangan: '28 November 2016 (Amandemen I) & 17 Oktober 2022 (UU PDP)',
    lembaranNegara: 'LN RI Tahun 2016 No. 251 & LN RI Tahun 2022 No. 196',
    statusPerubahan: 'DIUBAH',
    statusBadge: 'Diubah Amandemen I & Harmonisasi UU PDP',
    latarBelakangPerubahan: 'Amandemen I menyisipkan ayat (3), (4), dan (5) yang mewajibkan PSE menghapus informasi elektronik yang tidak relevan (Right to be Forgotten) berdasarkan penetapan pengadilan negeri.',
    peraturanTerdampak: [
      {
        id: 'uu-pdp-2022',
        type: 'UU',
        number: 'UU No. 27 Tahun 2022',
        year: 2022,
        title: 'Undang-Undang tentang Pelindungan Data Pribadi (UU PDP)',
        pasalTurunan: 'Pasal 43 & Pasal 44 UU PDP',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Harmonisasi Lex Specialis',
        ringkasanDampak: 'Ketentuan pemrosesan dan penghapusan data pribadi pada Pasal 26 UU ITE tunduk pada standar kepatuhan pengendali data dalam UU PDP.',
        uuIndukSebelum: 'Pasal 26 UU ITE 2008 hanya mengatur persetujuan pemilik data secara umum.',
        uuIndukSesudah: 'UU PDP 2022 berlaku penuh sebagai hukum khusus pelindungan data pribadi (Lex Specialis).',
        ketentuanTurunanTerdampak: 'Pasal 14 sampai Pasal 16 PP No. 71 Tahun 2019 tentang tata cara penghapusan informasi data pribadi.',
        penjelasanPertentangan: 'Mekanisme penghapusan di PP 71/2019 masih berfokus pada penetapan pengadilan, sedangkan UU PDP memberikan hak penghapusan langsung kepada subjek data.',
        rekomendasiHarmonisasi: 'Sinkronisasi RPP Turunan UU PDP dengan aturan teknis PSE di PP 71/2019.',
      },
    ],
  },

  // ── Pasal 40 & 40A (Pemutusan Akses & Pelindungan Anak) ───────────────────
  'uu-11-2008/pasal-40': {
    canonicalPath: 'uu-11-2008/pasal-40',
    pasalLabel: 'Pasal 40',
    diubahOleh: 'UU No. 1 Tahun 2024 & UU No. 19 Tahun 2016',
    tanggalPengundangan: '2 Januari 2024',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: 'Diubah & Disisipkan Pasal 40A (UU 1/2024)',
    latarBelakangPerubahan: 'Pemerintah diberi kewenangan memutus akses informasi elektronik yang melanggar hukum, sekaligus disisipkan Pasal 40A yang mewajibkan PSE memberikan perlindungan bagi anak dalam penggunaan sistem elektronik.',
    peraturanTerdampak: [
      {
        id: 'rpp-anak-siber-2024',
        type: 'PP',
        number: 'Mandat RPP Pelindungan Anak di Ruang Siber',
        year: 2024,
        title: 'Rancangan Peraturan Pemerintah Pelindungan Anak dalam PSE',
        pasalTurunan: 'Mandat Pasal 40A ayat (4) UU 1/2024',
        status: 'MANDAT_BARU',
        statusLabel: '🟢 Mandat Pembentukan PP Baru (Maks. 2 Tahun)',
        ringkasanDampak: 'Pemerintah diwajibkan mengundangkan PP khusus perlindungan anak paling lambat 2 Januari 2026.',
        uuIndukSebelum: 'Tidak ada ketentuan kewajiban khusus proteksi anak pada UU ITE 2008 maupun 2016.',
        uuIndukSesudah: 'Pasal 40A UU 1/2024: PSE wajib membatasi konten, menyediakan mekanisme verifikasi usia, dan kanal pengaduan ramah anak.',
        ketentuanTurunanTerdampak: 'Belum ada aturan pelaksana (sedang dalam proses harmonisasi antarkementerian).',
        penjelasanPertentangan: 'Tanpa PP pelaksana, PSE multinasional belum memiliki pedoman teknis standar verifikasi umur di Indonesia.',
        rekomendasiHarmonisasi: 'Kementerian Komdigi bersama KemenPPPA mempercepat penetapan RPP Pelindungan Anak di Ruang Siber.',
      },
      {
        id: 'pp-71-2019-pasal-96',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'PSTE',
        pasalTurunan: 'Pasal 96 & 97 (Sanksi Administratif)',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Perlu Penambahan Sanksi Pasal 40A',
        ringkasanDampak: 'Tabel sanksi denda administratif PP 71/2019 perlu diperluas mencakup pelanggaran perlindungan anak.',
        uuIndukSebelum: 'Sanksi administratif hanya terkait pendaftaran dan tata kelola PSE umum.',
        uuIndukSesudah: 'Pasal 40A ayat (3) UU 1/2024 menetapkan sanksi administratif teguran hingga denda bagi PSE yang abai melindungi anak.',
        ketentuanTurunanTerdampak: 'Mekanisme denda administratif pada PP 71/2019.',
        penjelasanPertentangan: 'PP belum mengatur besaran denda administratif untuk pelanggaran keamanan anak di platform digital.',
        rekomendasiHarmonisasi: 'Menyusun Peraturan Pemerintah perubahan atas PP 71/2019 terkait skema denda administratif.',
      },
    ],
  },

  // ── Pasal 45 (Ketentuan Sanksi Pidana) ────────────────────────────────────
  'uu-11-2008/pasal-45': {
    canonicalPath: 'uu-11-2008/pasal-45',
    pasalLabel: 'Pasal 45',
    diubahOleh: 'UU No. 1 Tahun 2024 & UU No. 19 Tahun 2016',
    tanggalPengundangan: '2 Januari 2024',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: 'Restrukturisasi Sanksi Pidana',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008',
      tahun: 2008,
      amarPutusan: 'Menguatkan sifat delik aduan dan keselarasan sanksi dengan KUHP.',
      ratioDecidendi: 'Menjamin proporsionalitas penjatuhan pidana agar tidak melampaui ancaman delik pokok dalam hukum pidana materiil.',
    },
    latarBelakangPerubahan: 'Ancaman pidana penjara untuk penghinaan dan pencemaran diturunkan secara bertahap: dari 6 tahun (UU 11/2008) menjadi 4 tahun (UU 19/2016), dan dalam UU 1/2024 ancaman Pasal 27A dipatok maksimal 2 tahun penjara atau denda Rp400 juta. Dengan ancaman 2 tahun, tersangka TIDAK BISA DITAHAN selama proses penyidikan (Pasal 21 KUHAP).',
    peraturanTerdampak: [
      {
        id: 'perkap-penyidikan-2024',
        type: 'PERMEN',
        number: 'Perkap / Perpol Penanganan Tindak Pidana Siber',
        year: 2024,
        title: 'Standar Operasional Prosedur Penyidikan Siber Bareskrim Polri',
        pasalTurunan: 'SOP Penahanan & Keadilan Restoratif (Restorative Justice)',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Larangan Penahanan Tersangka',
        ringkasanDampak: 'Penyidik kepolisian dilarang melakukan penahanan terhadap tersangka dugaan tindak pidana Pasal 27A UU ITE.',
        uuIndukSebelum: 'Pasal 45 ayat (1) UU 11/2008 ancaman 6 tahun (dapat ditahan langsung oleh penyidik).',
        uuIndukSesudah: 'Pasal 45 ayat (4) UU 1/2024 ancaman maksimal hanya 2 tahun.',
        ketentuanTurunanTerdampak: 'SOP Penyidikan Siber Polri mengenai syarat objektif penahanan (Pasal 21 KUHAP mensyaratkan pidana di atas 5 tahun).',
        penjelasanPertentangan: 'Penahanan tersangka pada kasus pencemaran nama baik di medsos pasca UU 1/2024 adalah tindakan unprocedural (cacat hukum) dan dapat dipraperadilankan.',
        rekomendasiHarmonisasi: 'Kapolri mengeluarkan Surat Telegram Rahasia (STR) penegasan larangan penahanan tersangka Pasal 27A dan wajib mengutamakan Restorative Justice.',
      },
    ],
  },
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
    diubahOleh: 'UU No. 11 Tahun 2008 (Naskah Pokok)',
    tanggalPengundangan: '21 April 2008',
    lembaranNegara: 'LN RI Tahun 2008 No. 58, TLN No. 4843',
    statusPerubahan: 'ASLI',
    statusBadge: 'Naskah Asli Berlaku (Stabil)',
    latarBelakangPerubahan: 'Norma pasal ini belum mengalami amandemen dalam perubahan UU No. 19 Tahun 2016 maupun UU No. 1 Tahun 2024. Norma tetap mengikat sesuai naskah asli pengundangan.',
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
