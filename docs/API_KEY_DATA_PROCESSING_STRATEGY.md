# STRATEGI PENGOLAHAN DATA API SATU DATA JDIHN & ARSITEKTUR SINKRONISASI
**Panduan Pemrosesan Data Pasca-Penerimaan API Key Resmi dari BPHN Kemenkumham**

*Kode Proyek:* LexVera / JurisLab  
*Lokasi File:* `E:/Platfrom_Hukum/API_KEY_DATA_PROCESSING_STRATEGY.md`  
*Target:* Backend Developer & Data Engineer  
*Status:* Dokumen Spesifikasi Pasca-Lisensi Resmi  

---

## 1. PENERIMAAN KREDENSIAL API RESMI

Ketika Fakultas Hukum telah memperoleh persetujuan resmi dari BPHN Kemenkumham, sistem akan menerima:
- `API_BASE_URL`: `https://jdihn.go.id/api/v1/`
- `API_CLIENT_ID`: ID registrasi institusi universitas
- `API_SECRET_KEY`: Kunci kriptografi penandatanganan request

Kredensial ini disimpan aman di `.env` server dan tidak boleh di-commit ke Git:
```env
JDIHN_API_BASE_URL="https://jdihn.go.id/api/v1"
JDIHN_API_CLIENT_ID="fh-univ-prod-001"
JDIHN_API_SECRET_KEY="sk_live_jdihn_..."
```

---

## 2. ARSITEKTUR PENGOLAHAN 5 TAHAP (ETL PIPELINE)

Setelah API Key aktif, bagaimana cara sistem mengolah ribuan data yang masuk tanpa membebani server?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALUR PENGOLAHAN DATA API JDIHN RESMI                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. TAHAP INVENTARISASI (METADATA POLLING)                                       │
│    -> Memanggil GET /peraturan/sync?since={last_timestamp}                      │
│    -> Menerima daftar metadata: nomor, tahun, status (mengubah/mencabut), URL   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. TAHAP QUEUEING & RATE LIMIT HANDLING (REDIS / BULLMQ)                        │
│    -> Menempatkan daftar dokumen baru ke dalam Antrean Unduh (Download Queue)   │
│    -> Membatasi maksimal 2 unduhan per detik agar tidak membebani server BPHN   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. TAHAP PENGUNDUHAN & HASHING                                                  │
│    -> Mengunduh berkas PDF resmi Lembaran Negara                                │
│    -> Menghitung hash SHA-256 dan menyimpannya ke tabel source_documents        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 4. TAHAP PARSING DETERMINISTIK (ZERO-LOSS ENGINE)                               │
│    -> Menjalankan LegalDocumentParser pada PDF yang baru terunduh               │
│    -> Memecah struktur menjadi node Bab, Bagian, Pasal, dan Ayat                │
│    -> Memetakan operasi perubahan jika dokumen berstatus "Mengubah"             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 5. TAHAP STAGING & NOTIFIKASI KURATOR                                           │
│    -> Menyimpan draf konsolidasi naskah ke database                             │
│    -> Menampilkan kartu notifikasi di dashboard dosen/kurator hukum             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PENANGANAN SKALA DATA BESAR (BATCH VS INCREMENTAL)

Sistem membedakan 2 mode penarikan data:

### A. Initial Bulk Ingestion (Inisialisasi Pertama)
- Hanya dilakukan sekali di awal untuk mengimpor seluruh undang-undang penting (KUHP, KUHPerdata, UU Ketenagakerjaan, UU ITE, dll.).
- Dilakukan per klaster hukum agar database tetap terorganisir rapi.

### B. Delta Sync (Sinkronisasi Harian Berjalan)
- Worker berjalan otomatis setiap hari pukul 02:00 WIB (saat trafik internet sepi).
- Hanya meminta perubahan data yang terbit dalam 24 jam terakhir menggunakan parameter `?updated_since=...`.
- Efisiensi: Waktu proses kurang dari 2 menit dan konsumsi data sangat hemat.
