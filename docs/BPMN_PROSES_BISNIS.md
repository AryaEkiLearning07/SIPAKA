# DOKUMENTASI LENGKAP PROSES BISNIS (BPMN 2.0) — SIPAKA (LEXVERA)
**Platform Version Control & Konsolidasi Perundang-Undangan Indonesia**  
**Standar Kepatuhan:** BPMN 2.0 & ISO 9001:2015 Klausul 7.5.3 (Control of Documented Information)

---

## 1. File Viewer Interaktif Langsung
Untuk melihat seluruh diagram interaktif yang dirender otomatis dengan tab navigasi, cukup buka file berikut di peramban web (*browser*):
👉 [`BPMN_INTERAKTIF_SIPAKA.html`](./BPMN_INTERAKTIF_SIPAKA.html)

---

## 2. BPMN 1: Pipeline Ingesti Data Regulasi & Parsing AST Otomatis

Proses ini menangani deteksi dokumen dari portal resmi (JDIHN/BPK/Setneg/MKRI) hingga pembentukan struktur pohon regulasi (*Abstract Syntax Tree*).

```mermaid
flowchart TD
    StartCron(["Timer Event: Scheduler Tiap 1-3 Jam"]) --> FetchIndex["Service Task: Ambil Katalog & Metadata JDIHN / Setneg"]
    FetchIndex --> CheckDup{"Exclusive Gateway: Regulasi Sudah Ada di DB?"}
    
    CheckDup -- "Ya (Duplikat)" --> EndSkip(["End Event: Skip & Catat Log"])
    CheckDup -- "Belum Ada" --> DownloadPDF["Service Task: Unduh PDF Resmi"]
    
    DownloadPDF --> ForkIngest{"Parallel Gateway (+)"}
    
    ForkIngest --> HashStore["Service Task: Hitung SHA-256 Checksum & Simpan ke MinIO Storage"]
    ForkIngest --> LayoutExtract["Service Task: Ekstraksi Teks & Indentasi (PyMuPDF / OCR)"]
    
    HashStore --> JoinIngest{"Parallel Gateway (+)"}
    LayoutExtract --> JoinIngest
    
    JoinIngest --> ASTParse["Service Task: Structural Parser (Bab, Bagian, Pasal, Ayat, Huruf)"]
    ASTParse --> EvalScore["Business Rule Task: Hitung Skor Kepatuhan & Sekuensial Pasal"]
    
    EvalScore --> ScoreCheck{"Exclusive Gateway: Skor Parser >= 70 & Tanpa Ambiguitas?"}
    
    ScoreCheck -- "Gagal / Anomali" --> QuarantineState["Service Task: Masukkan ke Tabel Karantina (Status: QUARANTINED)"]
    QuarantineState --> AlertAdmin["Service Task: Kirim Notifikasi Anomali ke Dashboard Admin"]
    AlertAdmin --> EndQuarantine(["End Event: Menunggu Intervensi Manual"])
    
    ScoreCheck -- "Lolos" --> ClassifyOp["Service Task: Klasifikasi Operasi Amandemen (ADD, REPLACE, REPEAL)"]
    ClassifyOp --> CreateDraft["Service Task: Tulis ke Database (ChangeSet Status: DRAFT_IN_REVIEW)"]
    CreateDraft --> EndDraftReady(["End Event: Draf Amandemen Siap Dikurasi"])
```

---

## 3. BPMN 2: Kurasi Human-in-the-Loop & Approval Gate (ISO 7.5.3)

Menjamin prinsip *fail-closed*: **mesin tidak pernah menerbitkan teks regulasi secara otonom tanpa verifikasi legal drafter**.

```mermaid
flowchart TD
    StartReview(["Start Event: Kurator Membuka Menu Persetujuan Naskah"]) --> LoadInspector["User Task: Inspeksi Naskah Side-by-Side (PDF Asli vs AST Draf)"]
    LoadInspector --> ValidateOperation["User Task: Uji Operasi Pasal (ADD / REPLACE / REPEAL / Sisipan)"]
    
    ValidateOperation --> DecisionGateway{"Exclusive Gateway: Keputusan Kurator Hukum"}
    
    DecisionGateway -- "Ada Ketidaksesuaian Ringan" --> ManualEdit["User Task: Koreksi Formulasi Teks / Posisi Node di Editor"]
    ManualEdit --> ValidateOperation
    
    DecisionGateway -- "Cacat Naskah / Format Rusak" --> RejectAction["User Task: Tolak Naskah & Tulis Alasan Penolakan"]
    RejectAction --> ArchiveRejected["Service Task: Ubah Status Draf ke REJECTED & Arsipkan Jejak"]
    ArchiveRejected --> EndRejected(["End Event: Draf Ditolak"])
    
    DecisionGateway -- "Valid & Sesuai 100%" --> SignApproval["User Task: Beri Tanda Tangan Verifikasi & Catatan Review"]
    SignApproval --> AuditLogEntry["Service Task: Catat Auditor, Timestamp, & Hash ke `review_records`"]
    AuditLogEntry --> PromotePublished["Service Task: Mutasi Status ChangeSet menjadi PUBLISHED"]
    PromotePublished --> InvalidateCache["Service Task: Invalidate Redis Cache & Picu Build Index"]
    InvalidateCache --> EndApproved(["End Event: Peraturan Resmi Aktif & Tersedia"])
```

---

## 4. BPMN 3: Mesin Rekonstruksi Konsolidasi Deterministik (*Point-in-Time*)

Proses internal mesin konsolidasi saat menyusun naskah konsolidasi pada tanggal historis tertentu.

```mermaid
flowchart LR
    StartQuery(["Start Event: Request Naskah (slug, Target Date)"]) --> CheckCache{"Exclusive Gateway: Snapshot Tersedia di Redis?"}
    
    CheckCache -- "Hit (Ada)" --> ServeCache["Service Task: Ambil Snapshot Terkompresi"]
    ServeCache --> ReturnResponse(["End Event: Kirim JSON Naskah"])
    
    CheckCache -- "Miss (Belum)" --> FetchBase["Service Task: Ambil Pohon Regulasi Induk dari Database"]
    FetchBase --> FetchOps["Service Task: Kueri Seluruh ChangeOperation Efektif <= Target Date"]
    
    FetchOps --> LoopOps["Sub-Process: Iterasi Rantai Operasi Kronologis (Ascending)"]
    
    subgraph LoopOps [Eksekusi Mutasi Deterministik]
        ApplyAdd["Operasi ADD: Sisipkan Node Baru pada Posisi Fraksional"]
        ApplyReplace["Operasi REPLACE: Mutasi Teks Pasal & Arsipkan Versi Lama"]
        ApplyRepeal["Operasi REPEAL: Beri Flag Dicabut & Nonaktifkan Kekuatan Mengikat"]
        ApplyMK["Operasi BERSYARAT_MK: Tempelkan Anotasi Hermeneutika Putusan MK"]
    end
    
    LoopOps --> BuildTree["Service Task: Rekonstruksi Pohon Konsolidasi Final"]
    BuildTree --> SaveCache["Service Task: Simpan Snapshot Hasil Rekonstruksi ke Cache"]
    SaveCache --> ReturnResponse
```

---

## 5. BPMN 4: Interaksi Peneliti Hukum & Visual Diff Inspector

Alur interaksi pengguna pada frontend Next.js untuk navigasi linimasa dan perbandingan hukum.

```mermaid
flowchart TD
    StartUser(["Start Event: Peneliti Mengakses Platform SIPAKA"]) --> SearchCatalog["User Task: Cari Regulasi via Kata Kunci / Nomor / Judul"]
    SearchCatalog --> SelectFamily["User Task: Pilih Keluarga Peraturan (Misal: Keluarga UU ITE)"]
    
    SelectFamily --> ViewReader["Service Task: Muat Reader Naskah Terkini"]
    ViewReader --> UserOption{"Exclusive Gateway: Aksi Peneliti Selanjutnya"}
    
    UserOption -- "Eksplorasi Linimasa" --> SelectDate["User Task: Geser Slider Linimasa ke Titik Tahun Tertentu (Misal: 2016)"]
    SelectDate --> TriggerPIT["Service Task: Request Rekonstruksi Point-in-Time ke API"]
    TriggerPIT --> ViewReader
    
    UserOption -- "Inspeksi Perubahan (Diff)" --> SelectVersions["User Task: Pilih 2 Versi untuk Dikomparasi (Tahun A vs Tahun B)"]
    SelectVersions --> ExecDiff["Service Task: Hitung Diff LCS Kata-per-Kata (LegalDiffGenerator)"]
    ExecDiff --> RenderSideBySide["User Task: Tampilkan Layar Komparasi Side-by-Side (Merah = Hapus, Hijau = Sisipan)"]
    RenderSideBySide --> InspectRationale["User Task: Buka Silsilah Perubahan & Catatan Risalah DPR / Naskah Akademik"]
    InspectRationale --> EndResearch(["End Event: Selesai / Ekspor Sitasi Hukum"])
    
    UserOption -- "Uji Otentisitas" --> ViewOriginal["User Task: Klik Tombol 'Dokumen Asli'"]
    ViewOriginal --> ServePDFStream["Service Task: Alirkan PDF Asli MinIO + Tampilkan SHA-256 + Tautan JDIHN"]
    ServePDFStream --> EndResearch
```
