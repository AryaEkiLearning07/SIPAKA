import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Cpu, Database, Compass, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang & Metodologi — SIPAKA',
  description: 'Status yuridis naskah, integritas data, dan metodologi deterministik SIPAKA.',
};

const sections = [
  {
    id: 'status',
    no: '01',
    icon: ShieldCheck,
    title: 'Status Yuridis Naskah',
    body: (
      <>
        <p>
          Naskah konsolidasi yang disajikan SIPAKA adalah <strong>alat bantu riset dan kodifikasi akademik non-resmi</strong>.
          Naskah yang mengikat secara yuridis hanyalah naskah resmi yang diundangkan dalam{' '}
          <strong>Lembaran Negara Republik Indonesia</strong> (LNRI) dan Tambahan Lembaran Negara (TLNRI) oleh instansi penerbit resmi negara.
        </p>
        <p>
          Setiap pasal pada platform ini dilengkapi rujukan dasar perubahan yang terverifikasi (nomor pasal dan angka pada UU pengubah) sehingga dapat diuji silang langsung oleh akademisi, hakim, dan advokat ke dokumen sumber primer.
        </p>
      </>
    ),
  },
  {
    id: 'metode',
    no: '02',
    icon: Cpu,
    title: 'Metodologi: Rekonstruksi Deterministik Nol-Halusinasi',
    body: (
      <>
        <p>
          SIPAKA menstrukturkan peraturan perundang-undangan sebagai <strong>empat lapisan integritas data</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 mt-2 mb-2">
          <li><strong>Arsip Dokumen Primer:</strong> PDF Lembaran Negara terverifikasi hash kriptografis SHA-256 yang bersifat <em>immutable</em>.</li>
          <li><strong>Pohon Hirarki Norma:</strong> Representasi <em>Abstract Syntax Tree</em> (BAB → Bagian → Paragraf → Pasal → Ayat → Huruf) dengan UUID stabil.</li>
          <li><strong>Buku Besar Operasi (Ledger):</strong> Operasi formal (ADD, REPLACE, REPEAL, INSERT) yang diverifikasi oleh kurator ahli hukum.</li>
          <li><strong>Snapshot Deterministik:</strong> Rekonstruksi naskah konsolidasi tepat pada titik waktu tertentu dengan algoritma <em>deterministic state rehydration</em>.</li>
        </ul>
        <p>
          Prinsip baja sistem: <strong>Mesin tidak pernah mengarang bunyi hukum</strong>. Semua teks bersumber verbatim dari naskah primer. Seluruh pengujian divalidasi oleh <em>golden test suite</em> berparitas karakter 100%.
        </p>
      </>
    ),
  },
  {
    id: 'sumber',
    no: '03',
    icon: Database,
    title: 'Sumber Data Primer & Provenance',
    body: (
      <>
        <p>
          Dokumen sumber dihimpun dari kanal publikasi resmi negara — antara lain{' '}
          <a
            href="https://peraturan.bpk.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 font-medium underline decoration-indigo-300 hover:text-indigo-800"
          >
            Database Peraturan BPK RI (peraturan.bpk.go.id)
          </a>{' '}
          serta jaringan JDIH Nasional. Setiap berkas diarsipkan bersama URL asal, tanggal unduh, dan checksum hash SHA-256.
        </p>
        <p>
          Berdasarkan <strong>Pasal 42 huruf a UU No. 28 Tahun 2014 tentang Hak Cipta</strong>, hasil karya berupa peraturan perundang-undangan tidak memiliki hak cipta dan merupakan domain publik.
        </p>
      </>
    ),
  },
  {
    id: 'pilot',
    no: '04',
    icon: Compass,
    title: 'Cakupan Pilot & Roadmap Riset',
    body: (
      <>
        <p>
          Tahap demonstrasi pilot difokuskan pada <strong>Keluarga Regulasi UU ITE</strong>: UU No. 11 Tahun 2008 beserta Amandemen Pertama (UU No. 19 Tahun 2016), Amandemen Kedua (UU No. 1 Tahun 2024), serta anotasi Putusan Mahkamah Konstitusi No. 50/PUU-VI/2008 dan aturan turunan PP No. 71 Tahun 2019.
        </p>
      </>
    ),
  },
];

export default function TentangPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50/60 font-sans text-slate-800">
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white overflow-hidden shadow-xl mb-12">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-400/30 mb-4">
              Transparansi &amp; Integritas Data
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Metodologi &amp; Landasan Yuridis Platform
            </h1>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              SIPAKA dirancang untuk menjamin kepastian silsilah norma hukum. Halaman ini membedah status yuridis dokumen, arsitektur data deterministik, dan provenance sumber resmi.
            </p>
          </div>
        </div>

        {/* Section Cards */}
        <div className="space-y-6">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <section
                key={s.id}
                id={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        BAGIAN {s.no}
                      </span>
                      <h2 className="font-sans text-xl font-bold text-slate-900 tracking-tight">
                        {s.title}
                      </h2>
                    </div>
                    <div className="mt-4 text-sm leading-relaxed text-slate-600 space-y-3 [&_strong]:text-slate-900">
                      {s.body}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Closing Academic Colophon */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <h3 className="font-sans font-bold text-slate-900 text-base mb-2">
            Kolaborasi &amp; Kurasi Akademik
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            SIPAKA dibangun sebagai inisiatif teknologi hukum terpadu bagi civitas akademika Fakultas Hukum, kurator perundang-undangan, dan praktisi peradilan. Setiap masukan verifikasi naskah, koreksi penomoran, maupun kerja sama integrasi JDIH dicatat dalam <em>open audit log</em> sistem.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-slate-500">
          SIPAKA · Sistem Informasi Pelacakan Amandemen, Kodifikasi, dan Advokasi — Rujuk Lembaran Negara RI untuk naskah primer resmi.
        </div>
      </footer>
    </div>
  );
}
