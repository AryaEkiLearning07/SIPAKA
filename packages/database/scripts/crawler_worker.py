"""
Crawler & Ingestion Worker Daemon (SIPAKA Automated Legal Harvester)
=====================================================================
Worker latar belakang cerdas dengan Ethical Rate Limiting, Checkpointing,
dan Integrasi Telemetri Penuh ke Dashboard Admin ISO 9001/27001.

Fitur Utama:
  1. Ethical Rate Limiting (1.5s - 3s delay + jitter) mencegah blocking IP BPK/JDIH.
  2. Resumable Checkpoint (crawler_checkpoint.json): tidak mengulang dokumen yang sudah diproses.
  3. Real-time Telemetry (crawler_status.json): terbaca langsung oleh API Admin.
  4. Graceful Shutdown (SIGINT / SIGTERM): menyelesaikan dokumen aktif sebelum berhenti.
  5. Multi-Stage Pipeline:
     Scrape Detail -> Download PDF -> Parse AST -> QA Score -> Ingest DB -> Weave Relations.

Pemakaian:
  python crawler_worker.py --status               # Cek telemetri live worker
  python crawler_worker.py --batch 5              # Jalankan 5 dokumen lalu selesai
  python crawler_worker.py --continuous           # Mode daemon terus-menerus di VPS
  python crawler_worker.py --delay 2.0            # Kustomisasi jeda etis
"""

import argparse
import hashlib
import json
import logging
import os
import random
import re
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

# ─── Direktori & Path Acuan ──────────────────────────────────────────────────
HERE = Path(__file__).resolve().parent
DATABASE_PKG = HERE.parent
ROOT = DATABASE_PKG.parent
SEED = DATABASE_PKG / "seed"
STRUCT = SEED / "structured"
PDFS = SEED / "pdfs"
LOGS_DIR = DATABASE_PKG / "logs"

INDEX_FILE = STRUCT / "catalog-index.jsonl"
RICH_FILE = STRUCT / "catalog-rich.jsonl"
CHECKPOINT_FILE = DATABASE_PKG / "crawler_checkpoint.json"
STATUS_FILE = DATABASE_PKG / "crawler_status.json"
LOG_FILE = LOGS_DIR / "crawler_worker.log"

STRUCT.mkdir(parents=True, exist_ok=True)
PDFS.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Konfigurasi Jaringan & User Agent ────────────────────────────────────────
BASE_URL = "https://peraturan.bpk.go.id"
DEFAULT_DELAY = 1.5
UA_HEADER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "id,en-US;q=0.7,en;q=0.3",
}

# ─── Setup Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("CrawlerWorker")

# ─── Flag Pengendalian Graceful Shutdown ─────────────────────────────────────
SHUTDOWN_REQUESTED = False


def sig_handler(signum, frame):
    global SHUTDOWN_REQUESTED
    logger.info(f"Signal diterima ({signum}). Mengatur graceful shutdown...")
    SHUTDOWN_REQUESTED = True


signal.signal(signal.SIGINT, sig_handler)
signal.signal(signal.SIGTERM, sig_handler)


# ─── Helper Checkpoint & Telemetri ────────────────────────────────────────────
def load_checkpoint() -> Dict[str, Any]:
    if CHECKPOINT_FILE.exists():
        try:
            return json.loads(CHECKPOINT_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"processed_slugs": [], "last_run": None, "total_processed": 0}


def save_checkpoint(checkpoint: Dict[str, Any]):
    checkpoint["last_run"] = datetime.now(timezone.utc).isoformat()
    CHECKPOINT_FILE.write_text(json.dumps(checkpoint, indent=2, ensure_ascii=False), encoding="utf-8")


def update_status(
    state: str,
    phase: str = "IDLE",
    current_slug: Optional[str] = None,
    current_title: Optional[str] = None,
    stats: Optional[Dict[str, int]] = None,
):
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "state": state,
        "pid": os.getpid(),
        "phase": phase,
        "currentSlug": current_slug,
        "currentTitle": current_title,
        "lastHeartbeat": now,
        "stats": stats or {},
    }
    try:
        STATUS_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning(f"Gagal menulis status: {e}")


def get_status() -> Dict[str, Any]:
    if STATUS_FILE.exists():
        try:
            return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"state": "STOPPED", "lastHeartbeat": None}


# ─── Modul Scraper Detail BPK ────────────────────────────────────────────────
def parse_ln_tln(html: str):
    m_ln = re.search(r"LN\.\d{4}/NO\.(\d+)", html)
    ln = m_ln.group(1) if m_ln else None
    m_tln = re.search(r"TLN\s+NO\.(\d+)", html)
    tln = m_tln.group(1) if m_tln else None
    return ln, tln


def parse_date_id(html: str):
    BULAN = {
        "januari": "01", "februari": "02", "maret": "03", "april": "04",
        "mei": "05", "juni": "06", "juli": "07", "agustus": "08",
        "september": "09", "oktober": "10", "november": "11", "desember": "12",
    }
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", html)
    if not m:
        return None
    d, b_str, y = m.group(1).zfill(2), m.group(2).lower(), m.group(3)
    b = BULAN.get(b_str)
    return f"{y}-{b}-{d}" if b else None


def scrape_document_detail(details_id: str, slug: str, delay: float) -> Optional[Dict[str, Any]]:
    """Ambil metadata kaya dari portal BPK dengan rate limiting etis."""
    url = f"{BASE_URL}/Details/{details_id}/{slug}"
    time.sleep(delay + random.uniform(0.1, 0.4))

    try:
        resp = requests.get(url, headers=UA_HEADER, timeout=30)
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        logger.warning(f"  [Scrape] Gagal akses {url}: {e}")
        return None

    # Ekstraksi Judul
    m_judul = re.search(r'<td[^>]*class="field-name"[^>]*>Judul</td>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
    if not m_judul:
        m_judul = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', html)
    judul = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m_judul.group(1))).strip() if m_judul else None

    # Ekstraksi LN / TLN
    ln, tln = parse_ln_tln(html)

    # Ekstraksi Tanggal Pengundangan
    m_tgl = re.search(r'<td[^>]*class="field-name"[^>]*>Tanggal Pengundangan</td>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
    enacted_at = parse_date_id(m_tgl.group(1)) if m_tgl else None

    # Ekstraksi URL PDF resmi
    pdf_match = re.search(r'href="(/Download/[^"]+\.pdf)"', html, re.IGNORECASE)
    pdf_url = f"{BASE_URL}{pdf_match.group(1)}" if pdf_match else None

    # Ekstraksi Relasi Hukum: Diubah Oleh & Mencabut
    diubah_oleh = list(dict.fromkeys(re.findall(r"/Details/(\d+)/([a-z0-9-]+)", html)))
    # Saring hanya relasi relevan (bukan link navigasi umum)
    relasi_diubah = []
    relasi_mencabut = []

    m_diubah = re.search(r"Diubah oleh:?(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
    if m_diubah:
        relasi_diubah = [m[1] for m in re.findall(r"/Details/(\d+)/([a-z0-9-]+)", m_diubah.group(1))]

    m_mencabut = re.search(r"Mencabut:?(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
    if m_mencabut:
        relasi_mencabut = [m[1] for m in re.findall(r"/Details/(\d+)/([a-z0-9-]+)", m_mencabut.group(1))]

    # Nomor dan Tahun
    m_nomor = re.search(r"-no-(\d+)-tahun-(\d{4})", slug)
    nomor = int(m_nomor.group(1)) if m_nomor else None
    tahun = int(m_nomor.group(2)) if m_nomor else None

    return {
        "detailsId": details_id,
        "slug": slug,
        "nomor": nomor,
        "tahun": tahun,
        "jenis": "UU",
        "judul": judul,
        "lnNumber": ln,
        "tlnNumber": tln,
        "enactedAt": enacted_at,
        "pdfUrl": pdf_url,
        "diubahOleh": relasi_diubah,
        "mencabut": relasi_mencabut,
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }


def append_to_catalog_rich(record: Dict[str, Any]):
    """Menyimpan record kaya ke catalog-rich.jsonl secara idempoten."""
    existing_records = []
    if RICH_FILE.exists():
        for line in RICH_FILE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                try:
                    existing_records.append(json.loads(line))
                except Exception:
                    pass

    # Perbarui jika sudah ada, atau tambahkan jika baru
    updated = False
    for i, r in enumerate(existing_records):
        if r.get("slug") == record.get("slug"):
            existing_records[i] = record
            updated = True
            break
    if not updated:
        existing_records.append(record)

    with RICH_FILE.open("w", encoding="utf-8") as f:
        for r in existing_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


# ─── Modul Unduh PDF & Hitung SHA-256 ─────────────────────────────────────────
def download_pdf(pdf_url: str, target_path: Path, delay: float) -> Optional[str]:
    time.sleep(delay + random.uniform(0.1, 0.3))
    try:
        resp = requests.get(pdf_url, headers=UA_HEADER, timeout=60, stream=True)
        resp.raise_for_status()
        h = hashlib.sha256()
        with target_path.open("wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    h.update(chunk)
        return h.hexdigest()
    except Exception as e:
        logger.warning(f"  [Download] Gagal unduh PDF {pdf_url}: {e}")
        if target_path.exists():
            target_path.unlink()
        return None


# ─── Modul Parsing AST & Validasi Kualitas ────────────────────────────────────
def parse_and_validate_ast(pdf_path: Path, slug: str, metadata: Dict[str, Any], sha256: str) -> Dict[str, Any]:
    # Import modul parser & validator lokal
    sys.path.insert(0, str(HERE))
    import parse_general
    from validate import validate

    ast_doc = parse_general.parse(str(pdf_path), slug, metadata, sha256)
    out_json = STRUCT / f"{slug}.json"
    out_json.write_text(json.dumps(ast_doc, ensure_ascii=False, indent=1), encoding="utf-8")

    laporan = validate(ast_doc)
    is_pass = laporan.get("keputusan") == "PASS"
    mode = "AUTO_PUBLISH" if is_pass else "QUARANTINE"

    laporan["publishMode"] = mode
    laporan["pdf"] = str(pdf_path)
    laporan["sha256"] = sha256
    laporan["details"] = metadata

    ast_doc["validation"] = {
        "skor": laporan.get("skor", 0),
        "keputusan": laporan.get("keputusan", "FAIL"),
        "issues": laporan.get("issues", []),
        "publishMode": mode,
    }
    out_json.write_text(json.dumps(ast_doc, ensure_ascii=False, indent=1), encoding="utf-8")

    # Jika PASS (Skor 100), hapus PDF untuk menghemat disk VPS (bukti tersimpan via sha256 & URL)
    if is_pass and pdf_path.exists():
        pdf_path.unlink()

    return laporan


# ─── Modul Ingest Database MariaDB ───────────────────────────────────────────
def ingest_ast_to_database(slug: str) -> bool:
    try:
        # Jalankan seeder generik tsx
        cmd = ["npx", "tsx", "./seed/ingest-json.ts", slug]
        res = subprocess.run(
            " ".join(cmd),
            cwd=str(DATABASE_PKG),
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if res.returncode == 0:
            logger.info(f"  [DB Ingest] Sukses ingest {slug} ke MariaDB.")
            return True
        else:
            logger.warning(f"  [DB Ingest] Gagal ingest {slug}: {res.stderr}")
            return False
    except Exception as e:
        logger.error(f"  [DB Ingest] Error proses ingest: {e}")
        return False


# ─── Modul Rajut Relasi & Changeset ──────────────────────────────────────────
def weave_relations():
    try:
        subprocess.run([sys.executable, str(HERE / "extract_relations.py")], capture_output=True, check=True)
        subprocess.run([sys.executable, str(HERE / "seed_changesets.py")], capture_output=True, check=True)
        logger.info("  [Relations] Rajutan relasi dan changeset amandemen diperbarui.")
    except Exception as e:
        logger.warning(f"  [Relations] Peringatan rajut relasi: {e}")


# ─── Eksekusi Alur Kerja Utama Worker ─────────────────────────────────────────
def run_worker_cycle(batch_limit: int = 10, delay: float = DEFAULT_DELAY) -> Dict[str, int]:
    checkpoint = load_checkpoint()
    processed_slugs = set(checkpoint.get("processed_slugs", []))

    if not INDEX_FILE.exists():
        logger.error(f"Berkas katalog indeks {INDEX_FILE} tidak ditemukan. Jalankan catalog_crawler.py terlebih dahulu.")
        return {"processed": 0, "published": 0, "quarantined": 0, "errors": 0}

    # Baca seluruh entri indeks
    entries = []
    for line in INDEX_FILE.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                entries.append(json.loads(line))
            except Exception:
                pass

    total_indexed = len(entries)
    pending_entries = [e for e in entries if e.get("slug") not in processed_slugs]

    logger.info(f"Antrean Ingestion: {len(pending_entries)} tertunda dari total {total_indexed:,} dokumen terindeks.")

    stats = {
        "total_indexed": total_indexed,
        "processed": 0,
        "published": 0,
        "quarantined": 0,
        "errors": 0,
    }

    update_status("RUNNING", phase="INITIALIZING", stats=stats)

    count = 0
    for entry in pending_entries:
        if SHUTDOWN_REQUESTED or count >= batch_limit:
            break

        slug = entry.get("slug")
        details_id = entry.get("detailsId")
        if not slug or not details_id:
            continue

        count += 1
        logger.info(f"\n[{count}/{batch_limit}] Memproses: {slug} (ID: {details_id})...")
        update_status("RUNNING", phase="SCRAPING", current_slug=slug, stats=stats)

        try:
            # 1. Scrape Detail & Metadata
            meta = scrape_document_detail(details_id, slug, delay)
            if not meta:
                stats["errors"] += 1
                continue

            append_to_catalog_rich(meta)
            update_status("RUNNING", phase="DOWNLOADING_PDF", current_slug=slug, current_title=meta.get("judul"), stats=stats)

            # 2. Unduh PDF jika ada URL
            pdf_url = meta.get("pdfUrl")
            if not pdf_url:
                logger.info(f"  [Skip] Tidak ada berkas PDF untuk {slug}")
                processed_slugs.add(slug)
                stats["processed"] += 1
                continue

            pdf_path = PDFS / f"{slug}.pdf"
            sha256 = download_pdf(pdf_url, pdf_path, delay)
            if not sha256:
                stats["errors"] += 1
                continue

            # 3. Parse AST & Validasi Kualitas
            update_status("RUNNING", phase="PARSING_AST", current_slug=slug, stats=stats)
            qa = parse_and_validate_ast(pdf_path, slug, meta, sha256)
            is_pass = qa.get("publishMode") == "AUTO_PUBLISH"

            if is_pass:
                stats["published"] += 1
                logger.info(f"  [QA Gate] PASS (Skor {qa.get('skor', 0)}/100) -> AUTO_PUBLISH")
                # 4. Ingest ke Database
                update_status("RUNNING", phase="INGESTING", current_slug=slug, stats=stats)
                ingest_ast_to_database(slug)
            else:
                stats["quarantined"] += 1
                logger.info(f"  [QA Gate] QUARANTINE (Skor {qa.get('skor', 0)}/100). Isu: {len(qa.get('issues', []))}")

            stats["processed"] += 1
            processed_slugs.add(slug)

            # Simpan checkpoint berkala per dokumen
            checkpoint["processed_slugs"] = list(processed_slugs)
            checkpoint["total_processed"] = len(processed_slugs)
            save_checkpoint(checkpoint)

        except Exception as e:
            logger.error(f"  [Error] Kegagalan memproses {slug}: {e}")
            stats["errors"] += 1

    # 5. Rajut Relasi Amandemen setelah batch selesai
    if stats["published"] > 0:
        update_status("RUNNING", phase="WEAVING_RELATIONS", stats=stats)
        weave_relations()

    state = "STOPPED" if SHUTDOWN_REQUESTED else "IDLE"
    update_status(state, phase="COMPLETED", stats=stats)
    logger.info(f"\nSiklus Batch Tuntas: {stats['processed']} diproses ({stats['published']} published, {stats['quarantined']} karantina, {stats['errors']} error).")
    return stats


def main():
    parser = argparse.ArgumentParser(description="SIPAKA Automated Crawler & Ingestion Worker")
    parser.add_argument("--batch", type=int, default=10, help="Jumlah dokumen per siklus batch")
    parser.add_argument("--continuous", action="store_true", help="Jalankan sebagai daemon terus-menerus")
    parser.add_argument("--sleep-interval", type=int, default=300, help="Jeda tidur antar siklus daemon (detik)")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY, help="Jeda etis antar panggilan BPK (detik)")
    parser.add_argument("--status", action="store_true", help="Cek status live telemetri worker")
    parser.add_argument("--reset-checkpoint", action="store_true", help="Reset checkpoint pengerjaan")

    args = parser.parse_args()

    if args.status:
        st = get_status()
        print("=" * 60)
        print("    SIPAKA CRAWLER WORKER — LIVE TELEMETRY")
        print("=" * 60)
        print(f"Status           : {st.get('state', 'UNKNOWN')}")
        print(f"Fase             : {st.get('phase', '-')}")
        print(f"PID              : {st.get('pid', '-')}")
        print(f"Dokumen Aktif    : {st.get('currentSlug', '-')}")
        print(f"Judul Aktif      : {st.get('currentTitle', '-')}")
        print(f"Heartbeat        : {st.get('lastHeartbeat', '-')}")
        stats = st.get("stats", {})
        print(f"Total Indeks     : {stats.get('total_indexed', 0):,}")
        print(f"Diproses Sesi    : {stats.get('processed', 0)}")
        print(f"Published (100%) : {stats.get('published', 0)}")
        print(f"Karantina        : {stats.get('quarantined', 0)}")
        print(f"Error            : {stats.get('errors', 0)}")
        print("=" * 60)
        return

    if args.reset_checkpoint:
        if CHECKPOINT_FILE.exists():
            CHECKPOINT_FILE.unlink()
            print("Checkpoint berhasil di-reset.")
        return

    logger.info(f"Memulai Worker Crawler SIPAKA (PID: {os.getpid()}, Delay Etis: {args.delay}s)...")

    if args.continuous:
        logger.info(f"Mode DAEMON aktif. Worker akan berjalan terus-menerus (jeda siklus: {args.sleep_interval}s).")
        while not SHUTDOWN_REQUESTED:
            run_worker_cycle(batch_limit=args.batch, delay=args.delay)
            if SHUTDOWN_REQUESTED:
                break
            logger.info(f"Menunggu {args.sleep_interval} detik sebelum memeriksa antrean berikutnya...")
            for _ in range(args.sleep_interval):
                if SHUTDOWN_REQUESTED:
                    break
                time.sleep(1)
        logger.info("Worker daemon dihentikan dengan aman (Graceful Shutdown).")
    else:
        run_worker_cycle(batch_limit=args.batch, delay=args.delay)


if __name__ == "__main__":
    main()
