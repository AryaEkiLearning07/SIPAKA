# LexVera — Version Control Perundang-Undangan Indonesia

Platform riset hukum untuk **konsolidasi naskah peraturan secara deterministik**: setiap amandemen dicatat sebagai operasi terstruktur yang disetujui kurator manusia, mesin merakit naskah konsolidasi pada titik waktu mana pun (*point-in-time*), lengkap dengan diff antar versi dan silsilah perubahan per pasal.

> Dokumen desain lengkap: [`RANCANGAN_TEKNIS_DETAIL.md`](./docs/RANCANGAN_TEKNIS_DETAIL.md) · Perencanaan: [`MASTER_PLANNING_NEW.md`](./docs/MASTER_PLANNING_NEW.md) · Eksekusi & testing: [`EXECUTION_AND_TESTING_ROADMAP.md`](./docs/EXECUTION_AND_TESTING_ROADMAP.md)

## Arsitektur

Monorepo pnpm + Turborepo:

| Paket | Isi |
|---|---|
| `packages/types` | Tipe yuridis bersama: `ConsolidatedLawDocument`, `ProvisionNode`, `ChangeSetPayload` |
| `packages/legal-engine` | Mesin konsolidasi murni (tanpa DB/web): `LawReconstructor`, `LegalDiffGenerator` + golden test |
| `packages/database` | Skema Prisma 4-lapisan, migrasi, seeder |
| `apps/api` | Fastify REST API — membaca DB, rekonstruksi via engine |
| `apps/web` | Next.js 15 — legal reader, diff side-by-side, peta silsilah |

Alur data: **PDF resmi (diarsip + SHA-256) → parser (usulan DRAFT) → kurasi manusia → DB terverifikasi → engine → API → web**. Prinsip fail-closed: mesin tidak pernah menghasilkan teks sendiri; yang tampil di web hanya yang sudah `PUBLISHED`.

## Menjalankan secara Lokal

Prasyarat: Node.js 20+, pnpm 12, Docker (untuk PostgreSQL 16 + pgvector).

```bash
# 1. Dependensi
pnpm install

# 2. Database (Docker)
docker compose up -d
cp .env.example packages/database/.env   # kredensial lokal

# 3. Migrasi + seed data pilot (keluarga UU ITE)
pnpm db:migrate
pnpm db:seed

# 4. Jalankan API (http://localhost:4000)
pnpm --filter @lexvera/api dev

# 5. Jalankan Web (http://localhost:3000) — terminal lain
pnpm --filter @lexvera/web dev
```

Cek cepat: `curl http://localhost:4000/api/v1/health` harus melaporkan `database: "ok"`, lalu buka `http://localhost:3000/uu/ite`.

## Mode Real-DB: Dev di Laptop + Database di VPS (tanpa Docker Desktop)

Program (API + web) jalan di laptop; PostgreSQL 16 + pgvector jalan di VPS yang sudah ada Docker. Data tersimpan permanen di volume VPS.

**Opsi A — SSH Tunnel (direkomendasikan, port tidak dibuka ke publik):**

```bash
# 1. Di VPS (sekali saja): jalankan Postgres, bind ke localhost VPS saja
docker run -d --name lexvera-postgres --restart unless-stopped \
  -e POSTGRES_USER=lexvera_admin \
  -e POSTGRES_PASSWORD=<password-kuat-anda> \
  -e POSTGRES_DB=lexvera_db \
  -p 127.0.0.1:5432:5432 \
  -v lexvera_pgdata:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

# 2. Di laptop (tiap sesi dev): tunnel — DB VPS tampil sebagai localhost:5432
ssh -N -L 5432:127.0.0.1:5432 user@IP-VPS
```

**Opsi B — Direct (lebih cepat, port 5432 terbuka — wajib password sangat kuat + firewall):**

```bash
# Di VPS: ganti -p 127.0.0.1:5432:5432 menjadi -p 5432:5432
# Di laptop: isi packages/database/.env dengan host IP-VPS
DATABASE_URL="postgresql://lexvera_admin:<password>@IP-VPS:5432/lexvera_db?schema=public"
```

Lalu di laptop (sama untuk kedua opsi):

```bash
pnpm db:migrate   # buat 9 tabel di VPS
pnpm db:seed      # muat keluarga UU ITE
pnpm --filter @lexvera/api dev
pnpm --filter @lexvera/web dev
```

Checklist real testing: badge beranda "Data Demo" → **"Database"** (hijau); `/uu/ite` tampil dari DB; timeline 2008→2024 menampilkan sisipan Pasal 27A/27B dan Pasal 27 ayat (3) berstatus "Dihapus"; mode komparasi menampilkan diff; "Inspeksi Perubahan" menghitung diff kata-per-kata. Restart VPS → data tetap ada.

> Keamanan: `packages/database/.env` sudah di-gitignore — jangan pernah commit IP/password VPS.

## Perintah Berguna

```bash
pnpm test                  # unit + golden test legal-engine (harus selalu hijau)
pnpm lint                  # typecheck seluruh paket
pnpm db:generate           # regenerate prisma client
pnpm db:migrate            # migrasi skema
pnpm db:seed               # muat data pilot ke database
```

## Status Proyek

- ✅ Mesin konsolidasi deterministik (4/6 operasi: ADD, REPLACE, REPEAL, PARTIAL_REPEAL) — 10/10 test hijau
- ✅ Skema 4-lapisan (source documents → provisions → change sets → publications)
- 🔄 Tahap 1: rantai DB → API → Web (dikerjakan)
- ⬜ Naskah UU ITE utuh + golden test penuh, `RENUMBER`/`JUDICIAL_OVERRIDE`, anotasi MK, panel kurator, DevOps

Proyek riset untuk Fakultas Hukum — naskah konsolidasi yang ditampilkan adalah **alat bantu riset non-resmi**; setiap pasal selalu tertaut ke dokumen resmi penerbit.
