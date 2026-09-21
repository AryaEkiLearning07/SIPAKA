# Folder Arsip Ingestion (Pilot Keluarga UU ITE)

Sumber kebenaran bahan mentah & terstruktur — semua reviewable di Git.

```
manifest.csv           → provenance: URL sumber, SHA-256, tanggal unduh, metode ingest, LN/TLN
pdfs/                  → arsip PDF resmi (immutable — file yang sudah masuk JANGAN diubah,
                         koreksi = file baru + hash baru)
structured/            → naskah terstruktur (Tahap 2): <slug>.yaml + <slug>-<tahun>.ops.yaml
```

## SOP Pengisian

1. Unduh PDF resmi (rekomendasi: peraturan.bpk.go.id — paling bersih).
2. Hitung hash: `certutil -hashfile pdfs/uu-11-2008.pdf SHA256` (Windows) atau `sha256sum`.
3. Isi baris manifest.csv (kolom sha256, url_sumber, tanggal_unduh). Jangan pernah mengarang URL —
   salin persis dari address bar saat mengunduh.
4. (Tahap 2) Strukturisasi naskah utuh ke YAML di `structured/` — dual control:
   satu orang input, satu orang memverifikasi terhadap PDF, lalu golden test.
5. Sementara naskah utuh belum selesai, seeder memuat dataset pilot dari
   `@lexvera/legal-engine` (satu sumber kebenaran yang sudah teruji golden test).
