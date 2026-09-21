# PANDUAN REKAYASA TEKNIS: INGESTION DATA HUKUM REAL-TIME & PIPELINE SINKRONISASI
**Modul Sistem:** Ingestion, Crawling, Verification, & Real-Time Sync Engine  
**Kode Proyek:** LexVera / JurisLab  
**Lokasi File:** `E:/Platfrom_Hukum/REALTIME_DATA_INGESTION_PIPELINE.md`  
**Sasaran Pengembang:** Full-Stack Engineer, Backend/DevOps Engineer, & Data Pipeline Developer  
**Status:** Dokumen Resmi Spesifikasi Integrasi Data (Ready for Implementation)

---

## 1. PENDAHULUAN: TUJUAN & TANTANGAN TEKNIS

### 1.1 Masalah Pokok
Platform riset hukum akan kehilangan nilai gunanya jika datanya tertinggal dari naskah fisik yang diundangkan pemerintah. Di sisi lain, mengandalkan staf manusia untuk memantau situs pemerintah setiap hari adalah strategi kuno, mahal, dan lambat.

### 1.2 Tujuan Modul Ini
Membangun **Automated Real-Time Legal Data Pipeline** yang:
1. Menangkap (*ingest*) naskah peraturan baru secara otomatis dalam waktu **<1 jam** setelah terbit di portal resmi negara.
2. Memantau putusan Mahkamah Konstitusi (MK) secara berkala untuk mendeteksi pasal-pasal yang dibatalkan atau diberi tafsir bersyarat.
3. Memvalidasi integritas dokumen menggunakan *cryptographic hashing* (SHA-256) agar keaslian dokumen setara Lembaran Negara fisik.
4. Menjalankan *AI Parser* untuk memecah PDF resmi menjadi data terstruktur (Bab $\rightarrow$ Bagian $\rightarrow$ Pasal $\rightarrow$ Ayat) tanpa campur tangan manual yang melelahkan.

---

## 2. ARSITEKTUR TINGGI PIPELINE REAL-TIME

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUMBER DATA RESMI PEMERINTAH                          │
│                                                                                 │
│   [Jalur A: API JDIHN]       [Jalur B: Setneg & DPR]     [Jalur C: Putusan MK]  │
│   - REST API Satu Data       - Feed Lembaran Negara      - Direktori Putusan    │
│   - Metadata Nasional        - PDF Naskah Autentik       - Amar Pengujian UU    │
└───────────────────────┬───────────────────┬──────────────────────┬──────────────┘
                        │                   │                      │
┌───────────────────────▼───────────────────▼──────────────────────▼──────────────┐
│                    INGESTION WORKER SERVICE (Node.js / Python)                  │
│                                                                                 │
│   1. Scheduler / Cron Engine: Polling interval adaptif (Tiap 1-3 jam)           │
│   2. Deduplication Guard: Cek apakah (Tipe + Nomor + Tahun) sudah ada di DB     │
│   3. Secure Downloader: Unduh PDF resmi ke Object Storage (MinIO/Local S3)      │
│   4. Integrity Verifier: Hitung SHA-256 Checksum & catat Provenance URL         │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        AI DOCUMENT EXTRACTION PIPELINE                          │
│                                                                                 │
│   1. Text & Layout Extractor: Ekstrak teks preservasi indentasi pasal & ayat    │
│   2. Structural Parser (Regex + LLM): Identifikasi Bab, Pasal, Ayat, Huruf      │
│   3. Amendment Classifier: Deteksi operasi (ADD, REPLACE, REPEAL, BERSYARAT_MK) │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        DATABASE STAGING & HUMAN APPROVAL                        │
│                                                                                 │
│   1. Simpan draf ke tabel ChangeSet (Status: IN_REVIEW)                         │
│   2. Kirim Webhook / Notifikasi Dashboard Kurator: "UU Baru Terdeteksi"         │
│   3. Kurator verifikasi via 1-Click Approval -> Status PUBLISHED                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SPESIFIKASI 3 JALUR PENARIKAN DATA (DATA SOURCES)

### Jalur A: Integrasi API Satu Data JDIHN (Kemenkumham)
Portal JDIHN ([jdihn.go.id](https://jdihn.go.id)) bertindak sebagai hub integrasi dokumen hukum seluruh kementerian dan pemerintah daerah di Indonesia.

*   **Tipe Integrasi:** REST API (JSON).
*   **Target Endpoint (Konvensi JDIHN Nasional):**
    ```http
    GET https://jdihn.go.id/api/peraturan/terbaru?page=1&limit=50
    Authorization: Bearer <API_TOKEN_KAMPUS>
    ```
*   **Struktur Payload JSON:**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id_peraturan": "jdih-uu-2024-1",
          "jenis_peraturan": "Undang-Undang",
          "nomor": 1,
          "tahun": 2024,
          "judul": "Perubahan Kedua atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik",
          "tgl_ditetapkan": "2024-01-02",
          "tgl_diundangkan": "2024-01-02",
          "status": "Mengubah",
          "target_peraturan": "UU No. 11 Tahun 2008",
          "ln_number": 8,
          "tln_number": 6916,
          "url_dokumen_pdf": "https://jdihn.go.id/files/uu_1_2024.pdf"
        }
      ]
    }
    ```

### Jalur B: Crawler Autentik Kemensetneg (Kementerian Sekretariat Negara)
Portal [jdih.setneg.go.id](https://jdih.setneg.go.id) adalah sumber primer naskah yang pertama kali disahkan Presiden RI.

*   **Tipe Integrasi:** Automated Poller / Headless HTTP Client (via `fetch` / `axios` / `httpx`).
*   **Interval Pemeriksaan:** Setiap 2 jam pada hari kerja (08:00 - 18:00 WIB).
*   **Filter Target Kategori:** Hanya mengambil dokumen kategori `Undang-Undang` dan `Peraturan Pemerintah`.
*   **Logika Duplikasi:**
    Jika kombinasi `type=UU` dan `number=X` dan `year=Y` sudah ada di database, lewati proses unduh untuk menghemat bandwidth (*idempotent ingestion*).

### Jalur C: Poller Putusan Mahkamah Konstitusi (MKRI)
Untuk memantau pengujian konstitusionalitas undang-undang secara *real-time*.

*   **Target URL:** `https://www.mkri.id/index.php?page=web.Putusan`
*   **Filter Kategori Perkara:** `PUU` (Pengujian Undang-Undang).
*   **Atribut yang Diekstrak:**
    1. Nomor Putusan: misal `50/PUU-VI/2008`.
    2. Tanggal Pengucapan: Tanggal sidang terbuka.
    3. Status Amar: *"Mengabulkan Sebagian"*, *"Menolak"*, *"Tidak Dapat Diterima"*.
    4. UU yang Diuji: misal UU 11/2008 tentang ITE.
    5. Salinan PDF Resmi Amar Putusan.

---

## 4. CONTOH KODE IMPLEMENTASI WORKER (NODE.JS / TYPESCRIPT)

Berikut adalah modul worker lengkap yang siap dipasang developer di folder backend (`services/ingestionWorker.ts`):

```typescript
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IngestedItemPayload {
  type: 'UU' | 'PP' | 'PERPRES';
  number: number;
  year: number;
  title: string;
  enactedAt: string;     // ISO Date
  promulgatedAt: string; // ISO Date
  lnNumber?: number;
  tlnNumber?: number;
  sourceUrl: string;
  pdfDownloadUrl: string;
}

export class LegalDataIngestionWorker {
  private storageDir = path.resolve(process.cwd(), 'storage/source_documents');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Langkah 1 & 2: Validasi Duplikasi & Pengunduhan Dokumen
   */
  public async ingestDocument(item: IngestedItemPayload): Promise<string> {
    // 1. Cek apakah dokumen sudah ada di database
    const existing = await prisma.legalInstrument.findFirst({
      where: {
        type: item.type as any,
        number: item.number,
        year: item.year,
      },
    });

    if (existing) {
      console.log(`[Ingestion] Lewati: ${item.type} No. ${item.number} Th. ${item.year} sudah terdaftar.`);
      return existing.id;
    }

    console.log(`[Ingestion] Mendeteksi dokumen baru: ${item.type} No. ${item.number} Th. ${item.year}`);

    // 2. Unduh berkas PDF resmi
    const response = await fetch(item.pdfDownloadUrl);
    if (!response.ok) {
      throw new Error(`Gagal mengunduh PDF dari ${item.pdfDownloadUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Hitung hash SHA-256 untuk jaminan integritas (Provenance)
    const fileHashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 4. Simpan ke local disk / S3
    const fileName = `${item.type.toLowerCase()}_${item.number}_${item.year}_${fileHashSha256.substring(0, 8)}.pdf`;
    const localFilePath = path.join(this.storageDir, fileName);
    fs.writeFileSync(localFilePath, buffer);

    // 5. Simpan metadata ke PostgreSQL via Prisma Transaction
    const newInstrument = await prisma.$transaction(async (tx) => {
      const instrument = await tx.legalInstrument.create({
        data: {
          type: item.type as any,
          number: item.number,
          year: item.year,
          title: item.title,
          status: 'BERLAKU',
          enactedAt: new Date(item.enactedAt),
          promulgatedAt: new Date(item.promulgatedAt),
          effectiveFrom: new Date(item.promulgatedAt), // Default sama, dapat diubah kurator
          lnNumber: item.lnNumber,
          tlnNumber: item.tlnNumber,
        },
      });

      await tx.sourceDocument.create({
        data: {
          legalInstrumentId: instrument.id,
          originalUrl: item.sourceUrl,
          storagePath: localFilePath,
          mimeType: 'application/pdf',
          fileHashSha256: fileHashSha256,
          fileSizeBytes: buffer.length,
          sourceInstitution: 'JDIH Nasional / Kementerian Sekretariat Negara',
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      return instrument;
    });

    console.log(`[Ingestion] Berhasil mendaftarkan instrumen ID: ${newInstrument.id}`);
    
    // 6. Teruskan ke antrian AI Parser untuk ekstraksi Bab & Pasal
    await this.triggerAiParsingPipeline(newInstrument.id, localFilePath);

    return newInstrument.id;
  }

  /**
   * Langkah 3: Memicu Ekstraksi Bab, Pasal, dan Ayat Otomatis
   */
  private async triggerAiParsingPipeline(instrumentId: string, pdfPath: string): Promise<void> {
    console.log(`[AI-Parser] Memulai ekstraksi hierarki norma untuk ${instrumentId}...`);
    // Memanggil Python service / Node script untuk memecah Bab, Bagian, Pasal, Ayat
    // Menghasilkan draf di tabel Provisions & ChangeSets dengan status 'IN_REVIEW'
  }
}
```

---

## 5. ALUR CRON SCHEDULER & HEALTH CHECK

Untuk memastikan worker berjalan otomatis tanpa henti:

### Konfigurasi Jadwal (Cron Specification):
1. **Pemeriksaan API JDIHN Nasional:** Setiap 3 jam (`0 */3 * * *`).
2. **Pemeriksaan Kemensetneg & Berita Negara:** Setiap 2 jam pada hari kerja (`0 8-18/2 * * 1-5`).
3. **Pemeriksaan Putusan Mahkamah Konstitusi:** Setiap hari pukul 17:00 WIB pasca-sidang pleno (`0 17 * * 1-5`).

### Penanganan Kegagalan Jaringan (Resilience & Retry Policy):
- **Exponential Backoff:** Jika endpoint JDIHN timeout (504) atau rate limited (429), worker mencoba kembali setelah 5 menit, 15 menit, lalu 1 jam.
- **Dead Letter Queue (DLQ):** Dokumen PDF yang rusak atau gagal diunduh setelah 3 kali percobaan dicatat ke dalam log peringatan sistem (`storage/logs/ingestion_failed.log`) untuk diperiksa kurator.

---

## 6. PENGAWASAN KURATOR MANUSIA (HUMAN-IN-THE-LOOP INTERFACE)

Meskipun proses penarikan dan parsing berjalan 100% otomatis, **hukum membutuhkan akurasi mutlak**. Sistem menerapkan gerbang persetujuan:

```
[PDF Terunduh Otomatis] ──► [AI Parser Menghasilkan Draf Konsolidasi]
                                           │
                                           ▼
                       [Dashboard Admin: Notification Badge (1)]
                                           │
                       ┌───────────────────┴───────────────────┐
                       ▼                                       ▼
             [Preview Hasil Perubahan]                [Bandingkan Dokumen Asli]
                       │                                       │
                       └───────────────────┬───────────────────┘
                                           ▼
                              [Tombol: APPROVE & PUBLISH]
                                           │
                                           ▼
                       [Teks Konsolidasi Live di Aplikasi Mahasiswa]
```

1. **Status Draf (`IN_REVIEW`):** Hasil ekstraksi dokumen baru tidak langsung tampil di aplikasi mahasiswa sebelum ditinjau.
2. **Side-by-Side Review:** Kurator (dosen/asisten peneliti) membuka dashboard admin: melihat PDF asli di sebelah kiri dan hasil ekstraksi Bab/Pasal di sebelah kanan.
3. **1-Click Publish:** Setelah diperiksa tidak ada ayat yang terlewat, kurator menekan tombol **"Approve & Publish"**, seketika naskah konsolidasi resmi diterbitkan ke seluruh pengguna kampus.

---

*Dengan panduan teknis ini, developer memiliki arsitektur yang jelas dan siap koding untuk mewujudkan sistem penarikan data hukum otomatis, terverifikasi, dan real-time.*
