import { prisma } from '../src/index';

export async function seedNewModules() {
  console.log('[seed-new-modules] Starting seeding new modules...');

  // 1. GLOSARIUM LATIN HUKUM
  const latinTerms = [
    {
      term: 'Lex Specialis Derogat Legi Generali',
      literalTranslation: 'Hukum yang khusus mengesampingkan hukum yang umum.',
      legalDefinition: 'Asas penafsiran hukum yang menyatakan bahwa jika terjadi konflik norma antara ketentuan perundang-undangan yang bersifat khusus dengan yang bersifat umum, maka aturan yang khusus yang harus diberlakukan.',
      contextExample: 'Penerapan delik pidana dalam UU ITE atau UU Tipikor terhadap ketentuan umum KUHP.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Lex Superior Derogat Legi Inferiori',
      literalTranslation: 'Hukum yang lebih tinggi mengesampingkan hukum yang lebih rendah derajatnya.',
      legalDefinition: 'Hierarki perundang-undangan (Stufenbautheorie Hans Kelsen) di mana aturan yang derajatnya lebih rendah tidak boleh bertentangan dengan aturan yang lebih tinggi tingkatan normanya.',
      contextExample: 'Pengujian materiil Peraturan Pemerintah atau Perda terhadap Undang-Undang di Mahkamah Agung, atau UU terhadap UUD 1945 di Mahkamah Konstitusi.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Lex Posterior Derogat Legi Priori',
      literalTranslation: 'Hukum yang baru mengesampingkan hukum yang lama.',
      legalDefinition: 'Asas keberlakuan norma perundang-undangan yang sederajat, di mana aturan yang diundangkan belakangan menggantikan dan mencabut aturan terdahulu yang mengatur substansi yang sama.',
      contextExample: 'Pemberlakuan UU No. 1 Tahun 2024 yang menggantikan pasal-pasal tertentu dalam UU No. 19 Tahun 2016 dan UU No. 11 Tahun 2008.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Nullum Delictum Nulla Poena Sine Praevia Lege Poenali',
      literalTranslation: 'Tiada suatu tindak pidana dan tiada hukuman tanpa didasari undang-undang pidana yang telah ada sebelumnya.',
      legalDefinition: 'Asas legalitas fundamental dalam hukum pidana (Pasal 1 ayat 1 KUHP) yang melarang penjatuhan sanksi pidana secara retroaktif atau analogi.',
      contextExample: 'Larangan memidanakan seseorang atas perbuatan yang belum dirumuskan secara tegas sebagai delik pada saat perbuatan dilakukan.',
      category: 'HUKUM_PIDANA',
    },
    {
      term: 'Ultimum Remedium',
      literalTranslation: 'Obat atau upaya hukum pamungkas / terakhir.',
      legalDefinition: 'Prinsip bahwa hukum pidana hanya boleh digunakan sebagai senjata terakhir jika upaya hukum administratif, perdata, atau mediasi lainnya tidak memadai.',
      contextExample: 'Penyelesaian tindak pidana ringan, perkara pencemaran nama baik, atau sengketa transaksi elektronik mengutamakan restorative justice sebelum penuntutan di pengadilan.',
      category: 'HUKUM_PIDANA',
    },
    {
      term: 'Actori Incumbit Probatio',
      literalTranslation: 'Beban pembuktian ada pada pihak yang mendalilkan sesuatu.',
      legalDefinition: 'Asas pembuktian dalam hukum acara perdata (Pasal 163 HIR / 1865 KUHPerdata) dan pidana, di mana siapa yang menyatakan mempunyai hak atau menuduh perbuatan orang lain wajib membuktikannya.',
      contextExample: 'Penuntut Umum wajib membuktikan seluruh unsur dakwaan pidana tanpa ragu (beyond reasonable doubt).',
      category: 'HUKUM_ACARA',
    },
    {
      term: 'In Dubio Pro Reo',
      literalTranslation: 'Dalam hal keragu-raguan, putusan harus diambil yang menguntungkan terdakwa.',
      legalDefinition: 'Doktrin hukum acara pidana yang menuntut pembebasan terdakwa atau penjatuhan putusan seringan-ringannya manakala hakim mengalami kebimbangan atas keterpenuhan alat bukti yang sah.',
      contextExample: 'Penerapan Pasal 191 ayat (1) KUHAP: terdakwa diputus bebas jika perbuatan tidak terbukti secara sah dan meyakinkan.',
      category: 'HUKUM_ACARA',
    },
    {
      term: 'Pacta Sunt Servanda',
      literalTranslation: 'Janji atau kesepakatan itu mengikat para pihak sebagai undang-undang.',
      legalDefinition: 'Asas kepastian hukum dan iktikad baik dalam hukum perjanjian (Pasal 1338 KUHPerdata) yang menetapkan bahwa persetujuan yang dibuat secara sah berlaku mengikat bagi mereka yang membuatnya.',
      contextExample: 'Kekuatan mengikat syarat dan ketentuan (Terms of Service) dalam kontrak elektronik pada platform digital.',
      category: 'HUKUM_PERDATA',
    },
    {
      term: 'Ne Bis In Idem',
      literalTranslation: 'Tidak dua kali mengenai perkara yang sama.',
      legalDefinition: 'Asas perlindungan hukum (Pasal 76 KUHP) yang melarang seseorang dituntut untuk kedua kalinya atas perbuatan yang telah diputus dengan putusan berkekuatan hukum tetap (inkracht).',
      contextExample: 'Gugatan atau dakwaan dinyatakan ditolak jika subjek, objek, dan pokok sengketa identik dengan perkara yang sudah diadili.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Ignorantia Juris Non Excusat',
      literalTranslation: 'Ketidaktahuan akan hukum tidak dapat dimaafkan.',
      legalDefinition: 'Fiksi hukum (fictie van het recht) bahwa begitu suatu undang-undang diundangkan dalam Lembaran Negara, setiap orang dianggap telah mengetahui dan terikat oleh hukum tersebut.',
      contextExample: 'Pelaku tindak pidana tidak dapat beralasan tidak mengetahui adanya larangan transmisi konten asusila atau penghinaan di internet.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Ius Curia Novit',
      literalTranslation: 'Hakim dianggap mengetahui hukumnya.',
      legalDefinition: 'Asas bahwa pengadilan tidak boleh menolak memeriksa, mengadili, dan memutus suatu perkara yang diajukan dengan dalih hukumnya tidak ada atau kurang jelas (Pasal 10 ayat 1 UU Kekuasaan Kehakiman).',
      contextExample: 'Kewajiban hakim menggali nilai-nilai hukum dan rasa keadilan yang hidup dalam masyarakat (rechtsvinding).',
      category: 'HUKUM_ACARA',
    },
    {
      term: 'Audi Et Alteram Partem',
      literalTranslation: 'Dengarkan juga pihak yang lainnya.',
      legalDefinition: 'Asas fundamental peradilan yang adil (due process of law) yang menuntut hakim mendengarkan keterangan kedua belah pihak secara seimbang dan tidak memihak.',
      contextExample: 'Hak terdakwa mengajukan saksi/ahli yang meringankan (a de charge) dan mengajukan nota pembelaan (pledoi).',
      category: 'HUKUM_ACARA',
    },
    {
      term: 'Ultra Vires',
      literalTranslation: 'Melampaui wewenang yang diberikan.',
      legalDefinition: 'Tindakan badan atau pejabat pemerintahan atau direksi korporasi yang bertindak di luar lingkup wewenang hukum yang diatribusikan atau didelegasikan kepadanya.',
      contextExample: 'Gugatan di Pengadilan Tata Usaha Negara (PTUN) atas Keputusan Pejabat yang diterbitkan tanpa dasar wewenang sah.',
      category: 'ASAS_HUKUM',
    },
    {
      term: 'Res Judicata Pro Veritate Habetur',
      literalTranslation: 'Putusan hakim harus dianggap benar sampai ada putusan pengadilan yang lebih tinggi yang membatalkannya.',
      legalDefinition: 'Asas kepastian hukum atas putusan pengadilan berkekuatan hukum tetap (inkracht van gewijsde) demi stabilitas ketertiban umum.',
      contextExample: 'Amar putusan pengadilan wajib dieksekusi secara sah meskipun para pihak masih memiliki pandangan doktrinal yang berbeda.',
      category: 'HUKUM_ACARA',
    },
  ];

  for (const term of latinTerms) {
    await prisma.latinGlossary.upsert({
      where: { term: term.term },
      update: term,
      create: term,
    });
  }
  console.log(`[seed-new-modules] Upserted ${latinTerms.length} Latin glossary entries.`);

  // 2. USER PROFILE & BADGES
  const users = await prisma.user.findMany();
  for (const u of users) {
    let rep = 50;
    let bio = 'Peneliti dan pemerhati hukum perundang-undangan Indonesia.';
    let inst = 'Fakultas Hukum';

    if (u.role === 'DOSEN') {
      rep = 350;
      bio = 'Dosen Hukum Pidana & Siber. Fokus penelitian pada konsolidasi norma UU ITE dan KUHP 2023.';
      inst = 'Fakultas Hukum Universitas Indonesia';
    } else if (u.role === 'KURATOR') {
      rep = 500;
      bio = 'Kurator resmi naskah hukum & penelaah harmonisasi perundang-undangan.';
      inst = 'Lembaga Pengkajian Hukum Nasional';
    } else if (u.role === 'ADMIN') {
      rep = 1000;
      bio = 'Administrator Utama Sistem Informasi Perundang-undangan (SIPAKA).';
      inst = 'Pusat Riset Legal-Tech';
    } else {
      rep = 120;
      bio = 'Mahasiswa FH pengkaji version control perundang-undangan dan moot court.';
      inst = 'Fakultas Hukum';
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        reputationPoints: rep,
        bio,
        institution: inst,
      },
    });

    // Berikan badge prestasi
    const badgeNames = ['Yuris Perintis', 'Pemerhati Amandemen'];
    if (u.role === 'DOSEN' || u.role === 'KURATOR' || u.role === 'ADMIN') {
      badgeNames.push('Argumen Terverifikasi', 'Pakar Doktrin Hukum');
    }
    for (const bName of badgeNames) {
      const exists = await prisma.userBadge.findFirst({
        where: { userId: u.id, badgeName: bName },
      });
      if (!exists) {
        await prisma.userBadge.create({
          data: {
            userId: u.id,
            badgeName: bName,
            description: `Diberikan atas kontribusi aktif dalam telaah perundang-undangan (${bName}).`,
            icon: 'award',
          },
        });
      }
    }
  }

  // 3. FORUM DISKUSI KASUS
  const dosenUser = users.find((u) => u.role === 'DOSEN') || users[0];
  const mhsUser = users.find((u) => u.role === 'MAHASISWA') || users[0];

  const thread1 = await prisma.forumThread.create({
    data: {
      userId: mhsUser.id,
      title: 'Kualifikasi "Menyerang Kehormatan" pada Pasal 27A UU 1/2024 vs Kritik Kebijakan Publik',
      content:
        'Mohon pencerahan para dosen dan rekan yuris: bagaimana batasan rigid antara penghinaan personal dengan kritik kebijakan instansi publik pasca dimasukkannya Pasal 27A dalam UU 1/2024 (Perubahan Kedua UU ITE)? Apakah pengecualian demi kepentingan umum dapat langsung menggugurkan proses penyidikan di tingkat awal?',
      category: 'ITE',
      type: 'KASUS',
      canonicalPath: 'ite/bab-vi/pasal-27a',
      pasalLabel: 'Pasal 27A UU ITE (Perubahan Kedua)',
      tags: 'ITE,PencemaranNamaBaik,KepentinganUmum,Pasal27A',
      upvotesCount: 8,
      commentsCount: 2,
    },
  });

  // Komentar 1 (dari mahasiswa lain atau dosen)
  const comment1 = await prisma.forumComment.create({
    data: {
      threadId: thread1.id,
      userId: dosenUser.id,
      content:
        'Secara doktrinal, Pasal 27A UU 1/2024 harus dibaca secara sistematis dengan penjelasan resminya dan Pasal 310 KUHP. Frasa "menyerang kehormatan atau nama baik" menuntut adanya motif mens rea untuk menista secara pribadi. Jika konten merupakan telaah faktual terhadap performa badan publik, berlaku klausul pengecualian "demi kepentingan umum" (rechtvaardigingsgrond). Penyidik wajib mengedepankan mediasi dan SKB Pedoman Implementasi UU ITE sebelum menetapkan status tersangka.',
      upvotesCount: 12,
      isVerified: true,
      verifiedBy: dosenUser.name,
      verificationNote: 'Argumen hukum selaras dengan ratio decidendi Putusan MK No. 50/PUU-VI/2008 dan asas Ultimum Remedium.',
      verifiedAt: new Date(),
    },
  });

  const thread2 = await prisma.forumThread.create({
    data: {
      userId: dosenUser.id,
      title: 'Transisi Asas Lex Favor Reo Menjelang Keberlakuan Penuh KUHP Baru (UU 1/2023)',
      content:
        'Mari diskusikan implikasi Pasal 613-618 UU No. 1 Tahun 2023 terkait asas retroaktif yang menguntungkan terdakwa (lex favor reo). Bagaimana strategi advokat peradilan semu saat menghadapi dakwaan yang deliknya mengalami perubahan ancaman pidana penjara menjadi sanksi denda atau kerja sosial?',
      category: 'PIDANA',
      type: 'ANALISIS',
      canonicalPath: 'kuhp-2023',
      pasalLabel: 'Pasal 613 UU No. 1 Tahun 2023',
      tags: 'KUHP,LexFavorReo,Pidana,Retroaktif',
      upvotesCount: 15,
      commentsCount: 1,
    },
  });

  // 4. REPOSITORI DIGITAL RISET HUKUM
  await prisma.repositoryEntry.create({
    data: {
      userId: mhsUser.id,
      title: 'Kajian Yuridis Rekonstruksi Pasal 27 ayat (3) dan Pasal 27A UU ITE',
      category: 'MEMORANDUM_HUKUM',
      caseFact:
        'Seorang aktivis lingkungan mengunggah rekaman video pencemaran limbah pabrik ke media sosial, disertai kritik keras terhadap izin AMDAL perusahaan terkait. Perusahaan melaporkan aktivis tersebut atas dugaan tindak pidana pencemaran nama baik di ruang siber.',
      legalAnalysis:
        'Perbuatan aktivis tidak memenuhi unsur melawan hukum materiil. Berdasarkan ketentuan perubahan kedua UU ITE (UU No. 1 Tahun 2024), pasal pencemaran nama baik diselaraskan dengan Pasal 310 KUHP dan secara tegas mengecualikan perbuatan yang dilakukan untuk kepentingan umum atau pembelaan diri terpaksa. Disamping itu, asas Lex Specialis dan Putusan MK No. 50/PUU-VI/2008 menggarisbawahi bahwa kritik lingkungan hidup tidak dapat dikualifikasikan sebagai penistaan personal.',
      attachedProvisions: [
        { canonicalPath: 'ite/bab-vi/pasal-27/ayat-3', label: 'Pasal 27 ayat (3) UU 11/2008' },
        { canonicalPath: 'ite/bab-vi/pasal-27a', label: 'Pasal 27A UU 1/2024' },
      ],
      visibility: 'PUBLIK',
      tags: 'Lingkungan,ITE,PencemaranNamaBaik,KepentinganUmum',
    },
  });

  await prisma.repositoryEntry.create({
    data: {
      userId: dosenUser.id,
      title: 'Doktrin Silsilah Perubahan dan Preseden Uji Materiil Mahkamah Konstitusi',
      category: 'ANALISIS_DOKTRIN',
      caseFact: 'Analisis teoritis konsolidasi naskah hukum terhadap pasal-pasal bersyarat (conditionally constitutional) putusan MK.',
      legalAnalysis:
        'Ketika Mahkamah Konstitusi menyatakan suatu frasa dalam undang-undang konstitusional bersyarat (in casu Pasal 27 ayat 3 UU ITE dalam Putusan MK No. 50/PUU-VI/2008), penegak hukum dan kurator naskah wajib menyematkan anotasi yuridis aktif bahwa norma tersebut hanya mengikat sepanjang ditafsirkan sesuai amar putusan MK.',
      attachedProvisions: [{ canonicalPath: 'ite/bab-vi/pasal-27/ayat-3', label: 'Pasal 27 ayat (3)' }],
      visibility: 'PUBLIK',
      tags: 'MahkamahKonstitusi,AnotasiYudisial,Harmonisasi',
    },
  });

  console.log('[seed-new-modules] Completed seeding forum, profiles, and repository entries successfully!');
}

if (require.main === module) {
  seedNewModules()
    .catch((err) => {
      console.error('[seed-new-modules] Error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
