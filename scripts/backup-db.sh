#!/bin/sh
# Backup MariaDB lokal (XAMPP) -> folder backups/ dengan stempel waktu.
# Pemakaian: sh scripts/backup-db.sh [password_root]
set -e
STAMP=$(date +%Y%m%d_%H%M)
OUT_DIR="$(dirname "$0")/../backups"
mkdir -p "$OUT_DIR"
MYSQLDUMP="/c/xampp/mysql/bin/mysqldump.exe"
# sandi kosong = tanpa flag -p (hindari prompt interaktif)
AUTH="-u root"
[ -n "$1" ] && AUTH="-u root -p$1"
MYSQL_PWD="" "$MYSQLDUMP" -h 127.0.0.1 -P 3307 $AUTH lexvera_db | gzip > "$OUT_DIR/lexvera_db_$STAMP.sql.gz"
# simpan 14 backup terakhir
ls -1t "$OUT_DIR"/lexvera_db_*.sql.gz | tail -n +15 | xargs -r rm --
echo "Backup selesai: $OUT_DIR/lexvera_db_$STAMP.sql.gz"
