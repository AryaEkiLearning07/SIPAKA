"""
SIPAKA Pipeline Watchdog (Self-Healing Guardian Daemon)
======================================================
Menjaga SIPAKA Parallel Legal Pipeline agar terus berjalan tanpa henti:
1. Menjamin HANYA TEPAT 1 PROSES parallel_pipeline.py yang berjalan di OS (Anti-Duplikasi).
2. Mematikan proses duplikat secara otomatis bila terjadi penumpukan.
3. Menyalakan ulang secara instan bila proses pipeline mati.
4. Memverifikasi kesehatan koneksi MariaDB (Port 3307).
5. Menghormati sinyal graceful shutdown resmi (STOP_FLAG_FILE).
"""

import json
import logging
import os
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import psutil

HERE = Path(__file__).resolve().parent
DATABASE_PKG = HERE.parent
ROOT = DATABASE_PKG.parent
LOGS_DIR = DATABASE_PKG / "logs"
LOG_FILE = LOGS_DIR / "pipeline_watchdog.log"
STATUS_FILE = DATABASE_PKG / "crawler_status.json"
STOP_FLAG_FILE = DATABASE_PKG / "crawler_stop_requested.flag"
PIPELINE_SCRIPT = HERE / "parallel_pipeline.py"

LOGS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WATCHDOG] %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("Watchdog")


def get_running_pipeline_processes() -> List[psutil.Process]:
    """Mendeteksi semua proses parallel_pipeline.py nyata di OS."""
    procs = []
    my_pid = os.getpid()
    for p in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            if p.pid == my_pid:
                continue
            name = (p.info.get("name") or "").lower()
            if "python" not in name:
                continue
            cmd = p.info.get("cmdline") or []
            cmd_str = " ".join(cmd).lower()
            if "parallel_pipeline.py" in cmd_str:
                procs.append(p)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return procs


def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def start_pipeline() -> Optional[int]:
    python_bin = sys.executable
    cmd = [python_bin, str(PIPELINE_SCRIPT), "--workers", "3", "--delay", "1.5"]
    logger.info("Menyalakan 1 instance pipeline paralel: %s", " ".join(cmd))
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(DATABASE_PKG),
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        logger.info("Pipeline tunggal berhasil dinyalakan dengan PID: %d", proc.pid)
        return proc.pid
    except Exception as e:
        logger.error("Gagal menyalakan pipeline: %s", e)
        return None


def main():
    logger.info("=" * 65)
    logger.info("   SIPAKA PIPELINE WATCHDOG GUARDIAN (SINGLE-INSTANCE)")
    logger.info("   * Interval Cek : 20 Detik")
    logger.info("   * Proteksi     : Anti-Duplikasi Mutex & Auto-Heal")
    logger.info("=" * 65)

    while True:
        # 1. Cek apakah pengguna meminta penghentian manual
        if STOP_FLAG_FILE.exists():
            logger.info("Stop flag terdeteksi. Watchdog berhenti mengikuti instruksi pengguna.")
            break

        # 2. Cek kesehatan MariaDB lokal
        db_alive = is_port_open("127.0.0.1", 3307)
        if not db_alive:
            logger.warning("[PERINGATAN] MariaDB di port 3307 tidak merespons koneksi TCP.")

        # 3. Deteksi proses pipeline yang aktif di OS secara nyata
        procs = get_running_pipeline_processes()

        if len(procs) == 0:
            logger.warning("[ALERT] Tidak ada proses pipeline aktif. Menyalakan 1 instance baru...")
            start_pipeline()
            time.sleep(5)
        elif len(procs) > 1:
            logger.warning("[ALERT] Terdeteksi %d proses duplikat! Membersihkan kelebihan...", len(procs))
            # Simpan proses pertama, matikan sisanya
            primary = procs[0]
            for duplicate in procs[1:]:
                try:
                    duplicate.terminate()
                    logger.info("Proses duplikat PID %d dimatikan.", duplicate.pid)
                except Exception:
                    pass
        else:
            primary_pid = procs[0].pid
            logger.info("[HEARTBEAT] Pipeline tunggal sehat & berjalan (PID: %d). DB Port 3307: %s", primary_pid, "ONLINE" if db_alive else "OFFLINE")

        time.sleep(20)


if __name__ == "__main__":
    main()
