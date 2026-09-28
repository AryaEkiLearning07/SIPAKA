"""
Master Pipeline Orchestrator (SIPAKA Legal Data Pipeline)
Menghubungkan seluruh subsistem dari hulu (JDIH BPK) ke hilir (MariaDB & Fastify API):
  Tahap 1: Crawl & Scrape Details (Metadata & Relasi Amandemen)
  Tahap 2: Unduh PDF Resmi & Simpan Hash SHA-256
  Tahap 3: Parse PDF -> AST JSON Hierarki (Buku -> Bab -> Pasal -> Ayat -> Huruf)
  Tahap 4: QA & Validasi Integritas Norma (Score 0-100, Gerbang Kualitas)
  Tahap 5: Ingest ke Database MariaDB (legal_instruments, provisions, revisions)
  Tahap 6: Weave Jaring Relasi & Amandemen (instrument_relations, change_sets)

Pemakaian:
  python pipeline_orchestrator.py --status           # Cek dashboard kesiapan seluruh tahap
  python pipeline_orchestrator.py --step crawl       # Update indeks katalog BPK
  python pipeline_orchestrator.py --step scrape      # Perkaya metadata & relasi amandemen
  python pipeline_orchestrator.py --step parse       # Unduh, parse, & validasi dokumen dari antrean
  python pipeline_orchestrator.py --step ingest      # Masukkan JSON yang lolos ke database
  python pipeline_orchestrator.py --step relate      # Rajut relasi & changeset amandemen
  python pipeline_orchestrator.py --run-all --limit 5# Jalankan seluruh rantai pipeline untuk N dokumen
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pymysql

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SEED = HERE.parent / "seed"
STRUCT = SEED / "structured"
PDFS = SEED / "pdfs"

DB_CONFIG = dict(host="127.0.0.1", port=3307, user="root", password="", database="lexvera_db", charset="utf8mb4")


def get_db_connection():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"[!] Gagal koneksi database MariaDB port 3307: {e}")
        return None


def print_status():
    print("=" * 70)
    print("       SIPAKA LEGAL PIPELINE — STATUS KESIAPAN SISTEM")
    print("=" * 70)

    # 1. Katalog & Metadata
    cat_idx = STRUCT / "catalog-index.jsonl"
    cat_rich = STRUCT / "catalog-rich.jsonl"
    idx_count = len(cat_idx.read_text("utf-8").splitlines()) if cat_idx.exists() else 0
    rich_count = len(cat_rich.read_text("utf-8").splitlines()) if cat_rich.exists() else 0

    print(f"[1] HULU (JDIH BPK)")
    print(f"    * catalog-index.jsonl     : {idx_count:,} dokumen terindeks")
    print(f"    * catalog-rich.jsonl      : {rich_count:,} dokumen dengan metadata kaya & relasi")

    # 2. PDF & Parsing
    pdf_count = len(list(PDFS.glob("*.pdf"))) if PDFS.exists() else 0
    json_files = [f for f in STRUCT.glob("*.json") if not f.name.startswith("_")]
    pass_count = 0
    quar_count = 0
    for jf in json_files:
        try:
            d = json.loads(jf.read_text("utf-8"))
            mode = d.get("validation", {}).get("publishMode", "")
            if mode == "AUTO_PUBLISH":
                pass_count += 1
            else:
                quar_count += 1
        except Exception:
            pass

    print(f"\n[2] ARSIP & PARSING (PDF -> AST JSON)")
    print(f"    * PDF tersimpan           : {pdf_count} berkas resmi")
    print(f"    * AST JSON hasil parse    : {len(json_files)} dokumen")
    print(f"      - Lolos (AUTO_PUBLISH)  : {pass_count} dokumen (skor 100)")
    print(f"      - Karantina (QUARANTINE): {quar_count} dokumen (perlu kurasi layout)")

    # 3. Database MariaDB
    conn = get_db_connection()
    if conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM legal_instruments")
            inst_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM provisions")
            prov_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM change_sets")
            cs_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM change_operations")
            op_count = cur.fetchone()[0]

            cur.execute("SELECT jenis, COUNT(*) FROM instrument_relations GROUP BY jenis")
            rel_stats = cur.fetchall()

        conn.close()

        print(f"\n[3] BASIS DATA MARIADB (lexvera_db @ port 3307)")
        print(f"    * legal_instruments       : {inst_count} peraturan aktif")
        print(f"    * provisions              : {prov_count:,} pasal & ayat tersimpan")
        print(f"    * change_sets (Amandemen) : {cs_count} set perubahan")
        print(f"    * change_operations       : {op_count} operasi mutasi pasal")
        rel_str = ", ".join([f"{r[0]}: {r[1]}" for r in rel_stats]) if rel_stats else "Belum ada"
        print(f"    * instrument_relations    : {rel_str}")
    else:
        print("\n[3] BASIS DATA MARIADB: TIDAK TERHUBUNG")

    # 4. Engine & API Server
    print(f"\n[4] LAYANAN KONSOLIDASI (Fastify API & LawReconstructor)")
    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:4000/api/v1/health")
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            print(f"    * API Status              : ONLINE (v{data.get('version')}, db: {data.get('database')})")
            print(f"    * Engine Aktif            : {', '.join(data.get('activeEngines', []))}")
    except Exception:
        print(f"    * API Status              : OFFLINE (Port 4000 tidak merespons)")

    print("=" * 70)


def run_step_crawl(jenis="uu", max_pages=10):
    print(f"\n[ORCHESTRATOR] Menjalankan Tahap 1: Crawl Katalog BPK ({jenis})...")
    subprocess.run([sys.executable, str(HERE / "catalog_crawler.py"), "--jenis", jenis, "--max-pages", str(max_pages)], check=True)


def run_step_scrape(limit=10, force=False):
    print(f"\n[ORCHESTRATOR] Menjalankan Tahap 1b: Scrape Metadata Detail & Relasi ({limit} entri)...")
    cmd = [sys.executable, str(HERE / "scrape_details.py"), "--limit", str(limit)]
    if force:
        cmd.append("--force")
    subprocess.run(cmd, check=True)


def run_step_parse(limit=10):
    print(f"\n[ORCHESTRATOR] Menjalankan Tahap 2 & 3: Unduh PDF, Parse ke AST, & Validasi ({limit} dokumen)...")
    subprocess.run([sys.executable, str(HERE / "ingest_batch.py"), "--from-catalog", "UU", "--limit", str(limit)], check=True)


def run_step_ingest(force=False, slug=None):
    print(f"\n[ORCHESTRATOR] Menjalankan Tahap 4: Ingest JSON ke MariaDB...")
    db_pkg = ROOT / "packages" / "database"
    cmd = ["npx", "tsx", "./seed/ingest-json.ts"]
    if force:
        cmd.append("--force")
    if slug:
        cmd.append(slug)
    # Gunakan shell=True untuk Windows npx
    subprocess.run(" ".join(cmd), cwd=str(db_pkg), shell=True, check=True)


def run_step_relate():
    print(f"\n[ORCHESTRATOR] Menjalankan Tahap 5: Ekstraksi Relasi Antar-UU & Amandemen...")
    subprocess.run([sys.executable, str(HERE / "extract_relations.py")], check=True)
    subprocess.run([sys.executable, str(HERE / "seed_changesets.py")], check=True)


def run_full_pipeline(limit=5):
    print(f"\n🚀 [ORCHESTRATOR] MENJALANKAN PIPELINE LENGKAP END-TO-END ({limit} DOKUMEN)...")
    t0 = time.time()
    run_step_scrape(limit=limit)
    run_step_parse(limit=limit)
    run_step_ingest(force=False)
    run_step_relate()
    t1 = time.time()
    print(f"\n✅ [ORCHESTRATOR] Pipeline selesai dalam {t1 - t0:.2f} detik.")
    print_status()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Orchestrator Pipeline SIPAKA")
    parser.add_argument("--status", action="store_true", help="Tampilkan status seluruh subsistem")
    parser.add_argument("--step", choices=["crawl", "scrape", "parse", "ingest", "relate"], help="Jalankan satu tahap spesifik")
    parser.add_argument("--run-all", action="store_true", help="Jalankan seluruh rantai pipeline dari scrape sampai relate")
    parser.add_argument("--limit", type=int, default=10, help="Jumlah entri per gelombang")
    parser.add_argument("--slug", help="Slug dokumen spesifik untuk ingest")
    parser.add_argument("--force", action="store_true", help="Paksa pemrosesan dokumen karantina")

    args = parser.parse_args()

    if args.status or len(sys.argv) == 1:
        print_status()
    elif args.run_all:
        run_full_pipeline(limit=args.limit)
    elif args.step == "crawl":
        run_step_crawl()
    elif args.step == "scrape":
        run_step_scrape(limit=args.limit, force=args.force)
    elif args.step == "parse":
        run_step_parse(limit=args.limit)
    elif args.step == "ingest":
        run_step_ingest(force=args.force, slug=args.slug)
    elif args.step == "relate":
        run_step_relate()
