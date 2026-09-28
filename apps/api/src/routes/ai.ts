import { FastifyInstance } from 'fastify';
import { getCurrentUser } from '../auth';

interface AiConsultRequest {
  canonicalPath?: string;
  pasalLabel?: string;
  content?: string;
  question?: string;
  mode?: 'DEKOMPOSISI' | 'LEGAL_OPINION' | 'MOOT_COURT' | 'LEX_FAVOR_REO' | 'TANYA_BEBAS';
  caseFact?: string;
}

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
} {
  const norm = req.content || '';
  const label = req.pasalLabel || 'Norma Hukum';
  const mode = req.mode || 'DEKOMPOSISI';
  const q = req.question || req.caseFact || '';

  // Deteksi pasal spesifik untuk penalaran presisi
  const isItePencemaran = /27A|27 ayat \(3\)/i.test(label) || /menyerang kehormatan|nama baik/i.test(norm);
  const isItePemerasan = /27B|pemerasan|pengancaman/i.test(label) || /memeras/i.test(norm);
  const isIteKerusuhan = /28 ayat \(3\)|kerusuhan/i.test(label) || /pemberitahuan bohong/i.test(norm);
  const isKuhp2023 = /kuhp/i.test(label) || /uu 1\/2023|uu 1 tahun 2023/i.test(req.canonicalPath || '');

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
      sitasiResmi: [
        label,
        'Putusan MK No. 50/PUU-VI/2008',
        'Pedoman Implementasi SKB 3 Menteri (Menkominfo, Jaksa Agung, Kapolri)',
      ],
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
  };
}

export function registerAiRoutes(server: FastifyInstance): void {
  // POST /api/v1/ai/consult
  server.post('/api/v1/ai/consult', async (request, reply) => {
    const user = await getCurrentUser(request);
    const body = request.body as AiConsultRequest;

    if (!body.pasalLabel && !body.content) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'pasalLabel atau content norma wajib disertakan.',
      });
    }

    const analysis = generateLegalAnalysis(body);

    return {
      success: true,
      user: user ? { name: user.name, role: user.role } : null,
      mode: body.mode || 'DEKOMPOSISI',
      data: analysis,
      generatedAt: new Date().toISOString(),
    };
  });
}
