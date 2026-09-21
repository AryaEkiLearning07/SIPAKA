# ARSITEKTUR ATURAN PARSING HUKUM DETERMINISTIK (ZERO-DATA-LOSS PARSER)
**Spesifikasi Rekayasa Parser Dokumen Peraturan Tanpa Distorsi Makna & Nol Kehilangan Teks**

*Kode Proyek:* LexVera / JurisLab  
*Lokasi File:* `E:/Platfrom_Hukum/PARSER_RULES_AND_ZERO_LOSS_SPEC.md`  
*Target Implementasi:* Python / TypeScript Engine  
*Status:* Dokumen Spesifikasi Rekayasa Parser Resmi  

---

## 1. PRINSIP DASAR: ZERO-DATA-LOSS INVARIANT

Dalam teks hukum pidana maupun perdata, hilangnya satu kata sambung (*"dan"*, *"atau"*) atau satu tanda baca koma dapat mengubah tafsir delik secara fatal. Oleh karena itu, parser hukum kita dibangun dengan **5 Invarian Mutlak**:

1. **Integritas Karakter Asli:** Tanda baca asli, nomor pasal, tanda kurung ayat `(1)`, huruf kecil `a.`, angka sisipan `1a.`, dan teks penjelasan wajib dipertahankan persis sesuai teks Lembaran Negara RI.
2. **Deterministic Token Boundary:** Pemecahan struktur menggunakan *State Machine* hierarkis berbatas tegas, bukan estimasi probabilitas AI generik yang rawan halusinasi.
3. **Pemisahan Teks Norma vs Teks Penjelasan:** Setiap pasal memiliki dua bidang terpisah: `content` (Batang Tubuh yang mengikat) dan `explanation` (Penjelasan otentik).
4. **Preservasi Nomor Sisipan:** Mengenali pola pasal sisipan (*Pasal 27A, 27B*) dan ayat sisipan (*ayat (1a)*) sesuai Lampiran II UU 12/2011.
5. **Verifikasi Rekonstruksi Ulang (Lossless Verification):** Hasil penggabungan seluruh potongan teks parser wajib menghasilkan kembali naskah awal dengan tingkat kesamaan karakter 100%.

---

## 2. POLA REGEX RESMI STRUKTUR PERUNDANG-UNDANGAN INDONESIA

Parser bekerja menggunakan pola ekspresi reguler (*Regular Expressions*) terstandarisasi:

```python
# Regex Pola Hierarki Peraturan Indonesia (UU 12/2011)
PATTERNS = {
    # BAB: "BAB I", "BAB IIA"
    "BAB": r"^(BAB\s+[IVXLCDM]+[A-Z]?)\s*$",
    
    # BAGIAN: "Bagian Kesatu", "Bagian Kedua"
    "BAGIAN": r"^(Bagian\s+[A-Za-z]+)\s*$",
    
    # PARAGRAF: "Paragraf 1"
    "PARAGRAF": r"^(Paragraf\s+\d+)\s*$",
    
    # PASAL: "Pasal 27", "Pasal 27A", "Pasal 158"
    "PASAL": r"^Pasal\s+(\d+[A-Z]?)\s*$",
    
    # AYAT: "(1)", "(2a)", "(3)" di awal baris
    "AYAT": r"^\((\d+[a-z]?)\)\s+",
    
    # HURUF: "a.", "b.", "aa." di awal baris
    "HURUF": r"^([a-z]{1,2})\.\s+",
    
    # ANGKA: "1.", "2." di bawah huruf
    "ANGKA": r"^(\d+)\.\s+",
}
```

---

## 3. LOGIKA DETEKSI OPERASI AMANDEMEN (AMENDMENT CLASSIFIER)

Ketika membaca naskah undang-undang pengubah (contoh: UU No. 1 Tahun 2024 yang mengubah UU ITE), parser mendeteksi diktum perubahan otomatis:

```
[Blok Perubahan Terdeteksi]
├── Pola 1 (Penggantian): "Ketentuan Pasal 27 diubah sehingga berbunyi sebagai berikut:"
│   └── Aksi: Buat Operasi REPLACE_PROVISION pada target "uu-11-2008/pasal-27"
├── Pola 2 (Sisipan): "Di antara Pasal 27 dan Pasal 28 disisipkan 2 (dua) pasal, yakni Pasal 27A dan Pasal 27B:"
│   └── Aksi: Buat Operasi ADD_PROVISION dengan label "Pasal 27A" & "Pasal 27B"
└── Pola 3 (Pencabutan): "Ketentuan ayat (3) Pasal 27 dihapus."
    └── Aksi: Buat Operasi REPEAL_PROVISION pada target "uu-11-2008/pasal-27/ayat-3"
```

---

## 4. STANDAR PENGUJIAN AKURASI (GOLDEN VERIFICATION TEST)

Setiap hasil parsing wajib diuji melalui skrip pengujian otomatis:
- **Input:** Berkas teks mentah UU hasil ekstraksi PDF resmi.
- **Proses:** Dijalankan melalui `LegalDocumentParser`.
- **Uji Integritas:**
  ```python
  def test_zero_data_loss(original_raw_text, parsed_json_tree):
      reconstructed_text = reconstruct_from_tree(parsed_json_tree)
      # Memastikan tidak ada kata yang hilang
      assert original_raw_text.split() == reconstructed_text.split()
  ```
Jika ada satu huruf atau tanda baca yang terlewat, parser akan otomatis menolak data dan mengeluarkan log kesalahan baris.
