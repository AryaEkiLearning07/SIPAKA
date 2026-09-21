# LexVera — Version Control Perundang-Undangan Indonesia

Platform riset hukum untuk **konsolidasi naskah peraturan secara deterministik**: setiap amandemen dicatat sebagai operasi terstruktur yang disetujui kurator manusia, mesin merakit naskah konsolidasi pada titik waktu mana pun (*point-in-time*), lengkap dengan diff antar versi dan silsilah perubahan per pasal.

> Dokumen desain lengkap: [`RANCANGAN_TEKNIS_DETAIL.md`](./RANCANGAN_TEKNIS_DETAIL.md) · Perencanaan: [`MASTER_PLANNING_NEW.md`](./MASTER_PLANNING_NEW.md) · Eksekusi & testing: [`EXECUTION_AND_TESTING_ROADMAP.md`](./EXECUTION_AND_TESTING_ROADMAP.md)

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
