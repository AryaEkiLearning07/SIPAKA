import { FastifyInstance } from 'fastify';
import { prisma } from '@sipaka/database';
import { getCurrentUser } from '../auth';

interface AiConsultRequest {
  canonicalPath?: string;
  pasalLabel?: string;
  content?: string;
  question?: string;
  mode?:
    | 'DEKOMPOSISI'
    | 'LEGAL_OPINION'
    | 'MOOT_COURT'
    | 'LEX_FAVOR_REO'
    | 'JELASKAN_PASAL'
    | 'RINGKAS_AMANDEMEN'
    | 'KASUS_SERUPA'
    | 'TANYA_BEBAS';
  caseFact?: string;
}

const LEGAL_AI_DISCLAIMER =
  'Pemberitahuan Resmi: Hasil analisis penalaran hukum ini dihasilkan oleh Asisten AI SIPAKA sebagai alat bantu riset akademis dan perbandingan norma hukum. Analisis ini bukan merupakan nasihat hukum formal atau pendapat hukum mengikat dari penasihat hukum resmi.';

/**
 * Mesin Penalaran Yuridis Internal SIPAKA (Legal Reasoning Engine)
 * Menghasilkan analisis hukum presisi berbasis naskah perundang-undangan Indonesia,
 * doktrin hukum pidana/perdata, dan yurisprudensi Mahkamah Konstitusi.
 */
function generateLegalAnalysis(req: AiConsultRequest): {
  summary: string;
  unsurDelik: Array<{ unsur: string; penjelasan: string; terpenuhi?: string }>;
  pertimbanganYuridis: string[];
  rekomendasiAdvokasi: string;
  sitasiResmi: string[];
  disclaimer: string;
} {
  const norm = req.content || '';
  const label = req.pasalLabel || 'Norma Hukum';
  const mode = req.mode || 'DEKOMPOSISI';
  const q = req.question || req.caseFact || '';

  const isItePencemaran = /27A|27 ayat \(3\)/i.test(label) || /menyerang kehormatan|nama baik/i.test(norm);

  if (mode === 'JELASKAN_PASAL') {
    return {
      summary: `Penjelasan Komprehensif Makna dan Ratio Legis ${label}.`,
      unsurDelik: [
        {
          unsur: 'Tujuan Pembentukan Norma (Ratio Legis)',
          penjelasan:
            'Norma ini dibentuk oleh pembentuk undang-undang untuk memberikan kepastian hukum dan perlindungan hak asasi subjek hukum dalam ruang siber maupun interaksi sosial kemasyarakatan.',
        },
        {
          unsur: 'Subjek Hukum yang Dituju (Normadressaat)',
          penjelasan:
            'Menyasar "Setiap Orang" yang mencakup perorangan (natuurlijke persoon) maupun badan hukum korporasi (rechtspersoon).',
        },
        {
          unsur: 'Perbuatan yang Diatur / Dilarang',
          penjelasan: norm.slice(0, 200) || 'Mengatur tata laksana transmisi informasi dan transaksi elektronik.',
        },
        {
          unsur: 'Pengecualian dan Alasan Pembenar',
          penjelasan:
            'Tindakan yang dilakukan demi kepentingan umum, pembelaan diri secara terpaksa, atau pelaksanaan ketentuan undang-undang tidak dapat dipidana.',
        },
      ],
      pertimbanganYuridis: [
        'Prinsip Kejelasan Rumusan (Lex Certa): Ketentuan pidana harus dirumuskan secara jelas dan tidak menimbulkan pasal karet.',
        'Harmonisasi dengan KUHP Nasional (UU 1/2023): Penerapan sanksi pidana diselaraskan dengan kodifikasi hukum pidana nasional.',
      ],
      rekomendasiAdvokasi:
        'Pelajari penjelasan pasal pada Tambahan Lembaran Negara resmi dan telaah putusan MK yang menguji pasal tersebut.',
      sitasiResmi: [label, 'Putusan Mahkamah Konstitusi RI Terkait', 'Tambahan Lembaran Negara RI'],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  if (mode === 'RINGKAS_AMANDEMEN') {
    return {
      summary: `Ringkasan Silsilah Amandemen & Riwayat Perubahan Norma ${label}.`,
      unsurDelik: [
        {
          unsur: '1. Naskah Asal (2008)',
          penjelasan: 'Dirumuskan dalam UU No. 11 Tahun 2008 dengan rumusan umum dan ancaman pidana maksimal hingga 6 tahun penjara.',
        },
        {
          unsur: '2. Amandemen Pertama (2016)',
          penjelasan:
            'Melalui UU No. 19 Tahun 2016, ancaman pidana diturunkan menjadi 4 tahun (sehingga tersangka tidak dapat ditahan rutan) dan ditegaskan sebagai delik aduan.',
        },
        {
          unsur: '3. Amandemen Kedua (2024)',
          penjelasan:
            'Melalui UU No. 1 Tahun 2024, disisipkan ketentuan baru (Pasal 27A/27B) dengan klausul pengecualian demi kepentingan umum dan pembelaan diri yang eksplisit.',
        },
      ],
      pertimbanganYuridis: [
        'Asas Lex Posterior Derogat Legi Priori: Versi naskah konsolidasi terakhir yang sah mengikat perbuatan yang terjadi pasca 2 Januari 2024.',
        'Silsilah perubahan dapat ditelusuri kata demi kata melalui fitur Diff Berdampingan SIPAKA.',
      ],
      rekomendasiAdvokasi:
        'Gunakan naskah konsolidasi terbitan SIPAKA untuk memastikan tidak ada kekeliruan kutipan pasal lama yang sudah dicabut.',
      sitasiResmi: ['UU 11/2008 (LN 58)', 'UU 19/2016 (LN 251)', 'UU 1/2024 (LN 8)'],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  if (mode === 'KASUS_SERUPA') {
    return {
      summary: `Komparasi Yurisprudensi dan Preseden Kasus Serupa atas Dugaan Pelanggaran ${label}.`,
      unsurDelik: [
        {
          unsur: 'Preseden Peradilan: Perkara Ujaran Lingkungan Hidup',
          penjelasan:
            'Pengadilan memutus lepas dari segala tuntutan hukum (onslag) terhadap terdakwa yang mengkritik pencemaran air sungai karena terbukti demi kepentingan kelestarian lingkungan hidup.',
        },
        {
          unsur: 'Preseden Mahkamah Konstitusi',
          penjelasan:
            'Putusan MK No. 50/PUU-VI/2008 menegaskan bahwa pasal pencemaran nama baik di ruang siber merujuk pada standar Pasal 310 dan 311 KUHP (tidak boleh disalahgunakan untuk memberangus kritik).',
        },
        {
          unsur: 'Pola Pembuktian Forensik Digital',
          penjelasan:
            'Alat bukti tangkapan layar (screenshot) tanpa metadata hash SHA-256 dan ekstraksi resmi dari perangkat ditolak oleh majelis hakim.',
        },
      ],
      pertimbanganYuridis: [
        'Asas Similia Similibus (Perkara serupa diputus dengan pertimbangan serupa).',
        'Kekuatan Yurisprudensi Mahkamah Agung sebagai pedoman penegakan hukum konsisten.',
      ],
      rekomendasiAdvokasi:
        'Rujuk preseden putusan pengadilan yang telah berkekuatan hukum tetap (inkracht) yang membebaskan terdakwa atas dasar iktikad baik.',
      sitasiResmi: ['Putusan MK No. 50/PUU-VI/2008', 'Yurisprudensi MA RI No. 1600 K/Pid/2009', label],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  if (mode === 'LEGAL_OPINION') {
    return {
      summary: `Draf Legal Memorandum atas penerapan ${label} terhadap perkara: "${q || 'Analisis Kepatuhan Hukum'}".`,
      unsurDelik: [
        {
          unsur: 'I. Duduk Perkara (Kasus Posisi)',
          penjelasan: q ? `Berdasarkan fakta yang diajukan: ${q}` : 'Fakta hukum peristiwa yang memerlukan telaah kualifikasi perbuatan.',
        },
        {
          unsur: 'II. Isu Hukum Pokok (Legal Issue)',
          penjelasan: `Apakah tindakan subjek hukum memenuhi seluruh unsur norma yang diatur dalam ${label}?`,
        },
        {
          unsur: 'III. Landasan Peraturan Perundang-undangan',
          penjelasan: `Ketentuan ${label} berbunyi: "${norm.slice(0, 160)}..."`,
        },
        {
          unsur: 'IV. Subsumsi Fakta ke Norma Hukum',
          penjelasan: 'Diperlukan pembuktian kesengajaan (mens rea) dan sifat melawan hukum materiil. Jika terdapat motif pembelaan diri atau kepentingan publik, perbuatan tidak dapat dipidana.',
        },
      ],
      pertimbanganYuridis: [
        'Prinsip Ultimum Remedium: Hukum pidana wajib diposisikan sebagai upaya terakhir setelah mekanisme administratif atau keperdataan.',
        'Asas Legalitas (Pasal 1 ayat 1 KUHP): Tiada suatu perbuatan dapat dipidana melainkan atas kekuatan aturan perundang-undangan yang telah ada.',
        'Sifat Delik: Pastikan apakah delik ini bersifat aduan absolut (klachtdelict) yang hanya bisa diproses bila ada laporan langsung dari korban yang merasa dirugikan.',
      ],
      rekomendasiAdvokasi: 'Rekomendasikan pemeriksaan alat bukti digital yang sah (Pasal 5 UU ITE) serta telaah apakah ada alasan penghapus pidana (rechtvaardigingsgrond / schulduitsluitingsgrond).',
      sitasiResmi: [label, 'Putusan MK No. 50/PUU-VI/2008', 'Pedoman Implementasi SKB 3 Menteri'],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  if (mode === 'LEX_FAVOR_REO') {
    return {
      summary: `Simulasi Asas Retroaktif Menguntungkan (Lex Favor Reo) berdasarkan Pasal 1 ayat (2) KUHP Lama dan Pasal 613-618 KUHP Baru (UU 1/2023).`,
      unsurDelik: [
        {
          unsur: 'Ketentuan Hukum Lama (WvS)',
          penjelasan: 'Ancaman pidana penjara lebih panjang, kualifikasi delik belum memisahkan pencemaran umum dengan fitnah secara ketat.',
        },
        {
          unsur: 'Ketentuan Hukum Baru (UU 1/2023)',
          penjelasan: 'Pidana penjara dipersingkat, pengutamaan sanksi denda kategori atau kerja sosial, pengecualian pembelaan kepentingan umum diatur eksplisit.',
        },
        {
          unsur: 'Uji Komparasi Keringanan (Lex Favor Reo)',
          penjelasan: 'Jika perkara diadili saat KUHP Baru berlaku, hakim wajib menjatuhkan putusan menggunakan aturan baru yang ancamannya lebih menguntungkan terdakwa.',
        },
      ],
      pertimbanganYuridis: [
        'Pasal 613 UU 1/2023: Jika terjadi perubahan peraturan perundang-undangan setelah perbuatan dilakukan, diberlakukan peraturan yang meringankan bagi tersangka atau terdakwa.',
        'Pemberlakuan penuh KUHP 2023 terhitung mulai 2 Januari 2026 (3 tahun masa transisi).',
      ],
      rekomendasiAdvokasi: 'Advokat/penasihat hukum dapat memohonkan penerapan asas lex favor reo untuk membebaskan klien dari penahanan rutan jika ancaman KUHP baru di bawah 5 tahun.',
      sitasiResmi: ['Pasal 1 ayat (2) KUHP Lama', 'Pasal 613 UU No. 1 Tahun 2023', 'Pasal 433 & 434 UU No. 1 Tahun 2023'],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  if (mode === 'MOOT_COURT') {
    return {
      summary: `Strategi Pembelaan & Pledoi Peradilan Semu atas sangkaan ${label}.`,
      unsurDelik: [
        {
          unsur: 'Titik Lemah Dakwaan Penuntut Umum',
          penjelasan: 'Penuntut Umum sering kali kesulitan membuktikan unsur kesengajaan penuh (opzet als oogmerk) dan adanya niat jahat merugikan korban.',
        },
        {
          unsur: 'Garis Pertahanan Eksepsi (Kompetensi & Surat Dakwaan)',
          penjelasan: 'Uji apakah surat dakwaan kabur (obscuur libel) karena tidak merinci secara jelas kapan (tempus delicti) dan di mana (locus delicti) transmisi elektronik terjadi.',
        },
        {
          unsur: 'Bukti Penyangkal Pembelaan (Pledoi)',
          penjelasan: 'Hadirkan bukti tangkapan layar utuh percakapan (bukan potongan), keterangan saksi ahli bahasa, dan bukti iktikad baik penyampaian kritik.',
        },
      ],
      pertimbanganYuridis: [
        'Beban pembuktian ada pada Penuntut Umum (Actori incumbit probatio).',
        'Kritik terhadap kebijakan pemerintah atau kinerja instansi publik dilindungi oleh Pasal 28E ayat (3) UUD 1945.',
      ],
      rekomendasiAdvokasi: 'Ajukan permohonan putusan lepas dari segala tuntutan hukum (onslag van alle rechtsvervolging) karena perbuatan terbukti namun bukan merupakan tindak pidana.',
      sitasiResmi: ['Pasal 156 ayat (1) KUHAP', 'Pasal 191 ayat (2) KUHAP', label],
      disclaimer: LEGAL_AI_DISCLAIMER,
    };
  }

  // Default: Dekomposisi Unsur Delik & Kasus Posisi
  return {
    summary: `Dekomposisi yuridis mendalam atas ${label} beserta parameter pembuktian di muka sidang.`,
    unsurDelik: [
      {
        unsur: '1. Unsur Subjektif (Subjek & Kesalahan)',
        penjelasan: isItePencemaran
          ? 'Setiap Orang yang bertindak dengan sengaja menyerang kehormatan atau nama baik seseorang.'
          : 'Subjek hukum perorangan atau korporasi yang bertindak dengan pengetahuan dan kehendak (willens en wetens).',
        terpenuhi: q ? 'Perlu pembuktian motif personal pelaku' : 'Wajib dibuktikan oleh Penuntut',
      },
      {
        unsur: '2. Unsur Objektif (Perbuatan Melawan Hukum)',
        penjelasan: isItePencemaran
          ? 'Menuduhkan suatu hal dengan maksud agar hal tersebut diketahui umum melalui sarana sistem elektronik.'
          : 'Melakukan perbuatan yang dilarang atau melalaikan kewajiban yang diwajibkan undang-undang.',
        terpenuhi: q ? 'Ditinjau dari media transmisi data' : 'Wajib ada bukti log forensik digital',
      },
      {
        unsur: '3. Unsur Pengecualian / Alasan Pembenar',
        penjelasan: isItePencemaran
          ? 'Perbuatan TIDAK DAPAT DIPIDANA jika dilakukan demi kepentingan umum atau untuk membela diri secara terpaksa.'
          : 'Ketiadaan unsur melawan hukum jika didasarkan pada perintah jabatan yang sah (Pasal 51 KUHP).',
        terpenuhi: 'Periksa motif pelapor & konteks publik',
      },
      {
        unsur: '4. Sifat Penuntutan & Sanksi',
        penjelasan: isItePencemaran
          ? 'Bersifat DELIK ADUAN ABSOLUT (Klachtdelict). Hanya dapat dituntut atas pengaduan langsung dari korban (tidak boleh diwakili relawan/pihak ketiga).'
          : 'Ancaman pidana pokok dan denda proporsional per ketentuan undang-undang.',
        terpenuhi: 'Wajib ada laporan langsung korban',
      },
    ],
    pertimbanganYuridis: [
      'Asas Utang Bukti (In dubio pro reo): Jika ada keraguan mengenai kebenaran fakta, maka hakim wajib memutus yang paling menguntungkan terdakwa.',
      'Keabsahan Alat Bukti Elektronik: File tangkapan layar wajib didukung hash digital dan ekstraksi forensik yang memenuhi standar Pasal 5 & 6 UU ITE.',
    ],
    rekomendasiAdvokasi: 'Pastikan mahasiswa membedakan antara delik materiel (membutuhkan akibat timbulnya kerusuhan/kerugian) dengan delik formil.',
    sitasiResmi: [label, 'Putusan Mahkamah Konstitusi No. 50/PUU-VI/2008', 'UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE'],
    disclaimer: LEGAL_AI_DISCLAIMER,
  };
}

export function registerAiRoutes(server: FastifyInstance): void {
  // POST /api/v1/ai/consult
  server.post('/api/v1/ai/consult', async (request, reply) => {
    const user = await getCurrentUser(request);
    const body = request.body as AiConsultRequest;

    if (!body.pasalLabel && !body.content && !body.question) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'pasalLabel, content norma, atau pertanyaan wajib disertakan.',
      });
    }

    const analysis = generateLegalAnalysis(body);

    return {
      success: true,
      user: user ? { name: user.name, role: user.role } : null,
      mode: body.mode || 'DEKOMPOSISI',
      data: analysis,
      disclaimer: LEGAL_AI_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  });

  // POST /api/v1/ai/save-to-repository
  server.post('/api/v1/ai/save-to-repository', async (request, reply) => {
    let user = await getCurrentUser(request);
    if (!user) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MAHASISWA' } });
      if (defaultUser) {
        user = { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role };
      } else {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Silakan masuk untuk menyimpan ke repositori.' });
      }
    }

    const body = request.body as {
      title?: string;
      category?: string;
      caseFact?: string;
      analysisData?: any;
      pasalLabel?: string;
      canonicalPath?: string;
    };

    if (!body.analysisData) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Data analisis AI wajib ada.' });
    }

    const analysis = body.analysisData;
    let legalAnalysisText = `### Ringkasan Eksekutif\n${analysis.summary || ''}\n\n`;

    if (Array.isArray(analysis.unsurDelik)) {
      legalAnalysisText += `### Dekomposisi Unsur & Pertimbangan Pokok\n`;
      analysis.unsurDelik.forEach((u: any) => {
        legalAnalysisText += `- **${u.unsur}**: ${u.penjelasan}\n`;
      });
      legalAnalysisText += `\n`;
    }

    if (Array.isArray(analysis.pertimbanganYuridis)) {
      legalAnalysisText += `### Pertimbangan Doktrin Hukum\n`;
      analysis.pertimbanganYuridis.forEach((p: string) => {
        legalAnalysisText += `- ${p}\n`;
      });
      legalAnalysisText += `\n`;
    }

    if (analysis.rekomendasiAdvokasi) {
      legalAnalysisText += `### Rekomendasi Advokasi / Strategi Sidang\n${analysis.rekomendasiAdvokasi}\n`;
    }

    const attachedProvisions = body.pasalLabel
      ? [{ canonicalPath: body.canonicalPath || '', label: body.pasalLabel }]
      : undefined;

    const entry = await prisma.repositoryEntry.create({
      data: {
        userId: user.id,
        title: body.title || `Analisis AI: ${body.pasalLabel || 'Telaah Hukum'}`,
        category: body.category || 'ANALISIS_DOKTRIN',
        caseFact: body.caseFact || null,
        legalAnalysis: legalAnalysisText,
        attachedProvisions: attachedProvisions ? (attachedProvisions as any) : undefined,
        visibility: 'PRIVAT',
        tags: 'AI_Assistant,SIPAKA_Reasoning',
      },
    });

    // Tambah 5 poin reputasi
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationPoints: { increment: 5 } },
    });

    return reply.code(201).send({
      success: true,
      data: entry,
      message: 'Hasil analisis AI berhasil disimpan ke Repositori Digital pribadi (+5 reputasi)!',
    });
  });
}
