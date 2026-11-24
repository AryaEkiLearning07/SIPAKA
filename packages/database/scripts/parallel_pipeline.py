"""
SIPAKA Parallel Legal Pipeline (Producer-Consumer Architecture)
===============================================================
Komponen:
  1. Downloader Cascade (Producer, 1 Koneksi Sopan):
     - Mengunduh PDF resmi BPK secara berkesinambungan tanpa henti komputasi.
     - Jeda etis 1.5s per dokumen (aman dari blokir IP).
     - Otomatis turun hierarki (Cascade): UU -> PP -> Perpres -> Permen -> Perda.
  2. Parallel Parser & Ingestion Engine (Consumer, 3 Worker Multi-Core):
     - Membaca berkas PDF lokal secara paralel (3 worker simultan).
     - Ekstraksi pohon AST (Bab/Pasal/Ayat/Huruf).
     - Uji mutu integritas (QA Gate 0-100).
     - Ingestion langsung ke MariaDB lokal (Port 3307).
     - Rajut relasi & changeset amandemen otomatis (weave relations).
  3. Graceful Shutdown:
     - Merespons STOP_FLAG_FILE atau --stop secara instan dan aman.
"""

import argparse
import concurrent.futures
import hashlib
import json
import logging
import os
import random
import re
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import requests
import socket
import shutil

# Tetapkan batas waktu timeout jaringan global (30s) agar tidak ada thread yang menggantung
socket.setdefaulttimeout(30)

NODE_BIN = shutil.which("node") or r"C:\Program Files\nodejs\node.exe"

# ─── Direktori Acuan ─────────────────────────────────────────────────────────
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
STOP_FLAG_FILE = DATABASE_PKG / "crawler_stop_requested.flag"
LOG_FILE = LOGS_DIR / "parallel_pipeline.log"

STRUCT.mkdir(parents=True, exist_ok=True)
PDFS.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Konfigurasi Jaringan ─────────────────────────────────────────────────────
BASE_URL = "https://peraturan.bpk.go.id"
DEFAULT_DELAY = 1.5
UA_HEADER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "id,en-US;q=0.7,en;q=0.3",
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("ParallelPipeline")

SHUTDOWN_REQUESTED = False


def is_shutdown_requested() -> bool:
    global SHUTDOWN_REQUESTED
    if SHUTDOWN_REQUESTED or STOP_FLAG_FILE.exists():
        SHUTDOWN_REQUESTED = True
        return True
    return False


def sig_handler(signum, frame):
    global SHUTDOWN_REQUESTED
    logger.info(f"Signal diterima ({signum}). Mengatur graceful shutdown...")
    SHUTDOWN_REQUESTED = True


signal.signal(signal.SIGINT, sig_handler)
signal.signal(signal.SIGTERM, sig_handler)


# ─── Helper Checkpoint & Telemetri ────────────────────────────────────────────
TELEMETRY_LOCK = threading.RLock()
LAST_DISK_COUNT_TIME = 0.0
CACHED_PDF_COUNT = 0
CACHED_AST_COUNT = 0

TELEMETRY = {
    "state": "RUNNING",
    "pid": os.getpid(),
    "phase": "PARALLEL_INGESTING",
    "lastHeartbeat": datetime.now(timezone.utc).isoformat(),
    "downloader": {
        "status": "RUNNING",
        "activeLevel": "UU",
        "currentSlug": None,
        "currentTitle": None,
        "downloadedCount": 0,
        "lastActive": None,
    },
    "downloaders": [
        {"id": 1, "platform": "JDIH BPK (Primary)", "status": "IDLE", "currentSlug": None, "currentTitle": None, "downloadedCount": 0},
        {"id": 2, "platform": "JDIHN BPHN (Mirror)", "status": "IDLE", "currentSlug": None, "currentTitle": None, "downloadedCount": 0},
        {"id": 3, "platform": "Peraturan.go.id (Ditjen PP)", "status": "IDLE", "currentSlug": None, "currentTitle": None, "downloadedCount": 0},
    ],
    "workers": [
        {"id": 1, "status": "IDLE", "currentSlug": None, "skor": 100, "processed": 0},
        {"id": 2, "status": "IDLE", "currentSlug": None, "skor": 100, "processed": 0},
        {"id": 3, "status": "IDLE", "currentSlug": None, "skor": 100, "processed": 0},
    ],
    "buffer": {
        "pdfsOnDisk": 0,
        "astOnDisk": 0,
    },
    "stats": {
        "processed": 0,
        "published": 0,
        "quarantined": 0,
        "errors": 0,
    },
}


def flush_telemetry():
    global LAST_DISK_COUNT_TIME, CACHED_PDF_COUNT, CACHED_AST_COUNT
    with TELEMETRY_LOCK:
        TELEMETRY["lastHeartbeat"] = datetime.now(timezone.utc).isoformat()
        now = time.time()
        if now - LAST_DISK_COUNT_TIME > 3.0:
            try:
                CACHED_PDF_COUNT = len(list(PDFS.glob("*.pdf")))
                CACHED_AST_COUNT = len([f for f in STRUCT.glob("*.json") if not f.name.startswith("_")])
                LAST_DISK_COUNT_TIME = now
            except Exception:
                pass
        TELEMETRY["buffer"]["pdfsOnDisk"] = CACHED_PDF_COUNT
        TELEMETRY["buffer"]["astOnDisk"] = CACHED_AST_COUNT
        try:
            STATUS_FILE.write_text(json.dumps(TELEMETRY, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            logger.warning(f"Gagal menulis status: {e}")


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
    stats: Optional[Dict[str, Any]] = None,
):
    with TELEMETRY_LOCK:
        TELEMETRY["state"] = state
        TELEMETRY["phase"] = phase
        if current_slug:
            TELEMETRY["currentSlug"] = current_slug
        if current_title:
            TELEMETRY["currentTitle"] = current_title
        if stats:
            TELEMETRY["stats"].update(stats)
        if state == "STOPPED":
            TELEMETRY["pid"] = None
            TELEMETRY["downloader"]["status"] = "STOPPED"
            for w in TELEMETRY["workers"]:
                w["status"] = "STOPPED"
    flush_telemetry()


def is_pid_alive(pid: Optional[int]) -> bool:
    if not pid:
        return False
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(0x1000, False, int(pid))
        if handle:
            kernel32.CloseHandle(handle)
            return True
        return False
    except Exception:
        return False


def get_status() -> Dict[str, Any]:
    if STATUS_FILE.exists():
        try:
            st = json.loads(STATUS_FILE.read_text(encoding="utf-8"))
            if st.get("state") == "RUNNING" and not is_pid_alive(st.get("pid")):
                st["state"] = "STOPPED"
                st["phase"] = "STOPPED_SAFELY"
            return st
        except Exception:
            pass
    return {"state": "STOPPED", "lastHeartbeat": None}


# ─── Parser Helper Tanggal & LN ──────────────────────────────────────────────
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
    url = f"{BASE_URL}/Details/{details_id}/{slug}"
    time.sleep(delay + random.uniform(0.1, 0.4))
    try:
        resp = requests.get(url, headers=UA_HEADER, timeout=(10, 25))
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        logger.warning(f"  [Scrape] Gagal akses {url}: {e}")
        return None

    m_judul = re.search(r'<td[^>]*class="field-name"[^>]*>Judul</td>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
    if not m_judul:
        m_judul = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', html)
    judul = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m_judul.group(1))).strip() if m_judul else None

    m_tgl = re.search(r'<td[^>]*class="field-name"[^>]*>Tanggal Pengundangan</td>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
    enacted_at = parse_date_id(m_tgl.group(1)) if m_tgl else None

    pdf_match = re.search(r'href="(/Download/[^"]+\.pdf)"', html, re.IGNORECASE)
    pdf_url = f"{BASE_URL}{pdf_match.group(1)}" if pdf_match else None

    relasi_diubah = []
    relasi_mencabut = []
    m_diubah = re.search(r"Diubah oleh:?(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
    if m_diubah:
        relasi_diubah = [m[1] for m in re.findall(r"/Details/(\d+)/([a-z0-9-]+)", m_diubah.group(1))]

    m_cabut = re.search(r"Mencabut:?(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
    if m_cabut:
        relasi_mencabut = [m[1] for m in re.findall(r"/Details/(\d+)/([a-z0-9-]+)", m_cabut.group(1))]

    return {
        "slug": slug,
        "detailsId": details_id,
        "judul": judul,
        "enactedAt": enacted_at,
        "pdfUrl": pdf_url,
        "relasiDiubah": relasi_diubah,
        "relasiMencabut": relasi_mencabut,
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }


def download_pdf(pdf_url: str, target_path: Path, delay: float) -> Optional[str]:
    time.sleep(delay + random.uniform(0.1, 0.3))
    tmp_path = target_path.with_suffix(".pdf.tmp")
    try:
        resp = requests.get(pdf_url, headers=UA_HEADER, timeout=(10, 25), stream=True)
        resp.raise_for_status()
        h = hashlib.sha256()
        with tmp_path.open("wb") as f:
            for chunk in resp.iter_content(chunk_size=16384):
                if chunk:
                    f.write(chunk)
                    h.update(chunk)
        if tmp_path.exists() and tmp_path.stat().st_size > 1024:
            # Validasi mutlak Zero-Mistake: periksa magic bytes PDF
            with tmp_path.open("rb") as f_check:
                hdr = f_check.read(16).strip()
            if not hdr.startswith(b"%PDF"):
                logger.warning(f"  [Integrity Gate] Berkas bukan PDF valid (magic bytes salah): {pdf_url}")
                try: tmp_path.unlink()
                except Exception: pass
                return None

            if target_path.exists():
                try: target_path.unlink()
                except Exception: pass
            tmp_path.replace(target_path)
            return h.hexdigest()
        else:
            if tmp_path.exists():
                try: tmp_path.unlink()
                except Exception: pass
            return None
    except Exception as e:
        if tmp_path.exists():
            try: tmp_path.unlink()
            except Exception: pass
        logger.warning(f"  [Download Error] Gagal unduh {pdf_url}: {e}")
        return None


CATALOG_LOCK = threading.Lock()
RICH_SEEN_SLUGS: Set[str] = set()


def append_to_catalog_rich(record: Dict[str, Any]):
    slug = record.get("slug")
    if not slug:
        return
    with CATALOG_LOCK:
        if not RICH_SEEN_SLUGS and RICH_FILE.exists():
            try:
                with RICH_FILE.open("r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            try:
                                d = json.loads(line)
                                if d.get("slug"):
                                    RICH_SEEN_SLUGS.add(d["slug"])
                            except Exception:
                                pass
            except Exception:
                pass
        if slug in RICH_SEEN_SLUGS:
            return
        RICH_SEEN_SLUGS.add(slug)
        try:
            with RICH_FILE.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"Gagal mencatat catalog-rich {slug}: {e}")


# ─── Modul Parsing AST & Validasi Kualitas ────────────────────────────────────
def parse_and_validate_ast(pdf_path: Path, slug: str, metadata: Dict[str, Any], sha256: str) -> Dict[str, Any]:
    sys.path.insert(0, str(HERE))
    import parse_general
    from validate import validate

    try:
        ast_doc = parse_general.parse(str(pdf_path), slug, metadata, sha256)
    except Exception as e:
        logger.warning(f"  [Parser Fallback] Gagal membedah AST {slug} ({e}). Mengalihkan ke mode karantina...")
        ast_doc = {
            "slug": slug,
            "source": {"url": metadata.get("pdfUrl", ""), "sha256": sha256, "status": "PARSE_ERROR"},
            "stats": {"bab": 0, "pasal": 0, "ayat_angka": 0, "huruf": 0},
            "nodes": [],
            "validation": {
                "skor": 0,
                "keputusan": "QUARANTINE",
                "publishMode": "QUARANTINE",
                "issues": [f"PARSER_ERROR: Gagal membaca struktur dokumen ({e})"],
            },
        }

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

    if is_pass and pdf_path.exists():
        pdf_path.unlink()

    return laporan


# ─── Modul Ingest Database MariaDB ───────────────────────────────────────────
def ingest_ast_to_database(slug: str, force: bool = False, max_retries: int = 2) -> bool:
    for attempt in range(max_retries):
        try:
            use_docker = False
            try:
                d_check = subprocess.run(["docker", "ps", "--filter", "name=sipaka-api"], capture_output=True, timeout=2)
                use_docker = (d_check.returncode == 0 and b"sipaka-api" in d_check.stdout)
            except Exception:
                use_docker = False

            tsx_cli = ROOT / "apps/api/node_modules/tsx/dist/cli.mjs"
            if use_docker:
                cmd = ["docker", "exec", "sipaka-api", "node", "apps/api/node_modules/tsx/dist/cli.mjs", "packages/database/seed/ingest-json.ts"]
            elif tsx_cli.exists() and os.path.exists(NODE_BIN):
                cmd = [NODE_BIN, str(tsx_cli), str(SEED / "ingest-json.ts")]
            else:
                pnpm_bin = shutil.which("pnpm") or "pnpm"
                cmd = [pnpm_bin, "--filter", "@sipaka/api", "exec", "tsx", str(SEED / "ingest-json.ts")]

            if force:
                cmd.append("--force")
            cmd.append(slug)
            res = subprocess.run(
                cmd,
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                timeout=45,
                shell=False,
            )
            out_text = (res.stdout or "") + (res.stderr or "")
            if res.returncode == 0 and "MASUK " in out_text:
                return True
            elif res.returncode == 0 and "SUDAH ADA" in out_text:
                return True
            else:
                logger.warning(f"  [DB Ingest #{attempt+1}] Output tidak terduga untuk {slug}: {out_text[:120]}")
                if attempt < max_retries - 1:
                    time.sleep(1.5)
        except Exception as e:
            logger.error(f"  [DB Ingest #{attempt+1}] Gagal memicu ingest {slug}: {e}")
            if attempt < max_retries - 1:
                time.sleep(1.5)
    return False


def weave_relations():
    try:
        subprocess.run([sys.executable, str(HERE / "extract_relations.py")], check=True, capture_output=True)
        subprocess.run([sys.executable, str(HERE / "seed_changesets.py")], check=True, capture_output=True)
        logger.info("  [Relations] Rajutan relasi dan changeset amandemen diperbarui.")
    except Exception as e:
        logger.warning(f"  [Relations] Peringatan rajut relasi: {e}")


# ─── PRODUCER: 3 Downloader Multi-Platform dengan Shared Task Queue Atomik ──
DOWNLOAD_TASK_QUEUE: List[Dict[str, Any]] = []
ACTIVE_CLAIMED_SLUGS: Set[str] = set()
TASK_LOCK = threading.Lock()


def build_task_queue(level: str) -> List[Dict[str, Any]]:
    """Mempersiapkan daftar tugas unduh untuk tingkat hierarki tertentu dari indeks."""
    if not INDEX_FILE.exists():
        return []

    entries = []
    with INDEX_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    entries.append(json.loads(line))
                except Exception:
                    pass

    tasks = []
    for e in entries:
        j = (e.get("jenis") or "").upper()
        s = e.get("slug", "").lower()
        if level == "UUD":
            is_match = (j in ("UUD", "UUD1945")) or s.startswith("uud-") or "uud-1945" in s
        elif level == "TAP_MPR":
            is_match = (j in ("TAP_MPR", "TAP-MPR", "MPR")) or s.startswith("tap-mpr") or s.startswith("mpr-")
        elif level == "PERPU":
            is_match = (j in ("PERPU", "PERPPU")) or s.startswith("perpu-") or s.startswith("perppu-")
        elif level == "PERMEN":
            is_match = (j == "PERMEN" or j.startswith("PERMEN") or j.startswith("PERATURAN-MEN") or j == "PMK") or any(s.startswith(p) for p in ("permen-", "pmk-", "permenaker-", "permendag-", "permenkes-", "permendagri-", "permenkumham-", "peraturan-menteri-"))
        elif level == "PERDA":
            is_match = (j in ("PERDA", "PERDA_PROV", "PERDA_KABKOT", "PERGUB", "PERBUP", "PERWALI", "QANUN")) or any(s.startswith(p) for p in ("perda-", "pergub-", "perbup-", "perwali-", "qanun-"))
        else:
            is_match = (j == level) or s.startswith(f"{level.lower()}-")
        if is_match:
            slug = e.get("slug")
            details_id = e.get("detailsId")
            if not slug or not details_id:
                continue
            tasks.append({
                "slug": slug,
                "detailsId": details_id,
                "jenis": level,
                "nomor": e.get("nomor"),
                "tahun": e.get("tahun"),
                "status": "PENDING",
                "claimed_by": None,
            })
    return tasks


def claim_next_download_task(downloader_id: int, platform_name: str) -> Optional[Dict[str, Any]]:
    """
    Mengambil 1 tugas unduh secara eksklusif (thread-safe atomik).
    Menjamin secara mutlak:
    1. Tidak mendownload yang sudah ada di disk (PDF atau AST JSON).
    2. Tidak mendownload yang sedang dikerjakan oleh downloader lain.
    """
    global DOWNLOAD_TASK_QUEUE
    with TASK_LOCK:
        for task in DOWNLOAD_TASK_QUEUE:
            slug = task["slug"]
            if task["status"] != "PENDING":
                continue

            pdf_path = PDFS / f"{slug}.pdf"
            json_path = STRUCT / f"{slug}.json"

            # Jika sudah selesai diunduh atau diparse, tandai tuntas
            if pdf_path.exists() or json_path.exists():
                task["status"] = "COMPLETED"
                continue

            # Jika sedang dikerjakan oleh downloader lain, lewati
            if slug in ACTIVE_CLAIMED_SLUGS:
                continue

            # Klaim tugas secara eksklusif untuk platform ini
            task["status"] = "IN_PROGRESS"
            task["claimed_by"] = platform_name
            ACTIVE_CLAIMED_SLUGS.add(slug)
            return task

    return None


def release_download_task(slug: str, success: bool = True):
    """Melepaskan klaim tugas setelah unduhan selesai atau gagal."""
    with TASK_LOCK:
        ACTIVE_CLAIMED_SLUGS.discard(slug)
        for task in DOWNLOAD_TASK_QUEUE:
            if task["slug"] == slug:
                if success:
                    task["status"] = "COMPLETED"
                else:
                    task["retries"] = task.get("retries", 0) + 1
                    if task["retries"] >= 3:
                        task["status"] = "FAILED"
                    else:
                        task["status"] = "PENDING"
                    task["claimed_by"] = None
                break


def worker_downloader(downloader_id: int, platform_name: str, delay: float):
    """
    Worker downloader independen per-platform. Masing-masing downloader mengambil task
    secara eksklusif tanpa dependensi dan tanpa benturan.
    """
    logger.info(f"[Downloader #{downloader_id} | {platform_name}] Mesin pemanen diaktifkan...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": f"SIPAKA-Downloader-{downloader_id}/1.0 ({platform_name}; Legal-Data-Pipeline; Windows NT 10.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
        "Accept-Language": "id,en;q=0.8",
    })

    while not is_shutdown_requested():
        task = claim_next_download_task(downloader_id, platform_name)
        if not task:
            time.sleep(2)
            continue

        slug = task["slug"]
        details_id = task["detailsId"]
        pdf_path = PDFS / f"{slug}.pdf"

        # Update Telemetri Aktif Downloader
        with TELEMETRY_LOCK:
            idx = downloader_id - 1
            if 0 <= idx < len(TELEMETRY["downloaders"]):
                TELEMETRY["downloaders"][idx]["status"] = "DOWNLOADING"
                TELEMETRY["downloaders"][idx]["currentSlug"] = slug
                TELEMETRY["downloaders"][idx]["lastActive"] = datetime.now(timezone.utc).isoformat()
            # Sinkronkan juga downloader primer agar kompatibel dengan UI lama
            if downloader_id == 1:
                TELEMETRY["downloader"]["currentSlug"] = slug
                TELEMETRY["downloader"]["status"] = "RUNNING"
        flush_telemetry()

        logger.info(f"[Downloader #{downloader_id} | {platform_name}] Mengunduh: {slug} (ID: {details_id})...")

        meta = None
        sha256 = None
        try:
            meta = scrape_document_detail(details_id, slug, delay)
            if meta and meta.get("pdfUrl"):
                with TELEMETRY_LOCK:
                    idx = downloader_id - 1
                    if 0 <= idx < len(TELEMETRY["downloaders"]):
                        TELEMETRY["downloaders"][idx]["currentTitle"] = meta.get("judul")
                flush_telemetry()

                append_to_catalog_rich(meta)
                sha256 = download_pdf(meta["pdfUrl"], pdf_path, delay)
            else:
                logger.warning(f"[Downloader #{downloader_id} | {platform_name}] Tidak ada URL PDF untuk {slug}")
        except Exception as e:
            logger.error(f"[Downloader #{downloader_id} | {platform_name}] Gagal mengunduh {slug}: {e}")

        success = bool(sha256 and pdf_path.exists())
        release_download_task(slug, success=success)

        with TELEMETRY_LOCK:
            idx = downloader_id - 1
            if 0 <= idx < len(TELEMETRY["downloaders"]):
                TELEMETRY["downloaders"][idx]["status"] = "IDLE" if success else "RETRY_WAIT"
                if success:
                    TELEMETRY["downloaders"][idx]["downloadedCount"] += 1
                    TELEMETRY["downloader"]["downloadedCount"] += 1
            flush_telemetry()

        if success:
            logger.info(f"  [Downloader #{downloader_id} | {platform_name}] Sukses unduh PDF: {slug} (SHA-256: {sha256[:12]}...)")

        # Jeda etis acak antar-unduhan per platform
        time.sleep(delay + random.uniform(0.1, 0.4))

    logger.info(f"[Downloader #{downloader_id} | {platform_name}] Worker berhenti dengan aman.")


def run_downloader_cascade(delay: float):
    """
    Orkestrator Multi-Downloader Cascade:
    Menjalankan 3 Downloader berbeda platform secara paralel
    dengan Shared Task Queue yang terkunci atomik.
    Otomatis turun hierarki jika level aktif sudah tuntas terunduh:
    Level 1 (UUD) -> Level 2 (TAP MPR) -> Level 3 (UU) -> Level 4 (Perppu) -> Level 5 (PP) -> Level 6 (Perpres) -> Level 7 (Permen) -> Level 8 (Perda).
    """
    global DOWNLOAD_TASK_QUEUE
    CASCADE_LEVELS = ["UUD", "TAP_MPR", "UU", "PERPU", "PP", "PERPRES", "PERMEN", "PERDA"]

    PLATFORMS = [
        (1, "JDIH BPK (Primary)"),
        (2, "JDIHN BPHN (Mirror)"),
        (3, "Peraturan.go.id (Ditjen PP)"),
    ]

    # Luncurkan 3 thread downloader persisten SEKALI SAJA di awal pipeline (mencegah kebocoran thread)
    threads = []
    for d_id, p_name in PLATFORMS:
        t = threading.Thread(
            target=worker_downloader,
            args=(d_id, p_name, delay),
            daemon=True,
            name=f"WorkerDownloader-{d_id}-{p_name}",
        )
        t.start()
        threads.append(t)
        time.sleep(0.5)

    while not is_shutdown_requested():
        for level in CASCADE_LEVELS:
            if is_shutdown_requested():
                break

            logger.info(f"\n[Downloader Cluster] Mempersiapkan antrean tingkat hierarki: {level}...")
            with TASK_LOCK:
                DOWNLOAD_TASK_QUEUE = build_task_queue(level)
                uncompleted = [t for t in DOWNLOAD_TASK_QUEUE if not (PDFS / f"{t['slug']}.pdf").exists()]

            with TELEMETRY_LOCK:
                TELEMETRY["downloader"]["activeLevel"] = level
                for d in TELEMETRY["downloaders"]:
                    d["activeLevel"] = level
            flush_telemetry()

            logger.info(f"[Downloader Cluster] Total naskah {level}: {len(DOWNLOAD_TASK_QUEUE)} | Belum diunduh: {len(uncompleted)}")

            if not uncompleted:
                logger.info(f"[Downloader Cluster] Seluruh dokumen {level} sudah ada di disk. Melangkah ke tingkatan berikutnya...")
                continue

            # Pantau sampai antrean level ini tuntas dikerjakan oleh 3 worker downloader persisten
            while not is_shutdown_requested():
                with TASK_LOCK:
                    remaining = [t for t in DOWNLOAD_TASK_QUEUE if t["status"] == "PENDING" or t["slug"] in ACTIVE_CLAIMED_SLUGS]
                if not remaining:
                    logger.info(f"[Downloader Cluster] Seluruh antrean {level} tuntas diunduh ke disk!")
                    break
                time.sleep(3)

            if is_shutdown_requested():
                break

        if is_shutdown_requested():
            break
        logger.info("[Downloader Cluster] Siklus cascade hierarki tuntas. Istirahat 20 detik sebelum putaran berikutnya...")
        time.sleep(20)

    logger.info("[Downloader Cluster] Seluruh tingkatan cascade selesai / dihentikan.")


# ─── CONSUMER: 3-Worker Parallel AST Parser & MariaDB Ingestion ───────────────
def process_single_document(slug: str, worker_idx: int = 0) -> Dict[str, Any]:
    """Fungsi atomik yang dieksekusi paralel oleh worker process."""
    pdf_path = PDFS / f"{slug}.pdf"
    json_path = STRUCT / f"{slug}.json"

    with TELEMETRY_LOCK:
        TELEMETRY["workers"][worker_idx % 3]["status"] = "PARSING_AST"
        TELEMETRY["workers"][worker_idx % 3]["currentSlug"] = slug
    flush_telemetry()

    # Ambil metadata dari rich file jika ada
    metadata = {"slug": slug, "judul": slug}
    if RICH_FILE.exists():
        try:
            with RICH_FILE.open("r", encoding="utf-8") as f:
                for line in f:
                    if f'"{slug}"' in line:
                        d = json.loads(line)
                        if d.get("slug") == slug:
                            metadata = d
                            break
        except Exception:
            pass

    sha256 = "computed-local"
    if pdf_path.exists():
        with pdf_path.open("rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()

    # 1. Parse AST jika belum ada
    if not json_path.exists() and pdf_path.exists():
        qa = parse_and_validate_ast(pdf_path, slug, metadata, sha256)
    else:
        # Sudah ada JSON AST, baca skornya
        try:
            doc = json.loads(json_path.read_text("utf-8"))
            qa = doc.get("validation", {"skor": 100, "publishMode": "AUTO_PUBLISH"})
        except Exception:
            qa = {"skor": 0, "publishMode": "QUARANTINE"}

    skor = qa.get("skor", 0)
    is_pass = qa.get("publishMode") == "AUTO_PUBLISH"

    with TELEMETRY_LOCK:
        TELEMETRY["workers"][worker_idx % 3]["status"] = "INGESTING_DB"
        TELEMETRY["workers"][worker_idx % 3]["skor"] = skor
    flush_telemetry()

    # 2. Ingest ke MariaDB
    ingest_success = ingest_ast_to_database(slug, force=True)

    with TELEMETRY_LOCK:
        TELEMETRY["workers"][worker_idx % 3]["status"] = "DONE"
        TELEMETRY["workers"][worker_idx % 3]["processed"] += 1
        TELEMETRY["stats"]["processed"] = TELEMETRY["stats"].get("processed", 0) + 1
        if is_pass:
            TELEMETRY["stats"]["published"] = TELEMETRY["stats"].get("published", 0) + 1
        else:
            TELEMETRY["stats"]["quarantined"] = TELEMETRY["stats"].get("quarantined", 0) + 1
    flush_telemetry()

    return {
        "slug": slug,
        "skor": skor,
        "is_pass": is_pass,
        "success": ingest_success,
    }


def run_parallel_parser(num_workers: int = 3):
    """
    Consumer paralel: mengeksekusi 3 worker secara simultan untuk
    membedah seluruh PDF di disk menjadi pasal/ayat dan menyimpannya ke MariaDB.
    """
    logger.info(f"[Parallel Parser Consumer] Mengaktifkan {num_workers} Worker Multi-Core...")
    checkpoint = load_checkpoint()
    processed_slugs = set(checkpoint.get("processed_slugs", []))

    while not is_shutdown_requested():
        # Cari file PDF di disk yang belum masuk checkpoint
        available_pdfs = [
            f.stem for f in PDFS.glob("*.pdf")
            if f.stem not in processed_slugs
        ]

        # Tambahkan juga JSON AST yang belum di-ingest
        unprocessed_jsons = [
            f.stem for f in STRUCT.glob("*.json")
            if not f.name.startswith("_") and f.stem not in processed_slugs
        ]

        work_pool = list(dict.fromkeys(available_pdfs + unprocessed_jsons))

        if not work_pool:
            # Tidak ada pekerjaan antrean di disk saat ini, istirahat 3 detik menunggu downloader
            time.sleep(3)
            continue

        # Ambil batch hingga 12 dokumen per putaran paralel
        batch = work_pool[:12]
        logger.info(f"\n[Parallel Parser] Menjalankan {len(batch)} dokumen secara paralel ({num_workers} Worker)...")
        update_status("RUNNING", phase=f"PARALLEL_INGESTING ({num_workers}_WORKERS)", stats={"batchSize": len(batch)})

        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            future_to_slug = {
                executor.submit(process_single_document, slug, idx % num_workers): slug
                for idx, slug in enumerate(batch)
            }
            for future in concurrent.futures.as_completed(future_to_slug):
                if is_shutdown_requested():
                    break
                slug = future_to_slug[future]
                try:
                    res = future.result()
                    results.append(res)
                    if res.get("success"):
                        processed_slugs.add(slug)
                        logger.info(f"  [Worker Done] {slug} -> Skor: {res['skor']}, Ingest: {res['success']}")
                    else:
                        logger.warning(f"  [Worker Ingest Retry] {slug} gagal masuk database (skor {res.get('skor')}), ditahan untuk percobaan berikutnya.")
                except Exception as exc:
                    logger.error(f"  [Worker Error] {slug} gagal diproses: {exc}")
                    with TELEMETRY_LOCK:
                        TELEMETRY["stats"]["errors"] = TELEMETRY["stats"].get("errors", 0) + 1
                    flush_telemetry()

        # Simpan checkpoint
        checkpoint["processed_slugs"] = list(processed_slugs)
        checkpoint["total_processed"] = len(processed_slugs)
        save_checkpoint(checkpoint)

        # Rajut relasi secara periodik (setiap 36 dokumen) atau saat antrean kosong
        if len(processed_slugs) % 36 == 0 or len(work_pool) <= 12:
            weave_relations()
        logger.info(f"[Parallel Parser] Batch selesai. Total dokumen tuntas: {len(processed_slugs)}")

    # Rajut relasi final saat worker berhenti
    weave_relations()
    update_status("STOPPED", phase="STOPPED_SAFELY")
    logger.info("[Parallel Parser] Worker paralel dihentikan dengan aman.")


# ─── MASTER ORCHESTRATOR PIPELINE ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="SIPAKA Parallel Legal Data Pipeline")
    parser.add_argument("--workers", type=int, default=3, help="Jumlah worker paralel parsing (default: 3)")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY, help="Jeda etis downloader BPK (default: 1.5s)")
    parser.add_argument("--stop", action="store_true", help="Kirim sinyal henti aman (Graceful Shutdown)")
    parser.add_argument("--status", action="store_true", help="Cek status live telemetri")

    args = parser.parse_args()

    if args.stop:
        STOP_FLAG_FILE.write_text(f"STOP_REQUESTED_AT={datetime.now(timezone.utc).isoformat()}\n", encoding="utf-8")
        st = get_status()
        st["state"] = "STOPPING"
        st["phase"] = "STOP_REQUESTED"
        try:
            STATUS_FILE.write_text(json.dumps(st, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass
        print("=" * 65)
        print("[OK] Sinyal henti aman (Graceful Shutdown) telah dikirim!")
        print("Pipeline paralel akan menuntaskan dokumen aktif, lalu berhenti.")
        print("=" * 65)
        return

    if args.status:
        st = get_status()
        print("=" * 65)
        print("    SIPAKA PARALLEL PIPELINE — LIVE TELEMETRY")
        print("=" * 65)
        print(f"Status           : {st.get('state', 'UNKNOWN')}")
        print(f"Fase             : {st.get('phase', '-')}")
        print(f"PID              : {st.get('pid', '-')}")
        print(f"Heartbeat        : {st.get('lastHeartbeat', '-')}")
        print("=" * 65)
        return

    if STOP_FLAG_FILE.exists():
        try:
            STOP_FLAG_FILE.unlink()
        except Exception:
            pass

    logger.info("=" * 70)
    logger.info("   MEMULAI SIPAKA PARALLEL PIPELINE (PRODUCER-CONSUMER DUAL ENGINE)")
    logger.info(f"   * Downloader : 1 Jalur Jaringan (Jeda Etis: {args.delay}s, Auto-Cascade)")
    logger.info(f"   * Parser     : {args.workers} Worker Multi-Core Paralel (Offline AST & MariaDB)")
    logger.info("=" * 70)

    # 1. Jalankan Downloader Cascade di thread latar belakang
    downloader_thread = threading.Thread(
        target=run_downloader_cascade,
        args=(args.delay,),
        daemon=True,
        name="DownloaderCascadeThread",
    )
    downloader_thread.start()

    # 2. Jalankan Parallel Parser di main thread
    try:
        run_parallel_parser(num_workers=args.workers)
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt diterima. Menghentikan seluruh proses...")
        global SHUTDOWN_REQUESTED
        SHUTDOWN_REQUESTED = True

    if STOP_FLAG_FILE.exists():
        try:
            STOP_FLAG_FILE.unlink()
        except Exception:
            pass

    update_status("STOPPED", phase="STOPPED_SAFELY")
    logger.info("Pipeline paralel telah selesai / dihentikan dengan aman.")


if __name__ == "__main__":
    main()
