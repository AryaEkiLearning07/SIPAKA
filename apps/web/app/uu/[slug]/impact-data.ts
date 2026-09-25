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

export const PROVISION_AMENDMENT_MAP: Record<string, ProvisionAmendmentDetail> = {
  // ── Pasal 27 & Ayat-Ayatnya ───────────────────────────────────────────────
  'uu-11-2008/pasal-27': {
    canonicalPath: 'uu-11-2008/pasal-27',
    pasalLabel: 'Pasal 27',
    diubahOleh: 'UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE (Pasal I angka 2)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'Lembaran Negara Republik Indonesia Tahun 2024 Nomor 8, Tambahan Lembaran Negara Nomor 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Diubah & Dipecah (UU 1/2024)',
    textSebelum: 'Pasal 27 memuat 4 ayat: (1) Kesusilaan; (2) Perjudian; (3) Penghinaan atau pencemaran nama baik; (4) Pemerasan dan/atau pengancaman.',
    textSesudah: 'Pasal 27 ayat (1) diubah redaksinya (dikecualikan untuk kepentingan umum/pembelaan diri/seni); ayat (2) diubah mempertegas judi online; ayat (3) dan ayat (4) DIHAPUS dan dipisahkan menjadi Pasal 27A dan Pasal 27B.',
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

  // ── Pasal 27 ayat (1) ─────────────────────────────────────────────────────
  'uu-11-2008/pasal-27/ayat-1': {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-1',
    pasalLabel: 'Pasal 27 ayat (1)',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 2 huruf a)',
    tanggalPengundangan: 'Disahkan: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Redaksi Diperjelas (UU 1/2024)',
    textSebelum: 'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan yang melanggar kesusilaan.',
    textSesudah: 'Setiap Orang dengan sengaja dan tanpa hak menyiarkan, mempertunjukkan, mendistribusikan, mentransmisikan, dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan yang melanggar kesusilaan untuk diketahui umum.',
    latarBelakangPerubahan: 'Menambahkan frasa "untuk diketahui umum" serta klausul pengecualian dalam penjelasan untuk karya seni, budaya, ilmu pengetahuan, atau pembelaan diri agar ranah privasi warga tidak dikriminalisasi.',
    peraturanTerdampak: [
      {
        id: 'pp-71-2019-pasal-5-p27a1',
        type: 'PP',
        number: 'PP No. 71 Tahun 2019',
        year: 2019,
        title: 'PSTE',
        pasalTurunan: 'Pasal 5 ayat (2)',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ Perlu Sinkronisasi Pengecualian',
        ringkasanDampak: 'Kewajiban filtering PSE wajib mengecualikan transmisi konten privat antar dua individu.',
        uuIndukSebelum: 'Larangan kesusilaan tanpa kualifikasi "untuk diketahui umum".',
        uuIndukSesudah: 'Wajib memenuhi unsur publisitas "untuk diketahui umum".',
        ketentuanTurunanTerdampak: 'Tata kelola takedown konten asusila oleh PSE.',
        penjelasanPertentangan: 'PSE dilarang memblokir komunikasi privat terenkripsi end-to-end tanpa adanya distribusi ke ruang publik.',
        rekomendasiHarmonisasi: 'Harmonisasi Permen Komdigi terkait batasan intervensi ruang percakapan privat.',
      },
    ],
  },

  // ── Pasal 27 ayat (3) ─────────────────────────────────────────────────────
  'uu-11-2008/pasal-27/ayat-3': {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-3',
    pasalLabel: 'Pasal 27 ayat (3)',
    diubahOleh: 'UU No. 1 Tahun 2024 (Dihapus) jo. UU No. 19 Tahun 2016',
    tanggalPengundangan: 'Disahkan: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DICABUT',
    statusBadge: '🔴 Ketentuan Norma Dihapus / Dicabut',
    textSebelum: 'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
    textSesudah: '[KETENTUAN AYAT DIHAPUS OLEH PASAL I ANGKA 2 HURUF b UU NO. 1 TAHUN 2024]. Norma delik dialihkan dan diperinci secara ketat ke dalam Pasal 27A.',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008 & Putusan No. 2/PUU-VII/2009',
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
      {
        id: 'skb-pedoman-polri-2021',
        type: 'SKB',
        number: 'Surat Telegram Kapolri No. ST/339/II/RES.1.1.1./2021',
        year: 2021,
        title: 'Pedoman Penanganan Perkara Siber Pasal 27 ayat (3)',
        pasalTurunan: 'Petunjuk Teknis Gelar Perkara Siber',
        status: 'USANG',
        statusLabel: '🔴 Tidak Berlaku Lagi',
        ringkasanDampak: 'Surat Telegram Kapolri terkait Pasal 27 ayat (3) tidak dapat dijadikan rujukan penyidikan lagi.',
        uuIndukSebelum: 'Pasal 27 ayat (3) rujukan laporan pidana penghinaan.',
        uuIndukSesudah: 'Laporan wajib merujuk Pasal 27A dengan syarat pembuktian tuduhan perbuatan spesifik.',
        ketentuanTurunanTerdampak: 'Format Laporan Polisi (LP) di Bareskrim dan Polda.',
        penjelasanPertentangan: 'Penyidik yang menerbitkan LP dengan sangkaan Pasal 27 ayat (3) pasca 2 Januari 2024 batal demi hukum.',
        rekomendasiHarmonisasi: 'Kapolri menerbitkan Telegram Rahasia pembaruan format sangkaan pidana ke Pasal 27A.',
      },
    ],
  },

  // ── Pasal 27 ayat (4) ─────────────────────────────────────────────────────
  'uu-11-2008/pasal-27/ayat-4': {
    canonicalPath: 'uu-11-2008/pasal-27/ayat-4',
    pasalLabel: 'Pasal 27 ayat (4)',
    diubahOleh: 'UU No. 1 Tahun 2024 (Dihapus) jo. UU No. 19 Tahun 2016',
    tanggalPengundangan: 'Disahkan: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DICABUT',
    statusBadge: '🔴 Ketentuan Norma Dihapus / Dicabut',
    textSebelum: 'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan pemerasan dan/atau pengancaman.',
    textSesudah: '[KETENTUAN AYAT DIHAPUS OLEH PASAL I ANGKA 2 HURUF c UU NO. 1 TAHUN 2024]. Norma pemerasan dan pengancaman dialihkan ke Pasal 27B.',
    latarBelakangPerubahan: 'Ketentuan dihapus dan diperluas konstruksinya ke Pasal 27B yang memisahkan secara spesifik antara ancaman pencemaran dengan ancaman kekerasan fisik.',
    peraturanTerdampak: [
      {
        id: 'skb-pemerasan-2021',
        type: 'SKB',
        number: 'SKB 3 Menteri Pedoman UU ITE',
        year: 2021,
        title: 'Pedoman Pasal 27 ayat (4)',
        pasalTurunan: 'Angka 4 Lampiran SKB',
        status: 'USANG',
        statusLabel: '🔴 Tidak Berlaku Lagi',
        ringkasanDampak: 'Pedoman kehilangan objek pengaturan karena pasal telah dipindahkan ke Pasal 27B.',
        uuIndukSebelum: 'Pasal 27 ayat (4) UU ITE 2016.',
        uuIndukSesudah: 'Pasal 27B UU 1/2024.',
        ketentuanTurunanTerdampak: 'Pedoman penuntutan jaksa.',
        penjelasanPertentangan: 'Rujukan pasal dalam surat dakwaan harus diperbarui ke Pasal 27B.',
        rekomendasiHarmonisasi: 'Kejaksaan menerbitkan SE pedoman dakwaan Pasal 27B.',
      },
    ],
  },

  // ── Pasal 27A (Sisipan Baru UU 1/2024) ────────────────────────────────────
  'uu-11-2008/pasal-27a': {
    canonicalPath: 'uu-11-2008/pasal-27a',
    pasalLabel: 'Pasal 27A',
    diubahOleh: 'UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE (Pasal I angka 3)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'Lembaran Negara Republik Indonesia Tahun 2024 Nomor 8, Tambahan Lembaran Negara Nomor 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Sisipan Baru (Hukum Positif Berlaku)',
    textSebelum: '(Ketentuan norma belum ada pada UU No. 11 Tahun 2008 maupun UU No. 19 Tahun 2016)',
    textSesudah: 'Setiap Orang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan cara menuduhkan suatu hal, dengan maksud supaya hal tersebut diketahui umum dalam bentuk Informasi Elektronik dan/atau Dokumen Elektronik yang dilakukan melalui Sistem Elektronik.',
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
    diubahOleh: 'UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE (Pasal I angka 3)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'Lembaran Negara Republik Indonesia Tahun 2024 Nomor 8, Tambahan Lembaran Negara Nomor 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Sisipan Baru (Hukum Positif Berlaku)',
    textSebelum: '(Ketentuan norma belum ada pada UU No. 11 Tahun 2008 maupun UU No. 19 Tahun 2016)',
    textSesudah: '(1) Setiap Orang dengan sengaja dan tanpa hak mendistribusikan... dengan maksud untuk menguntungkan diri sendiri... memaksa orang dengan ancaman pencemaran.\n(2) Setiap Orang dengan sengaja dan tanpa hak mendistribusikan... yang berisi ancaman membuka rahasia.',
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
    diubahOleh: 'UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE (Pasal I angka 4)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'Lembaran Negara Republik Indonesia Tahun 2024 Nomor 8, Tambahan Lembaran Negara Nomor 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Diubah & Ditambah Ayat (UU 1/2024)',
    textSebelum: 'Pasal 28 memuat 2 ayat: (1) Berita bohong yang merugikan konsumen dalam transaksi elektronik; (2) Informasi untuk menimbulkan rasa kebencian SARA.',
    textSesudah: 'Pasal 28 ayat (1) dan (2) disempurnakan redaksinya, serta DITAMBAHKAN ayat (3) baru mengenai larangan penyebaran berita bohong yang menimbulkan kerusuhan di kalangan masyarakat.',
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

  // ── Pasal 28 ayat (3) ─────────────────────────────────────────────────────
  'uu-11-2008/pasal-28/ayat-3': {
    canonicalPath: 'uu-11-2008/pasal-28/ayat-3',
    pasalLabel: 'Pasal 28 ayat (3)',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 4 huruf c)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Ayat Sisipan Baru (UU 1/2024)',
    textSebelum: '(Ketentuan ayat belum ada pada naskah UU ITE 2008 maupun UU ITE 2016)',
    textSesudah: 'Setiap Orang dengan sengaja menyebarkan Informasi Elektronik dan/atau Dokumen Elektronik yang diketahuinya memuat pemberitahuan bohong yang menimbulkan kerusuhan di masyarakat.',
    putusanMk: {
      nomor: 'Putusan MK No. 78/PUU-XXI/2023',
      tahun: 2023,
      amarPutusan: 'Membatalkan delik keonaran KUHP lama (UU 1/1946).',
      ratioDecidendi: 'Istilah kerusuhan harus dimaknai sebagai kekacauan fisik nyata di ruang publik, bukan sekadar perdebatan sengit atau viral di media sosial.',
    },
    latarBelakangPerubahan: 'Pengganti pasal keonaran kuno dengan kualifikasi "kerusuhan di masyarakat" yang harus dibuktikan secara materiil adanya huru-hara atau kekerasan fisik.',
    peraturanTerdampak: [
      {
        id: 'skb-berita-bohong-2024',
        type: 'SKB',
        number: 'Surat Edaran Bersama Jaksa Agung & Kapolri',
        year: 2024,
        title: 'Pedoman Penuntutan Delik Hoaks Penyebab Kerusuhan',
        pasalTurunan: 'Bab Pembuktian Materiil Kerusuhan',
        status: 'PERLU_PENYESUAIAN',
        statusLabel: '⚠️ SOP Pembuktian Kerusuhan Nyata',
        ringkasanDampak: 'Penyidik wajib menghadirkan bukti dampak fisik kerusuhan di lapangan, bukan sekadar kegaduhan netizen di linimasa.',
        uuIndukSebelum: 'Belum ada ketentuan Pasal 28 ayat (3).',
        uuIndukSesudah: 'Pasal 28 ayat (3) UU 1/2024 mewajibkan kausalitas nyata antara hoaks dengan kerusuhan.',
        ketentuanTurunanTerdampak: 'SOP penyelidikan tindak pidana hoaks di kepolisian.',
        penjelasanPertentangan: 'Penyidikan hoaks tanpa adanya insiden fisik kerusuhan gugur demi hukum.',
        rekomendasiHarmonisasi: 'Penerbitan pedoman penegakan hukum siber presisi oleh Bareskrim Polri.',
      },
    ],
  },

  // ── Pasal 26 (Data Pribadi & Right to be Forgotten) ───────────────────────
  'uu-11-2008/pasal-26': {
    canonicalPath: 'uu-11-2008/pasal-26',
    pasalLabel: 'Pasal 26',
    diubahOleh: 'UU No. 19 Tahun 2016 jo. UU No. 27 Tahun 2022 (UU PDP)',
    tanggalPengundangan: 'Disahkan: 25 November 2016 | Diundangkan: 28 November 2016',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Menkumham Yasonna H. Laoly',
    lembaranNegara: 'LN RI Tahun 2016 No. 251, TLN No. 5952',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Diubah Amandemen I & Harmonisasi UU PDP',
    textSebelum: 'Pasal 26 hanya memuat 2 ayat: (1) Penggunaan data pribadi harus dengan persetujuan; (2) Gugatan atas kerugian pelanggaran data pribadi.',
    textSesudah: 'Ditambahkan ayat (3), (4), dan (5) yang mewajibkan PSE menghapus Informasi Elektronik yang tidak relevan (Right to be Forgotten) atas penetapan pengadilan.',
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

  // ── Pasal 36 (Pemberatan Kerugian - Dicabut UU 1/2024) ────────────────────
  'uu-11-2008/pasal-36': {
    canonicalPath: 'uu-11-2008/pasal-36',
    pasalLabel: 'Pasal 36',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 8 - Dihapus)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DICABUT',
    statusBadge: '🔴 Ketentuan Norma Dihapus / Dicabut (UU 1/2024)',
    textSebelum: 'Setiap Orang dengan sengaja dan tanpa hak atau melawan hukum melakukan perbuatan sebagaimana dimaksud dalam Pasal 27 sampai dengan Pasal 34 yang mengakibatkan kerugian bagi Orang lain.',
    textSesudah: '[PASAL 36 DIHAPUS OLEH PASAL I ANGKA 8 UU NO. 1 TAHUN 2024]. Ketentuan pemberatan pidana penjara 12 tahun akibat kerugian materiil tidak berlaku lagi.',
    latarBelakangPerubahan: 'Pasal 36 dihapus karena sering dijadikan alat oleh aparat penegak hukum untuk mem-bypass ancaman pidana di bawah 5 tahun (agar tersangka bisa ditahan dengan dalih ada kerugian pihak lain hingga Rp 12 miliar).',
    peraturanTerdampak: [
      {
        id: 'skb-pasal-36-2021',
        type: 'SKB',
        number: 'Pedoman Penuntutan Jaksa Agung RI',
        year: 2021,
        title: 'Pedoman Penerapan Pasal Pemberatan Kerugian UU ITE',
        pasalTurunan: 'Matriks Penuntutan Kumulatif Pasal 36',
        status: 'USANG',
        statusLabel: '🔴 Tidak Berlaku Lagi (Objek Dihapus)',
        ringkasanDampak: 'Jaksa penuntut umum dilarang menambahkan dakwaan subsidair Pasal 36 jo. Pasal 51 ayat (2).',
        uuIndukSebelum: 'Pasal 36 memuat delik kerugian materiil dengan ancaman Pasal 51 ayat (2) hingga 12 tahun penjara.',
        uuIndukSesudah: 'Pasal 36 DICABUT 100% dari sistem hukum pidana siber Indonesia.',
        ketentuanTurunanTerdampak: 'Surat Tuntutan dan Dakwaan Kejaksaan.',
        penjelasanPertentangan: 'Pencantuman Pasal 36 pasca 2 Januari 2024 mengakibatkan surat dakwaan cacat yuridis.',
        rekomendasiHarmonisasi: 'Kejaksaan Agung menerbitkan edaran penarikan seluruh berkas yang mencantumkan Pasal 36.',
      },
    ],
  },

  // ── Pasal 40 & 40A (Pemutusan Akses & Pelindungan Anak) ───────────────────
  'uu-11-2008/pasal-40': {
    canonicalPath: 'uu-11-2008/pasal-40',
    pasalLabel: 'Pasal 40',
    diubahOleh: 'UU No. 1 Tahun 2024 & UU No. 19 Tahun 2016 (Pasal I angka 9)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Diubah & Disisipkan Pasal 40A (UU 1/2024)',
    textSebelum: 'Pemerintah memfasilitasi pemanfaatan Teknologi Informasi dan melindungi kepentingan umum dari segala jenis gangguan (UU 19/2016 menambahkan pemutusan akses).',
    textSesudah: 'Pemerintah bertanggung jawab mencegah penyebarluasan muatan yang dilarang dan berwenang memutus akses atau memerintahkan PSE memutus akses terhadap informasi/dokumen elektronik yang melanggar hukum.',
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

  // ── Pasal 40A (Sisipan Baru UU 1/2024 - Perlindungan Anak) ────────────────
  'uu-11-2008/pasal-40a': {
    canonicalPath: 'uu-11-2008/pasal-40a',
    pasalLabel: 'Pasal 40A',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 10)',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'SISIPAN_BARU',
    statusBadge: '🟢 Sisipan Baru (Kewajiban PSE Melindungi Anak)',
    textSebelum: '(Ketentuan norma belum ada pada UU No. 11 Tahun 2008 maupun UU No. 19 Tahun 2016)',
    textSesudah: '(1) Penyelenggara Sistem Elektronik wajib memberikan pelindungan bagi anak dalam penggunaan Sistem Elektronik.\n(2) Pelindungan meliputi verifikasi usia, moderasi konten kekerasan seksual/eksploitasi, dan saluran pengaduan khusus.\n(3) Pelanggaran dikenai sanksi administratif teguran tertulis, denda administratif, hingga pemutusan akses.',
    latarBelakangPerubahan: 'Merupakan amanat baru hukum positif Indonesia pasca ratifikasi konvensi hak anak dan maraknya predator seksual anak online serta kecanduan game/judi pada anak di bawah umur.',
    peraturanTerdampak: [
      {
        id: 'pp-ramah-anak-2024',
        type: 'PP',
        number: 'RPP Mandat Pasal 40A',
        year: 2024,
        title: 'Tata Cara Pelindungan Anak dalam Penyelenggaraan Sistem Elektronik',
        pasalTurunan: 'Seluruh RPP Baru',
        status: 'MANDAT_BARU',
        statusLabel: '🟢 Mandat Pembentukan PP Baru',
        ringkasanDampak: 'Kementerian Komunikasi dan Digital wajib merampungkan draf PP sebelum Januari 2026.',
        uuIndukSebelum: 'Belum diatur dalam UU ITE.',
        uuIndukSesudah: 'Pasal 40A ayat (4) UU 1/2024: Ketentuan lebih lanjut mengenai pelindungan anak diatur dalam Peraturan Pemerintah.',
        ketentuanTurunanTerdampak: 'Regulasi operasional PSE anak.',
        penjelasanPertentangan: 'Bila PP tidak kunjung terbit, penegakan sanksi denda administratif Pasal 40A ayat (3) tidak dapat dieksekusi.',
        rekomendasiHarmonisasi: 'Akselerasi harmonisasi antarkementerian di Kemenkumham RI.',
      },
    ],
  },

  // ── Pasal 45 (Ketentuan Sanksi Pidana) ────────────────────────────────────
  'uu-11-2008/pasal-45': {
    canonicalPath: 'uu-11-2008/pasal-45',
    pasalLabel: 'Pasal 45',
    diubahOleh: 'UU No. 1 Tahun 2024 (Pasal I angka 14) jo. UU No. 19 Tahun 2016',
    tanggalPengundangan: 'Disahkan di Jakarta: 2 Januari 2024 | Diundangkan: 2 Januari 2024',
    disahkanOleh: 'Presiden RI Joko Widodo & Diundangkan oleh Mensesneg Pratikno',
    lembaranNegara: 'LN RI Tahun 2024 No. 8, TLN No. 6916',
    statusPerubahan: 'DIUBAH',
    statusBadge: '🟡 Restrukturisasi Sanksi Pidana (UU 1/2024)',
    textSebelum: 'Pasal 45 memuat ancaman pidana penjara paling lama 6 tahun (UU 11/2008) dan 4 tahun (UU 19/2016) untuk tindak pidana pencemaran nama baik.',
    textSesudah: 'Pasal 45 ayat (4) UU 1/2024 menetapkan ancaman pidana penghinaan/pencemaran Pasal 27A dipangkas menjadi penjara paling lama 2 tahun atau denda paling banyak Rp400 juta. Tersangka TIDAK DAPAT DITAHAN selama penyidikan.',
    putusanMk: {
      nomor: 'Putusan MK No. 50/PUU-VI/2008 & No. 2/PUU-VII/2009',
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

