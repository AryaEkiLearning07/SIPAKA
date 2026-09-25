# PANDUAN TEKNIS LENGKAP: PENERAPAN AI MODEL LOKAL (SLM) UNTUK PLATFORM HUKUM
**Spesifikasi Arsitektur Small Language Models (SLM), RAG Pipeline, & Implementasi Lokal Bebas Biaya**

*Kode Proyek:* LexVera / JurisLab  
*Lokasi File:* `E:/Platfrom_Hukum/LOCAL_AI_TECHNICAL_GUIDE.md`  
*Target Pembaca:* Fullstack Developer, AI Engineer, & Pemilik Proyek  
*Status:* Dokumen Panduan Teknis Eksekusi AI (Ready to Implement)

---

## 1. MENGAPA PILIHAN MODEL LOKAL KECIL (SLM) SANGAT TEPAT?

Banyak orang mengira AI hukum butuh model raksasa (70 Miliar s.d. 400 Miliar parameter) yang butuh server mahal. **Itu anggapan keliru.**

Dalam domain hukum, kita **TIDAK INGIN** AI yang berimajinasi atau mengarang bebas. Kita ingin AI yang:
1. Menjawab **HANYA** berdasarkan pasal yang kita berikan (*Grounding*).
2. Patuh pada format baku analisis (*Legal Opinion* / Unsur Delik).
3. Cepat dan bisa berjalan di komputer/laptop standar tanpa biaya per token.

Model lokal berukuran **7 Miliar s.d. 8 Miliar parameter (7B / 8B)** seperti **Qwen 2.5 7B** atau **Llama 3.1 8B** adalah model terbaik di kelasnya saat ini:
- Sangat fasih berbahasa Indonesia formal.
- Sangat patuh pada *System Prompt* ketat (*High Instruction-Following*).
- Berjalan ringan di laptop dengan RAM 16 GB atau kartu grafis (GPU) standar 6 GB - 8 GB VRAM.

---

## 2. RAHASIA TEKNIS: JANGAN FINE-TUNE, GUNAKAN "RAG" (RETRIEVAL-AUGMENTED GENERATION)

Ada kesalahan umum pemula: *"Apakah kita harus melatih ulang (fine-tune) AI dengan seluruh undang-undang?"*  
**Jawabannya: JANGAN DILAKUKAN.**
- *Fine-tuning* mahal, butuh waktu lama, dan jika ada revisi UU baru (misal UU ITE diubah lagi), Anda harus melatih ulang model dari nol.
- AI hasil *fine-tuning* tetap rawan berhalusinasi nomor pasal.

### Cara Kerja Standar Industri: RAG (Sistem "Buku Terbuka")
Bayangkan mahasiswa ujian dengan sistem **Buka Buku (Open-Book Exam)**:
1. Mahasiswa bertanya: *"Apa unsur perbuatan di Pasal 27A UU ITE?"*
2. **Mesin Pencari Sistem (Backend):** Mencari dan mengambil teks asli Pasal 27A dari database PostgreSQL.
3. **Prompt Builder:** Menyusun contekan untuk AI:
   ```text
   Konteks Resmi dari Database:
   "Pasal 27A: Setiap Orang yang dengan sengaja menyerang kehormatan..."

   Pertanyaan Mahasiswa:
   "Uraikan unsur objektif dan subjektif pasal tersebut!"
   ```
4. **Model AI Lokal (SLM):** Membaca teks asli tersebut dan merumuskan jawabannya secara terstruktur.
5. **Hasil:** 100% akurat sesuai bunyi pasal asli, tidak pernah salah kutip nomor ayat, dan biaya komputasi sangat ringan!

---

## 3. ARSITEKTUR TEKNIS ALUR SISTEM (DATA FLOW)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ALUR PENALARAN AI LOKAL (RAG PIPELINE)                     │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Mahasiswa Mengetik Pertanyaan di Web UI Next.js:
   "Apakah menyebarkan rekaman suara tanpa izin melanggar Pasal 27 UU ITE?"
                                │
                                ▼
2. Backend (Next.js API Handler):
   Melakukan pencarian ke PostgreSQL (Full-Text Search / pgvector)
   -> Menemukan naskah konsolidasi: Pasal 27 ayat (1) dan Pasal 27A
                                │
                                ▼
3. Injeksi Konteks & Prompt Metodologis:
   Menggabungkan Teks Pasal Resmi + System Prompt Doktrin Sudikno/Moeljatno
                                │
                                ▼
4. HTTP Request ke Ollama (Model Lokal Berjalan di Background):
   POST http://localhost:11434/api/generate
   Payload: { "model": "qwen2.5:7b", "prompt": "...", "stream": true }
                                │
                                ▼
5. Streaming Response:
   Teks jawaban mengalir kata-per-kata ke layar mahasiswa layaknya ChatGPT
   dengan sitasi nomor pasal yang bisa diklik.
```

---

## 4. CARA MENJALANKAN MODEL LOKAL SECARA TEKNIS (STEP-BY-STEP)

Kita menggunakan **Ollama** ([ollama.com](https://ollama.com)), perangkat lunak open-source standar dunia untuk menjalankan LLM lokal dengan 1 baris perintah.

### Langkah 1: Instalasi Ollama di Komputer/Server
- Unduh dan instal Ollama untuk Windows dari [ollama.com/download](https://ollama.com/download).
- Setelah terinstal, Ollama akan otomatis berjalan sebagai layanan latar belakang (*background service*) di port `11434`.

### Langkah 2: Mengunduh Model AI Pilihan (7B Parameter)
Buka terminal PowerShell, jalankan salah satu perintah berikut:

```powershell
# Opsi Terbaik untuk Bahasa Indonesia & Penalaran Presisi: Qwen 2.5 7B
ollama run qwen2.5:7b

# Atau alternatif populer: Llama 3.1 8B
ollama run llama3.1:8b
```
*(Proses unduh hanya sekali, ukuran file ~4.5 GB, tersimpan di harddisk lokal).*

### Langkah 3: Menghubungkan Backend Next.js ke Ollama
Di dalam project Next.js kita, backend memanggil Ollama via HTTP request sederhana tanpa perlu library Python rumit:

```typescript
// File: src/lib/ai/ollamaClient.ts

export async function askLegalAi(provisionContext: string, userQuestion: string) {
  const prompt = `
[SYSTEM PROMPT]
Anda adalah Claudia, Asisten AI Penalaran Hukum Fakultas Hukum.
Jawablah secara kritis dan akademis hanya berdasarkan teks norma hukum berikut:

=== TEKS NORMA HUKUM RESMI ===
${provisionContext}
==============================

Pertanyaan Mahasiswa:
${userQuestion}

Format Jawaban Wajib:
1. Unsur Objektif (Perbuatan / Keadaan)
2. Unsur Subjektif (Kesengajaan / Kelalaian)
3. Penerapan Hukum pada Kasus Tersebut
`;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:7b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2, // Nilai rendah agar AI faktual & tidak mengarang
      },
    }),
  });

  const data = await response.json();
  return data.response;
}
```

---

## 5. SPESIFIKASI HARDWARE UNTUK MODEL LOKAL

Berapa spek komputer yang dibutuhkan untuk menjalankan model 7B lokal ini?

| Komponen | Spesifikasi Minimum | Spesifikasi Rekomendasi (Sangat Cepat) |
| :--- | :--- | :--- |
| **Prosesor (CPU)** | Intel Core i5 / AMD Ryzen 5 (Gen 8+) | Intel Core i7 / AMD Ryzen 7 |
| **Memori (RAM)** | 16 GB DDR4 | 16 GB - 32 GB DDR4/DDR5 |
| **Kartu Grafis (GPU)** | Tanpa GPU (Jalan di CPU, respon ~2-3 detik) | NVIDIA RTX 3060 / 4060 (VRAM 8 GB) |
| **Penyimpanan (SSD)** | 10 GB ruang kosong SSD | NVMe SSD |

*Catatan:* Jika dijalankan di laptop tanpa GPU diskrit, model 7B tetap bisa berjalan mulus menggunakan RAM biasa berkat teknologi kuantisasi 4-bit (GGUF).

---

## 6. DUAL-MODE: LOKAL OFFLINE + CLOUD FREE FALLBACK

Agar sistem fleksibel, kita membangun arsitektur **Hybrid Failover**:

```typescript
// Logika Failover Cerdas di Backend:
if (isOllamaAvailableLocally()) {
  // 1. Gunakan Model Lokal (0 Biaya, 100% Privat Offline)
  return await callOllamaModel(prompt);
} else {
  // 2. Fallback Otomatis ke Google Gemini Flash API (Gratis 1.500 req/hari)
  return await callGeminiFlashApi(prompt);
}
```

### Keuntungan Strategi Ini:
1. **Di Laptop Pengembang:** Bisa pakai Gemini Flash gratis tanpa membebani laptop jika sedang coding banyak hal.
2. **Di Server Kampus:** Pasang Ollama di PC lab kampus agar tidak perlu internet dan 100% bebas biaya selamanya.
3. **Nol Biaya:** Keduanya sama-sama **Rp 0,- (GRATIS)**.
