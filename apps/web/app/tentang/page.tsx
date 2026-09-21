import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tentang & Disclaimer — LexVera',
  description: 'Status yuridis naskah, metodologi konsolidasi, dan sumber data LexVera.',
};

const sections = [
  {
    id: 'status',
    no: 'I',
    title: 'Status Yuridis Naskah',
    body: (
      <>
        <p>
          Naskah konsolidasi yang disajikan LexVera adalah <strong>alat riset non-resmi</strong>.
          Naskah yang sah dan berlaku secara resmi hanyalah yang diterbitkan dalam{' '}
          <strong>Lembaran Negara Republik Indonesia</strong> (dan Tambahannya) oleh lembaga
          penerbit yang berwenang.
        </p>
        <p>
          Setiap pasal pada platform ini dilengkapi rujukan dasar perubahannya (Pasal–angka pada
          UU pengubah) sehingga dapat diverifikasi silang oleh pembaca ke dokumen sumber. Gunakan
          LexVera sebagai alat temuan dan pelacakan riwayat — bukan pengganti kutipan LN.
        </p>
      </>
    ),
  },
  {
    id: 'metode',
    no: 'II',
    title: 'Metodologi: Mesin Tidak Pernah Mengarang',
    body: (
      <>
        <p>
          LexVera menyimpan peraturan sebagai <strong>empat lapisan data</strong>: (1) arsip PDF
          resmi yang di-hash SHA-256 dan tidak pernah diubah, (2) pohon norma (Bab → Pasal →
          Ayat) dengan identitas stabil, (3) operasi perubahan (ADD, REPLACE, REPEAL,
          PARTIAL_REPEAL) yang hanya dihasilkan dari persetujuan kurator manusia, dan (4) snapshot
          konsolidasi yang direkonstruksi mesin secara deterministik.
        </p>
        <p>
          Tiga aturan baja berlaku di seluruh sistem: <strong>mesin tidak pernah menulis teks</strong>{' '}
          — semua bunyi pasal dikutip verbatim dari sumber resmi; klausa yang ambigu{' '}
          <strong>di-karantina</strong> sebagai draf untuk ditinjau manusia, bukan ditebak; dan
          hanya naskah berstatus <strong>PUBLISHED</strong> — hasil persetujuan kurator dan golden
          test — yang ditampilkan. Hasil rekonstruksi diuji <em>golden test</em>: input data yang
          sama wajib menghasilkan naskah yang identik karakter-per-karakter.
        </p>
      </>
    ),
  },
  {
    id: 'sumber',
    no: 'III',
    title: 'Sumber Data & Provenance',
    body: (
      <>
        <p>
          Dokumen sumber diperoleh dari kanal publikasi resmi — antara lain{' '}
          <a
            href="https://peraturan.bpk.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-seal underline decoration-seal/30 hover:decoration-seal"
          >
            peraturan.bpk.go.id
          </a>{' '}
          dan portal JDIH — lalu diarsipkan oleh LexVera bersama URL asal, tanggal pengunduhan,
          dan hash SHA-256. Naskah peraturan perundang-undangan negara tidak dilindungi hak cipta
          (Pasal 42 UU No. 28 Tahun 2014 tentang Hak Cipta).
        </p>
        <p>
          Saat ini LexVera <strong>belum berafiliasi</strong> dengan lembaga negara mana pun;
          akses data ditempuh melalui kanal publik dan (direncanakan) kemitraan riset dengan
          institusi JDIH melalui jalur akademik.
        </p>
      </>
    ),
  },
  {
    id: 'pilot',
    no: 'IV',
    title: 'Ruang Lingkup Pilot',
    body: (
      <>
        <p>
          Pilot dilakukan pada <strong>keluarga UU ITE</strong>: UU No. 11 Tahun 2008 beserta
          Perubahan Pertama (UU No. 19 Tahun 2016) dan Perubahan Kedua (UU No. 1 Tahun 2024),
          termasuk anotasi Putusan MK No. 50/PUU-VI/2008. Keluarga berikutnya diprioritaskan
          berdasarkan kebutuhan kurikulum dan ketersediaan dokumen sumber.
        </p>
      </>
    ),
  },
];

export default function TentangPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Masthead */}
      <header className="border-b rule">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-baseline justify-between">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            LexVera<span className="text-seal">.</span>
          </Link>
          <Link href="/" className="text-xs font-semibold uppercase tracking-caps text-ink-mute hover:text-seal transition-colors">
            ← Kembali ke indeks
          </Link>
        </div>
        <div className="border-t rule" />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-14">
        <p className="kicker">Tentang &amp; Disclaimer</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight leading-tight">
          Dokumen yang Anda baca
          <br />
          datang dari mana<span className="text-seal">.</span>
        </h1>
        <p className="mt-5 font-serif text-lg leading-relaxed text-ink-soft max-w-2xl">
          Halaman ini menegaskan status yuridis naskah, cara mesin bekerja, dan asal-usul setiap
          dokumen — agar setiap pengguna dapat menimbang sendiri kepercayaannya.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="grid sm:grid-cols-[3rem_1fr] gap-5">
              <div className="tabular font-display text-2xl font-semibold text-seal pt-0.5">{s.no}</div>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h2>
                <div className="mt-3 font-serif text-[16px] leading-relaxed text-ink-soft space-y-3 [&_strong]:text-ink">
                  {s.body}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Catatan penutup */}
        <div className="mt-14 border-t-2 border-ink pt-6">
          <p className="font-serif text-sm leading-relaxed text-ink-mute">
            LexVera dikembangkan sebagai proyek riset pendidikan hukum. Masukan atas akurasi
            naskah, pelaporan kesalahan kutip, dan tawaran kemitraan kurasi sangat ditunggu —
            setiap laporan menjadi bagian dari catatan audit platform.
          </p>
        </div>
      </main>

      <footer className="border-t rule">
        <div className="max-w-4xl mx-auto px-6 py-8 text-[11px] font-semibold uppercase tracking-caps text-ink-faint">
          LexVera · Naskah riset non-resmi — rujuk Lembaran Negara RI untuk naskah resmi
        </div>
      </footer>
    </div>
  );
}
