# MASTER PLANNING: DATABASE UNDANG-UNDANG & VERSION CONTROL ENGINE
**Sistem Konsolidasi, Rekonstruksi Norma, dan Version Control Perundang-Undangan Indonesia**
*Basis Data Inti untuk Riset dan Pembelajaran Fakultas Hukum*

*Edisi Inti & Arsitektur Terfokus | September 2026*  
*Lokasi: E:/Platfrom_Hukum/MASTER_PLANNING_NEW.md*

---

## 1. TUJUAN UTAMA: FONDASI DATABASE & VERSION CONTROL

### 1.1 Masalah Pokok yang Diselesaikan
Di Indonesia, jika undang-undang diubah (contoh: UU ITE diubah oleh UU 19/2016 dan UU 1/2024, atau UU Cipta Kerja), pemerintah **hanya menerbitkan dokumen pengubahnya**, bukan naskah utuh yang sudah rapi (*naskah konsolidasi*). 
Akibatnya:
- Mahasiswa dan dosen harus membuka 2 sampai 3 file PDF sekaligus untuk mencocokkan bunyi pasal yang berlaku saat ini.
- Sangat rawan salah kutip pasal lama yang sebenarnya sudah dihapus/diganti.
- Tidak ada mekanisme deterministik layaknya Git untuk melihat riwayat *"siapa mengubah apa, kapan, dan dasarnya apa"*.

### 1.2 Misi Inti Platform
Membangun **"Git untuk Perundang-Undangan Indonesia"**:
1. **Database Relasional Norma:** Memecah UU menjadi unit norma terkecil yang memiliki identitas stabil (Bab $\rightarrow$ Bagian $\rightarrow$ Paragraf $\rightarrow$ Pasal $\rightarrow$ Ayat $\rightarrow$ Huruf $\rightarrow$ Angka).
2. **Version Control Engine Deterministik:** Setiap amandemen dicatat sebagai operasi perubahan (*Change Operation*). Sistem mampu merekonstruksi naskah undang-undang pada titik waktu mana pun secara otomatis dan 100% akurat.
3. **Penyajian Konsolidasi Instan:** Menyajikan naskah resmi konsolidasi (*snapshot*) siap baca beserta penanda visual perubahan (*side-by-side diff*).
4. **Inovasi Lanjutan (Modular):** Fitur AI Parser, Socratic Tutor, Putusan MK/MA, dan integrasi kurikulum dikembangkan bertahap di atas fondasi database ini tanpa mengganggu kestabilan mesin inti.

---

## 2. ARSITEKTUR EMPAT LAPIS DATA (THE 4-TIER DATA MODEL)

Integritas hukum menuntut data yang tidak boleh dirusak atau ditimpa (*append-only & immutable*). Sistem dibagi menjadi 4 lapisan:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAPISAN 4: PUBLICATION SNAPSHOT (Naskah Konsolidasi Siap Baca)         │
│ - Snapshot naskah konsolidasi pada tanggal tertentu (deterministik)    │
│ - Menampilkan status aktif: Berlaku, Diubah, Dicabut, Putusan MK       │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ dihasilkan oleh Version Engine
┌───────────────────────────────────┴────────────────────────────────────┐
│ LAPISAN 3: CHANGE SETS & OPERATIONS (Peristiwa Amandemen)              │
│ - Instrumen Pengubah (misal: UU 19/2016 mengubah UU 11/2008)           │
│ - Operasi Perubahan: ADD, REPLACE, REPEAL, PARTIAL_REPEAL              │
│ - Effective Dates: enacted_at, promulgated_at, effective_from          │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ menargetkan ID norma stabil
┌───────────────────────────────────┴────────────────────────────────────┐
│ LAPISAN 2: PROVISION LEDGER (Struktur Hirarki Norma)                   │
│ - Node stabil: uu-11-2008/pasal-27/ayat-3                              │
│ - Riwayat bunyi norma per revisi (Provision Revisions)                 │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ diekstrak dari
┌───────────────────────────────────┴────────────────────────────────────┐
│ LAPISAN 1: SOURCE DOCUMENTS (Arsip Resmi Immutable)                    │
│ - Berkas PDF Lembaran Negara resmi dari JDIHN / Sekretariat Negara     │
│ - SHA-256 Checksum, Provenance URL, dan metadata pengundangan          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ENGINE VERSION CONTROL & OPERASI HUKUM

### 3.1 Operasi Perubahan (Change Operations)
Mesin konsolidasi hanya menjalankan operasi atomik teruji:
1. `ADD_PROVISION`: Menambahkan pasal atau ayat baru (misal: penambahan Pasal 27A).
2. `REPLACE_PROVISION`: Mengganti seluruh bunyi pasal/ayat dengan naskah baru.
3. `REPEAL_PROVISION`: Mencabut/menghapus pasal atau ayat tertentu.
4. `PARTIAL_REPEAL`: Menghapus frasa atau kata tertentu akibat pengujian MK.
5. `RENUMBER`: Penomoran ulang pasal/ayat (jika diatur eksplisit oleh UU pengubah).

### 3.2 Deterministik & Golden Tests
- **Golden Test Rule:** Untuk satu keluarga undang-undang (misal: UU ITE 2008 + amandemen 2016 + amandemen 2024), input data mentah yang sama **wajib** menghasilkan teks naskah konsolidasi yang sama persis hingga ke tanda baca.
- Setiap pembaruan kode mesin konsolidasi diuji otomatis dengan *Golden Test Suite* sebelum boleh masuk ke sistem utama.

### 3.3 Penanganan Waktu Berlaku (Temporal Multi-Dimensionality)
Setiap norma memiliki pencatatan waktu yang ketat:
- `enacted_at`: Tanggal disahkan oleh Presiden.
- `promulgated_at`: Tanggal diundangkan di Lembaran Negara RI.
- `effective_from`: Tanggal resmi berlaku mengikat (bisa mundur, langsung, atau ada masa transisi seperti KUHP 3 tahun).
- `published_at`: Tanggal data diverifikasi dan tampil di platform.

---

## 4. SKEMA DATABASE FISIK (POSTGRESQL & PRISMA)

Struktur tabel inti yang dikunci:

| Nama Tabel | Fungsi Utama |
| :--- | :--- |
| `legal_instruments` | Entitas induk peraturan (kategori, nomor, tahun, judul resmi, status aktif). |
| `source_documents` | File PDF resmi, SHA-256 hash, URL sumber JDIHN, nomor Lembaran Negara. |
| `provisions` | Identitas node norma stabil (hierarki bab, pasal, ayat, huruf, angka). |
| `provision_revisions` | Isi teks norma pada setiap iterasi perubahan. |
| `change_sets` | Bundel peristiwa perubahan yang menghubungkan UU pengubah ke UU target. |
| `change_operations` | Aksi atomik per pasal (jenis operasi, target provision, teks lama, teks baru). |
| `publications` | Snapshot naskah konsolidasi utuh pada versi tertentu. |
| `publication_items` | Daftar pasal yang aktif menyusun snapshot publikasi tersebut. |
| `review_records` | Catatan validasi oleh reviewer hukum/dosen sebelum status menjadi *PUBLISHED*. |
| `audit_logs` | Catatan jejak audit sistem yang tidak bisa dihapus (*append-only*). |

---

## 5. TECH STACK EFISIEN & RAMPING

- **Monorepo & Workspace:** Turborepo / pnpm.
- **Backend API & Engine:** NestJS (TypeScript) — bersih, modular, *type-safe*, mudah dipelihara jangka panjang.
- **Database Primer:** PostgreSQL 16 (didukung transaksi ACID ketat untuk konsolidasi norma).
- **ORM:** Prisma ORM (migrasi otomatis, skema terdokumentasi rapi).
- **Frontend Reader & Diff:** Next.js (React) + Tailwind CSS + komponen Side-by-Side Diff.
- **Infrastruktur Lokal:** Docker Compose (PostgreSQL & Object Storage MinIO).

---

## 6. ROADMAP IMPLEMENTASI BERTAHAP (FOKUS PADA INTI DATABASE)

```
[Tahap 1: Fondasi Inti] ──► [Tahap 2: Version Engine] ──► [Tahap 3: Reader & Diff UI] ──► [Tahap 4+: Inovasi AI]
- Setup DB & Prisma         - Logic konsolidasi UU        - Tampilan pasal & riwayat       - AI Parser otomatis
- Skema 4 Lapisan           - 3 Operasi pertama           - Diff lama vs baru              - Interkoneksi Putusan MK
- Pilot UU (KUHP / ITE)     - Golden Tests deterministik  - Export Naskah Konsolidasi      - AI Socratic Case Tutor
```

### Tahap 1: Setup Monorepo, Database & Data Pilot (Hari 1 - 4)
- Menyiapkan repository, Docker Compose PostgreSQL, dan Prisma.
- Menulis migrasi database skema 4-lapisan.
- Menyiapkan data pilot: **UU ITE (UU 11/2008 $\rightarrow$ UU 19/2016 $\rightarrow$ UU 1/2024)** atau **KUHP (WvS $\rightarrow$ UU 1/2023)** dalam bentuk data uji terstruktur.

### Tahap 2: Pembangunan Version Engine & Golden Test (Hari 5 - 10)
- Mengimplementasikan *Version Engine*:
  - Membaca naskah awal $\rightarrow$ Mengeksekusi *Change Set* $\rightarrow$ Menghasilkan naskah konsolidasi snapshot.
- Membangun suite *Golden Test*: memverifikasi bahwa hasil penggabungan naskah 100% identik dengan naskah resmi pemerintah.

### Tahap 3: Visual Reader & Diff Viewer untuk Mahasiswa (Hari 11 - 16)
- Membangun antarmuka baca peraturan (*Legal Reader*):
  - Navigasi cepat daftar isi (Bab, Bagian, Pasal).
  - Label status pada tiap pasal (*"Diubah oleh UU No. X"*, *"Masih Berlaku"*).
- Panel komparasi (*Side-by-side Diff*): membandingkan bunyi pasal sebelum dan sesudah amandemen secara berdampingan.
- Fitur ekspor naskah konsolidasi ke PDF/Markdown untuk bahan ajar dosen dan belajar mahasiswa.

### Tahap 4 (Sembari Berjalan): Inovasi Modular Lanjutan
Setelah inti database dan konsolidasi naskah berjalan stabil, inovasi berikut disambungkan bertahap:
1. **AI Automated Parser:** Mengekstrak PDF perundang-undangan baru dari JDIH secara otomatis ke format hierarki database.
2. **Koneksi Putusan MK:** Menandai pasal yang diuji di Mahkamah Konstitusi langsung pada teks pasal bersangkutan.
3. **AI Socratic Tutor & Case Study:** Asisten penalaran hukum untuk latihan mahasiswa fakultas hukum.

---

## 7. NILAI STRATEGIS UNTUK FAKULTAS HUKUM

1. **Kebenaran Naskah Mutlak:** Tidak ada keraguan apakah pasal yang dibaca mahasiswa di kelas adalah teks lama atau teks terbaru.
2. **Kemandirian Kampus:** Fakultas Hukum memiliki aset digital database perundang-undangan konsolidasi milik sendiri tanpa perlu membayar biaya lisensi mahal ratusan juta setiap tahun.
3. **Alat Edukasi Sejarah Hukum:** Dosen dan mahasiswa dapat menelusuri bagaimana norma hukum berkembang dari masa ke masa dalam hitungan detik.
