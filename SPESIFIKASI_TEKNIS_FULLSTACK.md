# SPESIFIKASI REKAYASA SISTEM FULLSTACK & TEKNIS YURIDIS
## Platform Riset Hukum, Version Control Perundang-Undangan & AI Legal Reasoning
**Kode Proyek:** LexVera / JurisLab  
**Target Lokasi:** `E:\Platfrom_Hukum`  
**Sasaran Pengembang:** Full-Stack Software Engineer & Legal Tech Specialist  
**Status:** Dokumen Resmi Rekayasa Teknis & Standar Eksekusi (Ready for Implementation)

---

## 1. PENDAHULUAN & ARSITEKTUR TINGGI (HIGH-LEVEL ARCHITECTURE)

Sistem ini dirancang sebagai **Modular Monolith** berbasis TypeScript murni di lingkungan monorepo. Arsitektur memisahkan secara tegas antara:
1. **Penyimpanan Sumber Resmi (Provenance Layer):** Menyimpan file PDF asli Lembaran Negara dengan verifikasi hash SHA-256.
2. **Mesin Rekonstruksi Norma (Version Control Engine):** Engine deterministik yang menggabungkan naskah amandemen perundang-undangan menjadi naskah konsolidasi.
3. **Data Store & Search Index:** Relasional PostgreSQL + `pgvector` untuk pencarian hibrida (Kata Kunci BM25 + Vektor Semantik).
4. **Antarmuka Pengguna (Interactive Legal Reader):** Next.js 15 App Router dengan kemampuan perbandingan berdampingan (*Side-by-Side Git-style Diff*).
5. **AI Legal Reasoning Service:** Pipeline RAG terisolasi dengan pembatasan ketat (*anti-hallucination guardrail*) untuk edukasi metode Sokrates.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 15 FRONTEND                                  │
│   ├── /reader/[instrumentId]        (Pembaca Naskah Konsolidasi & Anotasi MK)    │
│   ├── /compare?from=v1&to=v2        (Side-by-Side Diff Slider Interaktif)        │
│   ├── /tutor/[provisionId]          (Panel AI Socratic Legal Reasoning)          │
│   └── /admin/curator                (Dashboard Validasi AI Parser Human-in-Loop) │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ REST API / Server Actions (Type-Safe DTO)
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                           BACKEND DOMAIN SERVICES                                │
│   ├── LegalInstrumentsModule        (Manajemen Entitas Peraturan)                │
│   ├── ProvisionsModule              (Hierarki Bab/Pasal/Ayat/Huruf)              │
│   ├── VersionEngineModule           (Mesin Konsolidasi & Operasi Amandemen)      │
│   ├── JudicialAnnotationModule      (Anotasi Putusan MK & Yurisprudensi MA)      │
│   └── SocraticTutorModule           (AI Pipeline Bedah Unsur Delik & Kasus)      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                       DATABASE & STORAGE LAYER (PRISMA)                          │
│   ├── PostgreSQL 16                 (ACID Relasional & Transaksi Snapshot)       │
│   ├── pgvector Extension            (Pencarian Semantik Konsep Hukum)            │
│   └── Object Storage / Local S3     (PDF Autentik Lembaran Negara RI)            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SKEMA DATABASE DETAIL (PRISMA SCHEMA SPECIFICATION)

Skema database berikut adalah cetak biru mutlak (`schema.prisma`) yang harus diimplementasikan full-stack developer:

```prisma
datasource db {
  provider = "postgresql" // Pada dev lokal dapat diganti "sqlite" jika tanpa Docker
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// 1. INSTRUMEN HUKUM & SUMBER DOKUMEN RESMI (PROVENANCE)
// -------------------------------------------------------------

enum InstrumentType {
  UUD1945
  TAP_MPR
  UU
  PERPPU
  PP
  PERPRES
  PERMEN
  PERDA_PROV
  PERDA_KABKOT
}

enum InstrumentStatus {
  BERLAKU
  DIUBAH
  DICABUT
  TIDAK_BERLAKU_SEBAGIAN
}

model LegalInstrument {
  id              String           @id @default(cuid())
  type            InstrumentType
  number          Int              // Contoh: 11
  year            Int              // Contoh: 2008
  title           String           // Contoh: "Informasi dan Transaksi Elektronik"
  shortTitle      String?          // Contoh: "UU ITE"
  description     String?          @db.Text
  status          InstrumentStatus @default(BERLAKU)
  
  // 4 Dimensi Tanggal Hukum
  enactedAt       DateTime         // Tanggal ditetapkan Presiden
  promulgatedAt   DateTime         // Tanggal diundangkan Lembaran Negara
  effectiveFrom   DateTime         // Tanggal berlaku efektif mengikat publik
  expiredAt       DateTime?        // Tanggal dicabut/kedaluwarsa

  // Nomor Publikasi Lembaran Negara RI
  lnNumber        Int?             // Nomor Lembaran Negara
  tlnNumber       Int?             // Nomor Tambahan Lembaran Negara

  sourceDocuments SourceDocument[]
  provisions      Provision[]
  publications    Publication[]
  
  // Relasi Peristiwa Perubahan (Change Sets)
  modificationsMade     ChangeSet[] @relation("AmendingInstrument")
  modificationsReceived ChangeSet[] @relation("TargetInstrument")

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([type, number, year])
  @@map("legal_instruments")
}

model SourceDocument {
  id                String          @id @default(cuid())
  legalInstrumentId String
  legalInstrument   LegalInstrument @relation(fields: [legalInstrumentId], references: [id], onDelete: Cascade)
  
  originalUrl       String          // URL asal (JDIHN / Setneg)
  storagePath       String          // Path lokal / S3
  mimeType          String          @default("application/pdf")
  fileHashSha256    String          // Hash kriptografis integritas dokumen
  fileSizeBytes     Int
  sourceInstitution String          // "Kementerian Sekretariat Negara RI"

  isVerified        Boolean         @default(false)
  verifiedAt        DateTime?
  
  createdAt         DateTime        @default(now())

  @@map("source_documents")
}

// -------------------------------------------------------------
// 2. STRUKTUR HIERARKI NORMA (PROVISION TREE)
// -------------------------------------------------------------

enum ProvisionType {
  BAB
  BAGIAN
  PARAGRAF
  PASAL
  AYAT
  HURUF
  ANGKA
  PENJELASAN_UMUM
  PENJELASAN_PASAL
}

model Provision {
  id                String          @id @default(cuid())
  legalInstrumentId String
  legalInstrument   LegalInstrument @relation(fields: [legalInstrumentId], references: [id], onDelete: Cascade)

  parentId          String?
  parent            Provision?      @relation("ProvisionHierarchy", fields: [parentId], references: [id])
  children          Provision[]     @relation("ProvisionHierarchy")

  type              ProvisionType
  orderIndex        Int             // Urutan tampilan (1, 2, 3...)
  label             String          // "BAB I", "Pasal 27", "Ayat (3)", "Huruf a"
  canonicalPath     String          // "uu-11-2008/bab-vi/pasal-27/ayat-3"

  revisions         ProvisionRevision[]
  targetOperations  ChangeOperation[]
  judicialRulings   JudicialAnnotation[]

  createdAt         DateTime        @default(now())

  @@unique([legalInstrumentId, canonicalPath])
  @@index([canonicalPath])
  @@map("provisions")
}

model ProvisionRevision {
  id              String          @id @default(cuid())
  provisionId     String
  provision       Provision       @relation(fields: [provisionId], references: [id], onDelete: Cascade)

  versionTag      String          // "ORIGINAL_2008", "REVISION_2016", "REVISION_2024"
  content         String          @db.Text
  explanation     String?         @db.Text // Teks penjelasan resmi dari LN
  
  effectiveFrom   DateTime
  effectiveUntil  DateTime?       // Null jika masih aktif

  changeSetId     String?
  changeSet       ChangeSet?      @relation(fields: [changeSetId], references: [id])

  createdAt       DateTime        @default(now())

  @@map("provision_revisions")
}

// -------------------------------------------------------------
// 3. MESIN VERSION CONTROL & PERISTIWA AMANDEMEN
// -------------------------------------------------------------

enum ChangeSetStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  PUBLISHED
}

model ChangeSet {
  id                    String          @id @default(cuid())
  amendingInstrumentId  String          // UU Pengubah (misal: UU 19/2016)
  amendingInstrument    LegalInstrument @relation("AmendingInstrument", fields: [amendingInstrumentId], references: [id])
  
  targetInstrumentId    String          // UU yang diubah (misal: UU 11/2008)
  targetInstrument      LegalInstrument @relation("TargetInstrument", fields: [targetInstrumentId], references: [id])

  title                 String          // "Amandemen Pertama UU ITE"
  legalBasisNote        String?         // "Pasal I UU No. 19 Tahun 2016"
  status                ChangeSetStatus @default(DRAFT)
  
  operations            ChangeOperation[]
  revisionsCreated      ProvisionRevision[]
  reviews               ReviewRecord[]

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@map("change_sets")
}

enum OperationType {
  ADD_PROVISION           // Sisipan pasal baru (Pasal 27A)
  REPLACE_PROVISION       // Penggantian bunyi pasal/ayat
  REPEAL_PROVISION        // Penghapusan/pencabutan norma
  PARTIAL_REPEAL          // Pencabutan frasa/kata
  RENUMBER                // Penomoran ulang
  JUDICIAL_OVERRIDE       // Batal/bersyarat akibat putusan MK
}

model ChangeOperation {
  id              String        @id @default(cuid())
  changeSetId     String
  changeSet       ChangeSet     @relation(fields: [changeSetId], references: [id], onDelete: Cascade)

  targetProvisionId String
  targetProvision   Provision   @relation(fields: [targetProvisionId], references: [id])

  operationType   OperationType
  sourceReference String        // "Pasal I angka 2 UU 19/2016"
  
  previousContent String?       @db.Text
  newContent      String?       @db.Text
  
  orderInSet      Int

  @@map("change_operations")
}

// -------------------------------------------------------------
// 4. NASKAH KONSOLIDASI RESMI (SNAPSHOT PUBLIKASI)
// -------------------------------------------------------------

model Publication {
  id                String          @id @default(cuid())
  legalInstrumentId String
  legalInstrument   LegalInstrument @relation(fields: [legalInstrumentId], references: [id], onDelete: Cascade)

  versionName       String          // "Naskah Konsolidasi Pasca UU 1/2024"
  asOfDate          DateTime        // Tanggal snapshot berlaku
  snapshotJson      Json            // Pohon utuh dokumen JSON konsolidasi
  
  isCurrentActive   Boolean         @default(false)
  generatedAt       DateTime        @default(now())

  @@map("publications")
}

// -------------------------------------------------------------
// 5. ANOTASI YUDISIAL (PUTUSAN MAHKAMAH KONSTITUSI & MA)
// -------------------------------------------------------------

enum CourtType {
  MK
  MA
}

enum RulingEffect {
  BATAL_SELURUHNYA
  INKONSTITUSIONAL_BERSYARAT // Conditionally Unconstitutional
  KONSTITUSIONAL_BERSYARAT   // Conditionally Constitutional
  TIDAK_DITERIMA_NO
  DITOLAK
}

model JudicialAnnotation {
  id              String        @id @default(cuid())
  provisionId     String
  provision       Provision     @relation(fields: [provisionId], references: [id], onDelete: Cascade)

  court           CourtType     @default(MK)
  caseNumber      String        // Contoh: "50/PUU-VI/2008"
  rulingDate      DateTime
  effect          RulingEffect
  
  affectedPhrase  String?       // Frasa spesifik yang diuji
  ratioDecidendi  String        @db.Text // Intisari pertimbangan hakim
  rulingVerdict   String        @db.Text // Amar putusan resmi
  sourceUrl       String?       // Tautan salinan resmi putusan MKRI

  createdAt       DateTime      @default(now())

  @@map("judicial_annotations")
}

// -------------------------------------------------------------
// 6. REVIEW LOGS & AUDIT TRAIL
// -------------------------------------------------------------

model ReviewRecord {
  id          String    @id @default(cuid())
  changeSetId String
  changeSet   ChangeSet @relation(fields: [changeSetId], references: [id])

  reviewerName String   // Dosen / Kurator Hukum
  reviewerRole String   // "LEGAL_EDITOR", "FACULTY_LECTURER"
  decision    String    // "APPROVED", "CHANGES_REQUESTED"
  notes       String?   @db.Text

  createdAt   DateTime  @default(now())

  @@map("review_records")
}
```

---

## 3. ATURAN BISNIS LOGIKA HUKUM (LEGAL BUSINESS RULES UNTUK BACKEND)

Full-stack developer dilarang keras mengubah atau menyederhanakan aturan berikut, karena aturan ini mencerminkan hukum positif Indonesia:

### BR-01: Penanganan Pasal & Ayat Sisipan (Lampiran II UU 12/2011)
- Ketika undang-undang amandemen menyisipkan pasal baru di antara Pasal 27 dan Pasal 28, sistem **wajib menamakannya Pasal 27A, 27B, dst.**
- **DILARANG MENGGESER** nomor Pasal 28 menjadi Pasal 29. Penomoran asli bersifat permanen (*immutable numbering*).
- Jika ada ayat sisipan antara ayat (1) dan (2), penamaannya adalah `ayat (1a)`.

### BR-02: Prinsip Pencabutan Norma (*Repeal Invariant*)
- Pasal atau ayat yang dicabut **TIDAK BOLEH DIHAPUS DARI DATABASE**.
- Pasal tersebut tetap dirender di naskah konsolidasi dengan format:
  `Pasal 27 ayat (3): Dihapus. (Berdasarkan Pasal I angka 2 UU No. 19 Tahun 2016)`.
- Mengapa? Karena peristiwa hukum pidana/perdata yang terjadi sebelum tanggal pencabutan tetap diadili menggunakan naskah sebelum dicabut (*tempus delicti*).

### BR-03: Putusan Mahkamah Konstitusi (Inkonstitusional Bersyarat)
- Jika putusan MK bertipe `INKONSTITUSIONAL_BERSYARAT`, teks pasal **tidak boleh dihapus**, melainkan:
  1. Diberi penanda visual (*badge warning*) berwarna kuning oranye: `Tafsir Bersyarat MK`.
  2. Di bawah pasal ditampilkan kotak penjelasan:  
     *"Frasa '...' bertentangan dengan UUD 1945 sepanjang tidak dimaknai sebagai '...'. (Putusan MK No. X/PUU-Y/Z)"*.

---

## 4. ALUR LOGIKA MESIN VERSION CONTROL (DETERMINISTIC CONSOLIDATION ENGINE)

Mesin konsolidasi bekerja menggunakan algoritma *Event-Sourcing*:

```
[Versi Awal: Snapshot v0]
         │
         ▼
[Ambil semua ChangeSet yang disetujui, diurutkan ASC berdasarkan effective_from]
         │
         ▼
[Loop Setiap Operasi Amandemen]:
    ├── IF ADD_PROVISION: Sisipkan node baru ke pohon hierarki pada posisi orderIndex
    ├── IF REPLACE_PROVISION: Perbarui teks node target & tandai riwayat
    ├── IF REPEAL_PROVISION: Beri teks "Dihapus" & kunci status tidak aktif
    └── IF JUDICIAL_OVERRIDE: Pasang relasi JudicialAnnotation ke node target
         │
         ▼
[Generate Immutable Publication Snapshot (JSON)]
         │
         ▼
[Render ke Antarmuka Pengguna & Simpan di Cache Redis/PostgreSQL]
```

### Kode Inti Algoritma Konsolidasi (`versionEngine.ts`):
```typescript
export interface ConsolidatedNode {
  canonicalPath: string;
  label: string;
  type: string;
  content: string;
  isRepealed: boolean;
  activeAmendmentSource?: string;
  judicialNotes?: Array<{
    caseNumber: string;
    verdict: string;
    effect: string;
  }>;
  children: ConsolidatedNode[];
}

export function applyAmendingOperation(
  tree: Map<string, ConsolidatedNode>,
  op: ChangeOperation
): void {
  const target = tree.get(op.targetProvisionCanonicalPath);
  
  switch (op.operationType) {
    case 'REPLACE_PROVISION':
      if (target) {
        target.content = op.newContent!;
        target.activeAmendmentSource = op.sourceReference;
      }
      break;
      
    case 'ADD_PROVISION':
      tree.set(op.targetProvisionCanonicalPath, {
        canonicalPath: op.targetProvisionCanonicalPath,
        label: op.label,
        type: op.provisionType,
        content: op.newContent!,
        isRepealed: false,
        activeAmendmentSource: op.sourceReference,
        children: []
      });
      break;
      
    case 'REPEAL_PROVISION':
      if (target) {
        target.isRepealed = true;
        target.content = `Dihapus. (${op.sourceReference})`;
      }
      break;
  }
}
```

---

## 5. SPESIFIKASI FRONTEND (NEXT.JS 15 & USER EXPERIENCE)

Antarmuka pengguna difokuskan untuk kenyamanan membaca civitas akademika Fakultas Hukum:

### 5.1 Legal Reader View (`/reader/[instrumentId]`)
- **Panel Kiri (Hierarchical Sidebar):** Daftar isi interaktif (BAB I, BAB II, Pasal 1, dst.) yang langsung melakukan *smooth-scroll* ke pasal terkait.
- **Panel Tengah (Reading Canvas):**
  - Teks naskah konsolidasi dengan font serif ramah baca (*Merriweather* / *Newsreader*).
  - Penanda lencana (*Badges*): `[BERLAKU]`, `[DIUBAH UU 1/2024]`, `[PUTUSAN MK NO. 50/2008]`.
- **Panel Kanan (Contextual Inspector):**
  - Mengklik satu pasal membuka panel kanan: menampilkan riwayat amandemen pasal tersebut dari tahun ke tahun, naskah aslinya, serta tombol **"Buka AI Socratic Tutor"**.

### 5.2 Side-by-Side Diff Viewer (`/compare?instrumentId=...&v1=2008&v2=2024`)
- Dua kolom berdampingan: Kolom Kiri (Versi Lama) vs Kolom Kanan (Versi Baru).
- Menggunakan pustaka *diff* kata (*character/word-level diff*):
  - Warna merah latar belakang: Frasa yang dihapus oleh undang-undang pengubah.
  - Warna hijau latar belakang: Frasa yang ditambahkan.

---

## 6. SPESIFIKASI MODUL AI LEGAL REASONING (SOCRATIC TUTOR)

AI ini **BUKAN CHATBOT GENERIK**. Backend Next.js Route Handler wajib menginjeksi *system prompt* metodologis hukum:

### 6.1 Prompt Boundary & Guardrail
```typescript
export const LEGAL_SOCRATIC_PROMPT = `
Anda adalah Claudia, Asisten AI Penalaran Hukum Fakultas Hukum.
Tugas Anda: Membimbing mahasiswa membedah norma hukum menggunakan metode Sokrates (tanya jawab kritis), bukan memberi jawaban jadi.

ATURAN WAJIB:
1. Grounding Mutlak: Rujuk HANYA pada teks pasal resmi yang dilampirkan dalam konteks. Dilarang mengarang nomor pasal atau isi undang-undang.
2. Metodologi Dekomposisi Moeljatno:
   - Pecah kasus menjadi: Subjek Hukum, Unsur Objektif (Perbuatan & Akibat), Unsur Subjektif (Kesengajaan/Kelalaian), dan Melawan Hukum.
3. Tanya Balik Pemantik:
   - Jika mahasiswa bertanya: "Apakah si A bisa dipidana?", JANGAN jawab "Bisa" atau "Tidak".
   - Jawablah dengan menguraikan unsur pasal, lalu tantang mahasiswa: "Berdasarkan kronologi, apakah unsur 'dengan sengaja dan tanpa hak' telah terpenuhi oleh alat bukti yang ada? Bagaimana pembuktiannya di persidangan?"
4. Sitasi Resmi: Tulis rujukan perundang-undangan lengkap dengan nomor Lembaran Negara.
`;
```

---

## 7. DATA PILOT AWAL (PENGUJIAN FASE 1: KELUARGA UU ITE)

Untuk membuktikan seluruh sistem berjalan tanpa bug, developer wajib mengisi data uji pertama dengan **Keluarga UU ITE**:
1. **Peraturan Induk:** UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (LN 2008 No. 58, TLN 4843).
2. **Perubahan Pertama:** UU No. 19 Tahun 2016 (LN 2016 No. 251, TLN 5952).
   - *Kasus Uji:* Pasal 27 ayat (3) diubah ancaman pidananya dari 6 tahun menjadi 4 tahun (delik aduan).
3. **Perubahan Kedua:** UU No. 1 Tahun 2024 (LN 2024 No. 8, TLN 6916).
   - *Kasus Uji:* Penyisipan Pasal 27A dan Pasal 27B (tindak pidana menyerang kehormatan dan ancaman pemerasan elektronik).
4. **Putusan Mahkamah Konstitusi:** Putusan MK No. 50/PUU-VI/2008 terkait pengujian Pasal 27 ayat (3).

Jika mesin konsolidasi sukses menggabungkan ketiga undang-undang dan satu putusan MK ini dengan hasil 100% akurat terhadap naskah konsolidasi pemerintah, **maka sistem dinyatakan lulus uji kelayakan produksi**.

---

## 8. PETUNJUK INSTALASI & PERINTAH LOKAL PENGEMBANG

Berikut urutan perintah terminal yang harus dijalankan developer di laptop:

```bash
# 1. Masuk ke direktori
cd E:\Platfrom_Hukum

# 2. Inisialisasi Project Next.js 15 (App Router, TypeScript, Tailwind CSS, Lucide)
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 3. Masuk ke folder web & instal dependensi data
cd web
npm install @prisma/client diff lucide-react clsx tailwind-merge
npm install prisma --save-dev

# 4. Inisialisasi Prisma (Default SQLite untuk kemudahan lokal tanpa Docker)
npx prisma init --datasource-provider sqlite

# 5. Salin skema model ke prisma/schema.prisma
# 6. Jalankan migrasi database
npx prisma migrate dev --name init_legal_schema

# 7. Jalankan server pengembang
npm run dev
```

---

*Laporan ini menjadi acuan tunggal dan sah bagi tim developer untuk mengeksekusi proyek platform hukum tanpa kebingungan teknis maupun kekeliruan domain hukum.*
