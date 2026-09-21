# RANCANGAN TEKNIS DETAIL — LexVera
**Platform Konsolidasi & Version Control Perundang-Undangan Indonesia**
*Dokumen desain tunggal hasil konsolidasi seluruh keputusan arsitektur. Acuan eksekusi developer.*

---

## 1. KONSEP INTI (SATU PARAGRAF)

LexVera adalah "Git untuk perundang-undangan Indonesia": setiap amandemen UU dicatat sebagai **operasi terstruktur yang disetujui manusia**, mesin deterministik merakit naskah konsolidasi pada titik waktu mana pun, dan **mesin tidak pernah menghasilkan teks sendiri** — semua teks dikutip verbatim dari sumber resmi yang diarsipkan dan di-hash.

## 2. PIPELINE DATA END-TO-END

```
[A. PENGADAAN]         [B. GERBANG MASUK]      [C. KURASI]            [D. SAJIAN]
Scraper /              QUEUE                    PANEL KURATOR          API + WEB
unduhan manual  ──►    (antre pekerjaan)  ──►   manusia menyetujui ──► reader, diff,
  │                      │                       draft operasi          timeline, silsilah
  ▼                      ▼                         │
PDF asli + metadata    PARSER                     ▼
  │                     pecah naskah →           DB TERVERIFIKASI
  ▼                     node Bab→Pasal→Ayat,     (provision + operasi
ARSIP KITA (MinIO)      usulkan operasi DRAFT      + snapshot)
(immutable + SHA-256)
```

**Aturan baja (fail-closed):**
1. Mesin tidak pernah menulis teks — hanya label status yang dirakit dari data operasi.
2. Parser hanya *mengusulkan*; hasil selalu status `DRAFT`; ambigu = karantina (flag prioritas), bukan tebakan.
3. `PUBLISHED` hanya lewat persetujuan kurator; tiap persetujuan tercatat di `review_records`.
4. AI Socratic Tutor hanya membaca naskah, tidak pernah menyunting.

## 3. DUA GUDANG PENYIMPANAN (TWO-STORE PRINCIPLE)

| Gudang | Bentuk | Fungsi | Boleh berubah? |
|---|---|---|---|
| Arsip original | PDF di object storage + SHA-256 | Bukti & verifikasi | **Tidak pernah** |
| Teks terstruktur | Database (provision + operasi) | Dibaca, di-diff, direkonstruksi | Hanya via operasi terverifikasi |

User klik "Dokumen Asli" → PDF disajikan dari arsip kita sendiri (instan) + link sumber resmi (verifikasi silang) + info hash. Link saja tidak cukup: JDIH bisa reorganisasi/hapus — arsip lokal adalah jaminan provenance.

## 4. KONSEP "KELUARGA" (UNIT KERJA)

Hirarki jenis (UUD1945 → UU → PP → … → Perda) adalah **sumbu vertikal** (klasifikasi, sudah ada di enum `InstrumentType`). Unit kerja konsolidasi adalah **keluarga = sumbu horizontal (waktu)**: satu peraturan induk + seluruh silsilah pengubahnya, lintas jenis.

```
KELUARGA UU ITE:
UU 11/2008 ◄── UU 19/2016 ◄── UU 1/2024  (+ Putusan MK 50/PUU-VI/2008)
```

- Mesin bekerja per keluarga: input = naskah induk + operasi amandemen keluarga; output = konsolidasi di tanggal mana pun.
- Ekspansi konten **per keluarga, sesuai daftar prioritas**, bukan seluruh 20.000+ peraturan sekaligus.
- Kriteria prioritas keluarga berikutnya: sering dipakai kurikulum FH, punya amandemen, PDF text-layer, ada putusan MK.

## 5. MODEL DATA (SKEMA + TAMBAHAN TAHAP INI)

Skema 4-lapisan (`schema.prisma`) **tetap**. Tambahan yang diputuskan:

| Field baru | Model | Alasan |
|---|---|---|
| `ingestMethod` (enum MANUAL_UPLOAD/SCRAPER/OFFICIAL_FEED) | `SourceDocument` | provenance asal-usul dokumen saat bercampur manual & scraping |
| `downloadedAt` | `SourceDocument` | jejak waktu pengadaan |
| `title String?` | `Provision` | judul bab/pasal ("PERBUATAN YANG DILARANG") — dipakai UI, selama ini hilang dari skema |
| `newNodeJson Json?` | `ChangeOperation` | payload lengkap node baru untuk `ADD_PROVISION` (label/type/orderIndex/children) |

**Backlog (belum sekarang):** `provision_references` (peta rujukan antar pasal untuk peta dampak), model `User` + role (Tahap 4), `Putusan MK` sudah tercakup `JudicialAnnotation`.

**Aturan penyimpanan operasi ADD:** row `Provision` untuk node sisipan (mis. `pasal-27a`) **dibuat sejak seed** (canonicalPath final), sehingga FK `ChangeOperation.targetProvisionId` selalu valid; kontennya tinggal di `ProvisionRevision` yang terhubung ChangeSet — mesin konsolidasi tetap menganggapnya "belum ada" sebelum tanggal efektif.

## 6. SPESIFIKASI API (v1) — SEMUA DATA DARI DATABASE

| Endpoint | Fungsi |
|---|---|
| `GET /api/v1/health` | status service + koneksi DB + jumlah instrument |
| `GET /api/v1/instruments` | daftar keluarga + timeline tersedia |
| `GET /api/v1/instruments/:slug` | metadata + daftar amandemen |
| `GET /api/v1/instruments/:slug/snapshot?year=\|date=` | rekonstruksi point-in-time via `LawReconstructor` |
| `GET /api/v1/instruments/:slug/tree?year=` | daftar isi hierarki saja |
| `GET /api/v1/provisions/diff?path=&fromYear=&toYear=` | diff kata per node (LCS `LegalDiffGenerator`) |

Error contract: DB mati/kosong → `503 { error: "DATABASE_UNAVAILABLE"|"DATABASE_EMPTY", hint }`. Frontend wajib menampilkan banner, bukan data palsu.

## 7. FORMAT DATA MASUK (SEED YAML — TARGET TAHAP 2)

Struktur folder arsip ingestion (sumber kebenaran reviewable di Git):

```
packages/database/seed/
├── manifest.csv            # provenance: file, url_sumber, sha256, tanggal_unduh, ingest_method, LN/TLN
├── pdfs/                   # arsip PDF resmi (immutable, di-hash)
└── structured/
    ├── <slug>.yaml         # naskah penuh terstruktur (node tree)
    └── <slug>-<tahun>.ops.yaml  # operasi amandemen (REPLACE/ADD/REPEAL/…)
```

Sketsa YAML naskah:

```yaml
instrument: { slug: uu-11-2008, type: UU, number: 11, year: 2008, title: "Informasi dan Transaksi Elektronik" }
promulgatedAt: 2008-04-21
nodes:
  - label: BAB VI
    title: PERBUATAN YANG DILARANG
    type: BAB
    children:
      - label: Pasal 26
        type: PASAL
        title: Perlindungan Data Pribadi
        children:
          - label: Ayat (1)
            type: AYAT
            content: "Kecuali ditentukan lain oleh Peraturan Perundang-undangan, ..."
```

Sketsa YAML operasi:

```yaml
amendingInstrument: uu-19-2016
targetInstrument: uu-11-2008
effectiveFrom: 2016-11-28
operations:
  - operationType: REPLACE_PROVISION
    targetCanonicalPath: uu-11-2008/pasal-27/ayat-3
    sourceReference: "Pasal I angka 4 UU No. 19 Tahun 2016"
    newContent: "..."
  - operationType: ADD_PROVISION
    parentCanonicalPath: uu-11-2008/pasal-27
    targetCanonicalPath: uu-11-2008/pasal-27a
    newNode: { label: Pasal 27A, type: PASAL, content: "..." }
```

Catatan eksekusi: sampai naskah utuh selesai diketik (Tahap 2), seeder memuat dataset pilot dari `@lexvera/legal-engine` (satu sumber kebenaran yang sudah teruji golden test). YAML menjadi format wajib untuk naskah penuh — reviewable, diffable, dual-control di Git.

## 8. PANEL KURATOR (DUAL-PANE PER-NODE) — SPESIFIKASI UI

```
┌──────────────────────────────┬───────────────────────────────────┐
│ 📄 PDF ASLI (arsip)          │ ⚙️ HASIL PARSER (draft)            │
│ scroll sinkron + lompat      │ ☑ node   [VERIFIED]               │
│ halaman per node             │ ☐ node   [DRAFT ◄]                │
└──────────────────────────────┴───────────────────────────────────┘
```

- Status per node **wajib**: `DRAFT → VERIFIED / EDITED / REJECTED`; publish diblokir sampai semua node selesai. Eyeball scroll bukan bukti — sign-off per node adalah.
- Mesin menyeleksi dulu: PDF ber-text-layer dibandingkan otomatis (karakter-per-karakter) → centang `AUTO_VERIFIED`; kurator fokus manual hanya pada mismatch & hasil scan/OCR.
- Mismatch di-highlight merah di kedua panel; navigasi keyboard (J/K/V/E).
- Dual control: approver ≠ editor. Semua tercatat `review_records`.

## 9. RENCANA EKSEKUSI (6 TAHAP) + STATUS

| Tahap | Isi | Status |
|---|---|---|
| 0 | git init, README, .env.example | **selesai (commit awal)** |
| 1 | Rantai end-to-end: migrate → seeder → API dari DB → web fetch API | **dikerjakan sekarang** |
| 2 | Naskah UU ITE utuh (YAML, dual control), operasi `RENUMBER`+`JUDICIAL_OVERRIDE`, lapisan Penjelasan, golden test penuh | berikutnya |
| 3 | Fitur pembeda: diff sxs penuh, timeline date-picker, anotasi MK, peta silsilah | Tahap 3 |
| 4 | Auth (kurator vs pembaca), panel validasi ChangeSet DRAFT→PUBLISHED | Tahap 4 |
| 5 | DevOps: Dockerfile, CI (lint+test+build), deploy staging, backup Postgres | Tahap 5 |
| 6 | Scraper (sopan: rate-limit, UA) → parser AI (usulkan, kurator setujui) → keluarga baru | Tahap 6 |

**Definition of Done Tahap 1 (hari ini):** skema ter-migrate, seeder mengisi DB dari dataset engine, seluruh endpoint API membaca DB, halaman reader web mengambil data dari API (bukan engine langsung), engine tests tetap hijau.

## 10. STRATEGI AKUISISI DATA & LEGITIMASI

1. Bangun demo 1 keluarga sempurna (UU ITE) → 2–3 keluarga tambahan status DRAFT sebagai bukti pipeline.
2. Demo ke FH: 1 keluarga emas + antrean kurasi nyata → dosen diberi peran kurator (bukan sekadar audiens).
3. Surat kampus: **kemitraan riset data dengan JDIH (BPHN/Kemenkumham) atau JDIH BPK** — targetnya izin akses data massal/MoU, bukan "API" (tidak ada API resmi publik per hari ini; akses = unduhan web/scraping).
4. Naskah peraturan negara tidak dilindungi hak cipta (Pasal 42 UU 28/2014) — publikasi & konsolidasi legal, dengan disclaimer "bukan naskah resmi" + link/hash sumber.

## 11. JAWABAN CECARAN PAKAR HUKUM (RINGKAS)

1. *Status hukum naskah?* — Alat riset non-resmi; naskah resmi tetap milik lembaga negara; tiap pasal tertaut sumber resmi + hash.
2. *Putusan MK yang mengubah makna bukan teks?* — Teks tak pernah diedit; anotasi berlapis (BR-03).
3. *Pencabutan implisit (lex posterior)?* — Sistem hanya merekam eksplisit; implisit = ranah analis, platform menampilkan data netral.
4. *Siapa menjamin akurasi?* — Rantai: parser draft → kurator manusia → golden test → provenance hash.
5. *Bedanya dengan BPHN/hukumonline?* — Mereka jual dokumen jadi; kita jual sistem rekonstruksi (time-travel, diff, silsilah, auditable).
6. *Edge cases:* perubahan Penjelasan (kasus Pasal 27 UU 19/2016), omnibus (UU Cipta Kerja), definisi berubah (Pasal 1), masa transisi (KUHP 3 tahun) — dimensi tanggal enacted/promulgated/effective dipakai nyata, bukan pajangan.
