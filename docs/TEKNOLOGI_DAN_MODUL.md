# TECH STACK LENGKAP & PLANNING MODUL — LexVera
*Fokus pengembangan: fitur konsolidasi + seluruh penunjangnya (parser, data, proses) + sesi pengguna.*
*Prinsip kerja: development di localhost, setiap perubahan di-commit & push ke GitHub (repo: AryaEkiLearning07/SIPAKA, branch main).*

---

## 1. KEPUTUSAN DATABASE SAAT INI (XAMPP MySQL/MariaDB)

| Hal | Keputusan |
|---|---|
| DB dev lokal | **XAMPP MariaDB 10.4, port 3307** (server MySQL Anda sudah hidup di 3307 — bukan 3306) |
| Skema | `provider = "mysql"` di `schema.prisma` — semua tabel + `users`/`sessions` sudah ter-push |
| Mode tanpa DB | Tetap ada: fallback demo engine (`DEMO_FALLBACK=true`) — platform tetap hidup saat DB mati |
| **Konsekuensi jujur** | **pgvector tidak tersedia di MariaDB** → fitur AI pencarian semantik/RAG ditunda; jalur PostgreSQL+pgvector tetap rencana produksi. Migrasi balik mudah karena skema berada di lapisan Prisma (satu ganti provider + re-push) |
| Data lain Anda | db_tpa, db_employee, dsb. **tidak tersentuh** — LexVera hanya memakai `lexvera_db` |

## 2. TECH STACK LENGKAP

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Monorepo | pnpm workspace + Turborepo | orkestrasi build/test lintas paket |
| Engine inti | TypeScript murni (`packages/legal-engine`) | rekonstruksi point-in-time + diff LCS; **tanpa** dependensi web/DB |
| Tipe bersama | TypeScript (`packages/types`) | `ConsolidatedLawDocument`, `ProvisionNode`, `ChangeSetPayload` |
| Database | MariaDB 10.4 (XAMPP) via Prisma ORM | skema 4-lapisan + users/sessions; migrasi via `prisma db push` + file migration sebagai rekaman |
| API | Fastify 5 (Node 20+, tsx) | REST `/api/v1/*`; CORS; cookie httpOnly untuk sesi |
| Auth | bcryptjs + Session table + cookie httpOnly | register/login/logout/me; peran MAHASISWA/DOSEN/KURATOR/ADMIN |
| Frontend | Next.js 15 App Router + Tailwind CSS | bahasa desain "arsip negara" (Fraunces/Newsreader/IBM Plex Mono; paper/ink/seal) |
| Kontrol versi | Git + GitHub (SIPAKA) | setiap perubahan di-commit & push; riwayat proyek auditable |
| (Tahap lanjut) DevOps | Dockerfile, GitHub Actions, VPS Docker | deploy + CI saat inti stabil |
| (Ditunda) AI | pgvector/Postgres, parser PDF | sengaja ditunda karena MariaDB; masuk produksi Postgres |

## 3. MODUL (URUTAN FOKUS: KONSOLIDASI DULU)

### M1 — Inti Konsolidasi ✅ (hidup)
- 4/6 operasi jalan: `ADD`, `REPLACE`, `REPEAL`, `PARTIAL_REPEAL`; `RENUMBER` & `JUDICIAL_OVERRIDE` menyusul di M1b.
- Golden test pilot keluarga UU ITE (10/10 hijau).
- **Sisa pekerjaan:** naskah UU ITE utuh 100+ pasal (input manual dual-control ke YAML → seed), operasi pada lapisan Penjelasan (kasus "tetap dengan perubahan penjelasan" UU 19/2016), golden test naskah penuh.

### M2 — Ingestion & Parser (prioritas berikutnya)
- Folder `seed/` sudah berdiri: `manifest.csv` (provenance: URL, SHA-256, tanggal unduh), `pdfs/`, `structured/` (target format YAML).
- **Parser tahap 1 (deterministik):** ekstrak klausa formulaik dari UU pengubah → draf operasi (`diubah sehingga berbunyi` → REPLACE; `disisipkan` → ADD; `dicabut` → REPEAL).
- **Parser tahap 2 (AI-assisted):** usulan strukturisasi naskah + flag ketidakpastian; selalu berhenti di DRAFT.
- Acceptance: 1 UU pengubah nyata di-parse → semua operasinya cocok dengan kurasi manual.

### M3 — Sesi & Peran Pengguna ✅ (fondasi hidup)
- Model: `User` (bcrypt) + `Session` (token 256-bit, cookie httpOnly, 7 hari, revoke).
- Peran: **MAHASISWA** (baca + fitur belajar) · **DOSEN** (kurasi ringan, anotasi) · **KURATOR** (setujui ChangeSet → PUBLISHED) · **ADMIN** (kelola pengguna).
- Endpoint hidup: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- Akun demo (di-seed): `mahasiswa@ / dosen@ / kurator@ / admin@lexvera.local` (sandi di halaman /masuk).
- **Sisa pekerjaan:** proteksi endpoint tulis (DRAFT/PUBLISH) sesuai peran — masuk bersama M4.

### M4 — Kurasi & Workflow (gerbang anti-halusinasi)
- Panel dual-pane: PDF asli ↔ hasil parser; status per node `DRAFT → VERIFIED/EDITED/REJECTED`; publish diblokir sampai semua node selesai.
- Review tercatat di `review_records` (siapa, kapan, keputusan).
- Endpoint tulis baru: `POST /instruments/:slug/changesets` (DRAFT), `POST /changesets/:id/review` (KURATOR), `POST /changesets/:id/publish`.

### M5 — Penyajian (Reader & Turunan fitur)
- ✅ Reader + timeline + inspektor diff + komparasi berdampingan + banner mode demo/database.
- Lanjutan: date-picker bebas (bukan hanya 3 tahun), badge anotasi MK (data `judicial_annotations`), peta silsilah `/neuron` reskin, ekspor naskah (PDF/Markdown).

### M6 — DevOps (setelah inti stabil)
- Dockerfile API + Web, GitHub Actions (lint + test + build pada setiap push), deploy VPS Docker, backup rutin MariaDB/Postgres.
- Kebiasaan yang sudah berjalan: **setiap perubahan → commit deskriptif → push ke GitHub.**

## 4. URUTAN KERJA 4 MINGGU (FOKUS KONSOLIDASI)

| Minggu | Target | Definition of Done |
|---|---|---|
| 1 | M1b: naskah utuh UU ITE (YAML, dual control) + operasi Penjelasan | Golden test naskah penuh hijau; reader menampilkan 100+ pasal dari **database** |
| 2 | M2: parser deterministik klausa formulaik + manifest PDF asli terarsip | 1 UU pengubah → operasi draft identik dengan kurasi manual |
| 3 | M3b+M4: proteksi peran + panel kurasi dual-pane (versi pertama) | Kurator menyetujui 1 ChangeSet DRAFT → PUBLISHED lewat UI |
| 4 | M5: date-picker bebas + anotasi MK + reskin neuron; M6 mulir (CI) | CI hijau di GitHub; demo fakultas siap |

## 5. ALUR DATA END-TO-END (tetap seperti rancangan)

```
PDF resmi (arsip + SHA-256) → parser (usulan DRAFT) → kurasi manusia → DB terverifikasi
→ mesin konsolidasi → API → web (reader, diff, timeline, silsilah)
```
Aturan baja tetap: mesin tidak pernah menulis teks; ambigu = karantina; hanya PUBLISHED yang tampil.
