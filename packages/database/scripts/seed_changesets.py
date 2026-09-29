"""
Builder ChangeSet Otomatis (Mesin 5) — menghubungkan relasi amandemen dari
catalog-rich.jsonl ke tabel change_sets + change_operations di DB.

Alur per dokumen:
  catalog-rich.jsonl (field diubahOleh)
        │
        ▼
  Cari amender & target di legal_instruments
        │
        ▼
  Baca PDF amender → parse "Pasal I" instruksi perubahan
        │
        ▼
  INSERT change_sets + change_operations + provision_revisions

Pemakaian:
  python seed_changesets.py                        # semua relasi di catalog-rich
  python seed_changesets.py --target uu-no-40-tahun-2007  # satu target
  python seed_changesets.py --dry-run              # preview tanpa tulis DB

Status output change_operations (tanpa parse pasal amandemen):
  - ChangeSet dibuat dengan status DRAFT
  - ChangeOperation belum ada (perlu parse PDF amandemen — tahap berikutnya)
  - Instrumen target di-update status='DIUBAH'
"""
import argparse
import json
import re
import os
import time
import urllib.parse
from pathlib import Path

import pymysql


def get_db_config():
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        p = urllib.parse.urlparse(db_url)
        return dict(
            host=p.hostname or "127.0.0.1",
            port=p.port or 3306,
            user=p.username or "root",
            password=p.password or "",
            database=p.path.lstrip("/") or "sipaka_db",
        )
    return dict(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("SIPAKA_DB_PORT", os.environ.get("DB_PORT", 3307))),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("MYSQL_ROOT_PASSWORD", os.environ.get("DB_PASS", "")),
        database=os.environ.get("DB_NAME", "sipaka_db"),
    )


DB = get_db_config()
HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"
RICH = HERE / "catalog-rich.jsonl"
PDF_DIR = Path(__file__).resolve().parent.parent / "seed" / "pdfs"

# Pola pendeteksian instruksi amandemen dalam teks Pasal I UU perubahan
RE_ANGKA_ITEM = re.compile(
    r"(?:Angka|angka|(?:^|\n)\d+\.)\s*"
    r"(?P<instruksi>(?:Ketentuan\s+)?(?:(?:ayat|Ayat|pasal|Pasal)\s*\([^)]+\)\s+)?(?:Pasal\s+\d+\w*\s+)?)"
    r"(?P<jenis>diubah|disisipkan|dihapus|ditambahkan|dicabut)",
    re.IGNORECASE | re.MULTILINE,
)
RE_PASAL_TARGET = re.compile(
    r"Pasal\s+(\d+\w*)",
    re.IGNORECASE,
)


def load_rich() -> dict[str, dict]:
    if not RICH.exists():
        print(f"[seed_cs] PERINGATAN: {RICH} tidak ada — jalankan scrape_details.py dulu")
        return {}
    rows: dict[str, dict] = {}
    for line in RICH.read_text("utf-8").splitlines():
        if line.strip():
            e = json.loads(line)
            rows[e["slug"]] = e
    return rows


def cari_instrument(cur, nomor: int, tahun: int) -> str | None:
    cur.execute("SELECT id FROM legal_instruments WHERE number=%s AND year=%s AND type='UU'", (nomor, tahun))
    row = cur.fetchone()
    return row[0] if row else None


def slug_ke_numtahun(slug: str) -> tuple[int, int] | None:
    m = re.match(r"uu-(?:no-)?(\d+)(?:-tahun)?-(\d{4})$", slug)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def tambah_changeset(cur, amender_id: str, target_id: str, title: str, basis: str, dry_run: bool) -> str | None:
    # Idempoten: cek dulu
    cur.execute(
        "SELECT id FROM change_sets WHERE amendingInstrumentId=%s AND targetInstrumentId=%s",
        (amender_id, target_id),
    )
    existing = cur.fetchone()
    if existing:
        return None  # sudah ada

    if dry_run:
        print(f"    [DRY] INSERT change_sets: amender={amender_id[:8]} target={target_id[:8]} title={title[:60]}")
        return "dry-run-id"

    import uuid
    cs_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO change_sets (id, amendingInstrumentId, targetInstrumentId, title, legalBasisNote, status, createdAt, updatedAt) "
        "VALUES (%s, %s, %s, %s, %s, 'DRAFT', NOW(), NOW())",
        (cs_id, amender_id, target_id, title, basis),
    )
    return cs_id


def update_status_diubah(cur, target_id: str, dry_run: bool):
    if dry_run:
        print(f"    [DRY] UPDATE legal_instruments SET status='DIUBAH' WHERE id={target_id[:8]}")
        return
    cur.execute("UPDATE legal_instruments SET status='DIUBAH' WHERE id=%s", (target_id,))


def tambah_relasi(cur, source_id: str, target_id: str, jenis: str, klausa: str, dry_run: bool):
    if source_id == target_id:
        return
    cur.execute(
        "SELECT id FROM instrument_relations WHERE sourceId=%s AND targetId=%s AND jenis=%s",
        (source_id, target_id, jenis),
    )
    if cur.fetchone():
        return
    if dry_run:
        print(f"    [DRY] INSERT instrument_relations: {jenis}")
        return
    cur.execute(
        "INSERT INTO instrument_relations (id, sourceId, targetId, jenis, sumberKlausa) VALUES (UUID(), %s, %s, %s, %s)",
        (source_id, target_id, jenis, klausa[:200]),
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", help="Slug instrumen target (yang diubah)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    rich = load_rich()
    if not rich:
        return

    conn = pymysql.connect(**DB, charset="utf8mb4")
    cur = conn.cursor()

    # Peta: (nomor, tahun) → id di DB
    cur.execute("SELECT id, number, year, slug, title FROM legal_instruments")
    rows = cur.fetchall()
    by_numtahun: dict[tuple, str] = {}
    by_id: dict[str, dict] = {}
    for iid, num, year, slug, title in rows:
        by_numtahun[(int(num), int(year))] = iid
        by_id[iid] = {"slug": slug, "title": title, "number": num, "year": year}

    # Tentukan target
    targets = list(rich.values())
    if args.target:
        targets = [e for e in targets if e["slug"] == args.target]

    cs_baru = 0; cs_skip = 0; relasi_baru = 0

    for entry in targets:
        slug  = entry["slug"]
        nt    = slug_ke_numtahun(slug)
        if not nt:
            continue
        target_id = by_numtahun.get(nt)
        if not target_id:
            continue  # target belum masuk DB

        diubah_oleh: list[str] = entry.get("diubahOleh") or []
        mencabut:    list[str] = entry.get("mencabut")    or []

        if not diubah_oleh and not mencabut:
            continue

        # ── Relasi amandemen (diubahOleh → UU pengubah mengubah target ini) ──
        for item in diubah_oleh:
            if isinstance(item, dict):
                amender_slug = item.get("slug")
                amender_label = item.get("label") or amender_slug
            else:
                amender_entry = next((e for e in rich.values() if e.get("detailsId") == item), None)
                amender_slug = amender_entry["slug"] if amender_entry else None
                amender_label = amender_slug

            if not amender_slug:
                continue

            amender_nt = slug_ke_numtahun(amender_slug)
            if not amender_nt:
                continue
            amender_id = by_numtahun.get(amender_nt)
            if not amender_id:
                # Bila amender belum ada di database, lewati dulu (akan terhubung saat amender di-ingest)
                continue

            amender_info = by_id.get(amender_id, {})
            title = f"Perubahan atas {by_id[target_id]['title']} oleh {amender_info.get('title', amender_label)}"
            basis = f"Pasal I {amender_info.get('title', amender_slug)}"

            cs_id = tambah_changeset(cur, amender_id, target_id, title, basis, args.dry_run)
            if cs_id:
                cs_baru += 1
                update_status_diubah(cur, target_id, args.dry_run)
                tambah_relasi(cur, amender_id, target_id, "MENGUBAH", basis, args.dry_run)
                relasi_baru += 1
                print(f"  [OK] ChangeSet: {amender_slug} -> {slug}")
            else:
                cs_skip += 1

        # ── Relasi pencabutan (target mencabut UU lain) ──
        for item in mencabut:
            if isinstance(item, dict):
                cabut_slug = item.get("slug")
            else:
                cabut_entry = next((e for e in rich.values() if e.get("detailsId") == item), None)
                cabut_slug = cabut_entry["slug"] if cabut_entry else None

            if not cabut_slug:
                continue

            cabut_nt = slug_ke_numtahun(cabut_slug)
            if not cabut_nt:
                continue
            cabut_id = by_numtahun.get(cabut_nt)
            if not cabut_id:
                continue
            tambah_relasi(cur, target_id, cabut_id, "MENCABUT",
                          f"{slug} mencabut {cabut_slug}", args.dry_run)
            relasi_baru += 1
            print(f"  [OK] Relasi MENCABUT: {slug} -> {cabut_slug}")

    if not args.dry_run:
        conn.commit()
    conn.close()

    print(f"\n[seed_changesets] Selesai:")
    print(f"  ChangeSet baru: {cs_baru}")
    print(f"  ChangeSet sudah ada (skip): {cs_skip}")
    print(f"  Relasi baru: {relasi_baru}")
    if args.dry_run:
        print("  (dry-run — tidak ada yang ditulis ke DB)")


if __name__ == "__main__":
    main()
