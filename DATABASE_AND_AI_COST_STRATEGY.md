# STRATEGI EFISIENSI BIAYA DATABASE & AI (INFRASTRUCTURE & COST OPTIMIZATION)
**Panduan Solusi Penyimpanan Skala Besar & Biaya AI Murah/Gratis untuk Riset Hukum Kampus**

*Kode Proyek:* LexVera / JurisLab  
*Lokasi File:* `E:/Platfrom_Hukum/DATABASE_AND_AI_COST_STRATEGY.md`  
*Sasaran:* Lead Architect, DevOps, & Financial Planner Proyek  

---

## 1. REALITA SKALA DATA HUKUM (DATA SIZING ANALYSIS)

Kekhawatiran bahwa data hukum *"sangat besar sekali"* sebenarnya terbagi menjadi dua jenis data yang sifatnya sangat berbeda:

| Jenis Data | Sifat Data | Estimasi Ukuran Nyata | Solusi Penyimpanan Terbaik |
| :--- | :--- | :--- | :--- |
| **Teks Undang-Undang (Bab, Pasal, Ayat)** | Data Teks Relasional Bersih | **Hanya ~50 MB s.d. 300 MB** untuk SELURUH UU Indonesia sejak 1945! | PostgreSQL (Sangat ringan, muat di server kecil/laptop). |
| **Berkas PDF Resmi Lembaran Negara & Putusan** | File Binary Dokumen Tebal | **50 GB s.d. 200 GB** jika menampung puluhan ribu berkas PDF. | Object Storage Murah (Cloudflare R2 / MinIO Lokal). |
| **Vector Embeddings (Untuk Pencarian AI)** | Array Angka Float (1536 dim) | **~500 MB s.d. 2 GB** untuk seluruh pasal penting. | `pgvector` di dalam PostgreSQL yang sama. |

### Kesimpulan Fundamental:
**Database teks hukumnya sendiri SANGAT KECIL dan CEPAT.** Yang besar adalah berkas PDF-nya. Dengan memisahkan antara *teks pasal* di database dan *berkas PDF* di object storage, biaya penyimpanan database kita menjadi **hampir Rp 0,- (GRATIS)**.

---

## 2. ARSITEKTUR PENYIMPANAN: LOKAL VS CLOUD (HYBRID APPROACH)

Kita menerapkan arsitektur berjenjang yang hemat biaya namun berskala enterprise:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          HYBRID STORAGE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. LOKAL DEVELOPMENT (LAPTOP PENGEMBANG):                                       │
│    - Database: SQLite / PostgreSQL lokal (0 Rupiah).                            │
│    - PDF Storage: Folder lokal `storage/source_documents/` (0 Rupiah).          │
│    - Kapasitas: Cukup memuat Pilot Data (UU ITE & KUHP) < 100 MB.               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. PRODUKSI / SERVER KAMPUS (PRODUCTION DEPLOYMENT):                            │
│    - Database: PostgreSQL + pgvector di Server Intranet Kampus atau Cloud Neon  │
│      (Tier Gratis Neon: 0.5 GB storage, cukup untuk 50.000+ pasal teks).        │
│    - PDF Dokumen: Cloudflare R2 (Bebas Biaya Egress/Download, 10 GB gratis)     │
│      atau Harddisk Server Kampus (MinIO S3-compatible).                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mengapa Cloudflare R2 untuk File PDF?
Jika menggunakan AWS S3, biaya download file PDF oleh mahasiswa akan membengkak (*egress fee*). **Cloudflare R2 memiliki 0$ Egress Fee** (biaya download gratis tanpa batas), dan memberikan kapasitas penyimpanan gratis 10 GB pertama.

---

## 3. STRATEGI AI HEMAT BIAYA: DARI DEVELOPMENT HINGGA PRODUCTION

Membangun AI hukum tidak harus menghabiskan ratusan juta jika memahami teknik **Smart Model Routing & Small Language Models (SLM)**:

### 3.1 Mengapa AI Komersial Mahal?
Platform seperti Hukumonline menghabiskan biaya besar karena:
1. Memanggil model raksasa (GPT-4 / Claude Opus) untuk setiap kueri pencarian sepele.
2. Memasukkan seluruh isi PDF tebal ke dalam prompt (memboroskan ribuan token).

### 3.2 Solusi Cerdas Kita: 3 Tingkat Alur AI (Tiered AI Pipeline)

```
[Pengguna Bertanya: "Berapa hukuman Pasal 27 ayat 3 UU ITE?"]
                    │
                    ▼
[Langkah 1: Deterministic Lookup (0 Token / Rp 0,-)]
Sistem langsung mencari ke database teks nomor Pasal 27 ayat (3).
Hasil langsung ketemu dalam 5 milidetik TANPA memanggil AI sama sekali!
                    │
                    ▼ (Jika butuh penalaran/analisis kasus baru lanjut ke AI)
[Langkah 2: Small Local LLM / Free API (Rp 0,- s.d. Sangat Murah)]
- Model: Llama 3 8B / Qwen 2.5 7B via Ollama (Lokal Server Kampus)
- Atau: Google Gemini 2.5 Flash API (1.500 Request Gratis per Hari di Google AI Studio)
- Atau: Groq Cloud API (Super cepat ~500 token/detik, tier gratis sangat besar)
                    │
                    ▼ (Hanya jika butuh analisis skripsi/tesis dosen yang sangat rumit)
[Langkah 3: Heavy Model (Pay-per-Use)]
- Claude 3.5 Sonnet / GPT-4o hanya dipanggil atas permintaan khusus dosen.
```

---

## 4. ESTIMASI BIAYA RIIL (COST BREAKDOWN ESTIMATE)

### Tahap 1: Fase Pengembangan (Development Phase) — 100% GRATIS
*   **Database:** SQLite / PostgreSQL lokal di laptop = **Rp 0,-**
*   **Storage Dokumen:** Harddisk laptop = **Rp 0,-**
*   **AI API untuk Uji Coba:**
    - Google Gemini Flash API (Free Tier: 1.500 request/hari) = **Rp 0,-**
    - Groq Cloud API (Free Tier) = **Rp 0,-**
    - Ollama (Model Open-Source Llama 3 berjalan di laptop) = **Rp 0,-**
*   **Total Biaya Dev:** **Rp 0,- / Bulan**

### Tahap 2: Fase Produksi Awal Kampus (Pilot 500 - 2.000 Mahasiswa)
*   **Database Relasional (Neon PostgreSQL / Supabase Free Tier):** **Rp 0,-**
*   **Frontend Hosting (Vercel / Cloudflare Pages Free Tier):** **Rp 0,-**
*   **Penyimpanan PDF (Cloudflare R2 10 GB gratis):** **Rp 0,-**
*   **AI Ingestion & Reasoning:**
    - Opsi Server Kampus: Menggunakan 1 PC bekas laboratorium dengan GPU RTX 3060/4060 menjalankan Ollama lokal = **Rp 0,- biaya token selamanya**.
    - Opsi Cloud API: Gemini 2.5 Flash API jika kuota gratis terlampaui = Hanya **~$2 - $5 (Rp 30.000 - Rp 80.000 / bulan)** karena harga input token Flash sangat murah ($0.075 per 1 juta token).
*   **Total Biaya Produksi Kampus:** **< Rp 100.000 / Bulan!**

---

## 5. RANGKUMAN BAGI DEVELOPER & STAKEHOLDER

1. **Database Tidak Perlu Ditakuti:** Teks undang-undang sangat ringkas. Database PostgreSQL di server biasa mampu menampung ratusan ribu pasal tanpa kendala performa.
2. **Pisahkan Teks dari Berkas PDF:** Teks pasal masuk PostgreSQL; file fisik PDF Lembaran Negara ditaruh di Cloudflare R2 atau folder storage lokal.
3. **AI Hemat Berkat RAG Presisi:** Jangan masukkan 1 buku UU ke AI. Sistem kita hanya mengambil 1 pasal spesifik dari database, lalu menyuapkannya ke AI (*Chunking per Pasal*). Ini membuat konsumsi token sangat kecil dan hemat biaya 95%.
