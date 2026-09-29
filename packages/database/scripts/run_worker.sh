#!/usr/bin/env bash
# ==============================================================================
# SIPAKA Legal Harvester — VPS Worker Daemon Launcher
# Menjalankan worker crawler & ingestion di background dengan proteksi PID lock.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$DB_DIR/logs/crawler_worker.log"
PID_FILE="$DB_DIR/crawler_worker.pid"

mkdir -p "$DB_DIR/logs"

case "$1" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "[SIPAKA] Worker sudah berjalan dengan PID $(cat "$PID_FILE")."
      exit 0
    fi
    echo "[SIPAKA] Memulai Crawler Worker di latar belakang (continuous mode)..."
    nohup python3 "$SCRIPT_DIR/crawler_worker.py" --continuous --batch 10 --delay 1.5 > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "[SIPAKA] Worker berhasil dijalankan dengan PID $(cat "$PID_FILE")."
    echo "[SIPAKA] Pantau log: tail -f $LOG_FILE"
    ;;

  stop)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      PID=$(cat "$PID_FILE")
      echo "[SIPAKA] Mengirim sinyal Graceful Shutdown ke PID $PID..."
      kill -TERM "$PID"
      rm -f "$PID_FILE"
      echo "[SIPAKA] Sinyal terkirim. Worker akan menyelesaikan dokumen aktif sebelum berhenti."
    else
      echo "[SIPAKA] Tidak ada worker aktif yang berjalan."
      rm -f "$PID_FILE" 2>/dev/null || true
    fi
    ;;

  status)
    python3 "$SCRIPT_DIR/crawler_worker.py" --status
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "Status Proses OS : AKTIF (PID: $(cat "$PID_FILE"))"
    else
      echo "Status Proses OS : NON-AKTIF"
    fi
    ;;

  batch)
    LIMIT=${2:-5}
    echo "[SIPAKA] Menjalankan worker untuk satu batch ($LIMIT dokumen)..."
    python3 "$SCRIPT_DIR/crawler_worker.py" --batch "$LIMIT" --delay 1.5
    ;;

  logs)
    tail -n 50 -f "$LOG_FILE"
    ;;

  *)
    echo "Penggunaan: $0 {start|stop|status|batch <N>|logs}"
    exit 1
    ;;
esac
