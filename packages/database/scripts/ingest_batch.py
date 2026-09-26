"""
Runner Batch Ingestion (Mesin 3) — proses banyak dokumen sekaligus, resumable.
Untuk setiap dokumen di arsip: parse (bila belum) -> validasi -> simpan JSON + laporan.

Pemakaian:
  python ingest_batch.py                 # proses semua dokumen di _akuisisi-log.json
  python ingest_batch.py --only uu-1-2023
"""
import json
import re
import sys
from pathlib import Path

import parse_general
from validate import validate

HERE = Path(__file__).resolve().parent.parent / "seed"
STRUCT = HERE / "structured"


def proses_satu(entri: dict) -> dict:
    slug = f"uu-{entri['nomor']}-{entri['tahun']}"
    out = STRUCT / f"{slug}.json"

    if out.exists():
        doc = json.loads(out.read_text(encoding="utf-8"))
    else:
        doc = parse_general.parse(entri["pdf"], slug, entri["details"], entri["sha256"])
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")

    laporan = validate(doc)
    laporan["publishMode"] = "AUTO_PUBLISH" if laporan["keputusan"] == "PASS" else "QUARANTINE"
    laporan["pdf"] = entri["pdf"]
    laporan["sha256"] = entri["sha256"]
    laporan["details"] = entri["details"]
    doc["validation"] = {"skor": laporan["skor"], "keputusan": laporan["keputusan"],
                         "issues": laporan["issues"], "publishMode": laporan["publishMode"]}
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")

    # Kebijakan penyimpanan server kecil: PDF yang PASS dihapus setelah AST tersimpan.
    # Yang permanen disimpan: AST (produk) + sha256 + URL sumber (bukti asal; PDF publik
    # dapat diunduh ulang dari URL yang sama kapan pun, mis. saat pindah VPS besar).
    # PDF dokumen KARANTINA tetap disimpan untuk dibaca ulang saat penyebabnya diperbaiki.
    if laporan["keputusan"] == "PASS":
        pdf_path = Path(entri["pdf"])
        if pdf_path.exists():
            pdf_path.unlink()
            laporan["pdfDihapus"] = True
    return laporan



# ---------- Antrean di database (catalog_index) ----------
import pymysql

DB = dict(host="127.0.0.1", port=3307, user="root", password="", database="lexvera_db")

def db_ambil_terdaftar(jenis: str, limit: int):
    conn = pymysql.connect(**DB)
    with conn.cursor(pymysql.cursors.DictCursor) as cur:
        cur.execute(
            "SELECT detailsId, slug, jenis, nomor, tahun FROM catalog_index "
            "WHERE jenis=%s AND status='TERDAFTAR' ORDER BY CAST(tahun AS UNSIGNED) DESC LIMIT %s",
            (jenis, limit),
        )
        rows = cur.fetchall()
    conn.close()
    return rows

def db_update_status(details_id: str, status: str, skor=None):
    conn = pymysql.connect(**DB)
    with conn.cursor() as cur:
        if skor is None:
            cur.execute("UPDATE catalog_index SET status=%s, diupdate=NOW() WHERE detailsId=%s", (status, details_id))
        else:
            cur.execute("UPDATE catalog_index SET status=%s, skor=%s, diupdate=NOW() WHERE detailsId=%s", (status, skor, details_id))
    conn.commit()
    conn.close()

def unduh_dari_katalog(row: dict) -> dict | None:
    """Unduh PDF dari halaman Details milik baris katalog; kembalikan entri gaya akuisisi."""
    import requests
    slug = row["slug"]
    r = requests.get(f"https://peraturan.bpk.go.id/Details/{row['detailsId']}/{slug}",
                     headers={"User-Agent": "Mozilla/5.0 SIPAKA-Research/1.0"}, timeout=60)
    m = re.search(r'href="(/Download/[^"]+)"', r.text)
    if not m:
        print(f"  ! {slug}: tautan unduh tidak ada")
        return None
    r2 = requests.get("https://peraturan.bpk.go.id" + m.group(1).replace("&amp;", "&"),
                      headers={"User-Agent": "Mozilla/5.0 SIPAKA-Research/1.0"}, timeout=120)
    if not r2.content[:4] == b"%PDF":
        print(f"  ! {slug}: bukan PDF")
        return None
    pdf = HERE / "pdfs" / f"{slug}.pdf"
    pdf.write_bytes(r2.content)
    import hashlib
    return {"nomor": (row.get("nomor") or "").replace(".0", ""), "tahun": row.get("tahun"),
            "pdf": str(pdf), "sha256": hashlib.sha256(r2.content).hexdigest(),
            "details": f"https://peraturan.bpk.go.id/Details/{row['detailsId']}/{slug}"}

def jalankan_katalog(jenis: str, limit: int, delete_pass: bool):
    rows = db_ambil_terdaftar(jenis, limit)
    print(f"[katalog] {len(rows)} dokumen TERDAFTAR jenis {jenis}")
    for row in rows:
        slug = row["slug"]
        try:
            db_update_status(row["detailsId"], "TERUNDUH")
            entri = unduh_dari_katalog(row)
            if not entri:
                db_update_status(row["detailsId"], "GAGAL_UNDUH")
                continue
            doc = parse_general.parse(entri["pdf"], slug, entri["details"], entri["sha256"])
            out = STRUCT / f"{slug}.json"
            out.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
            db_update_status(row["detailsId"], "TERPARSE")
            r = validate(doc)
            status = "LOLOS" if r["keputusan"] == "PASS" else "KARANTINA"
            db_update_status(row["detailsId"], status, r["skor"])
            if status == "LOLOS":
                pdf_path = Path(entri["pdf"])
                if delete_pass and pdf_path.exists():
                    pdf_path.unlink()
            print(f"  {slug:<14} skor {r['skor']:>3}  {status}  | {doc['stats']['pasal']} pasal "
                  f"| {r['issues'][0] if r['issues'] else '-'}")
        except Exception as e:
            db_update_status(row["detailsId"], "GAGAL_PARSE")
            print(f"  {slug}: GAGAL {e}")

if __name__ == "__main__":
    if "--from-catalog" in sys.argv:
        jenis = sys.argv[sys.argv.index("--from-catalog") + 1]
        limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else 50
        jalankan_katalog(jenis, limit, "--delete-pass" in sys.argv)
        sys.exit(0)
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]

    log = STRUCT / "_akuisisi-log.json"
    arsip = json.loads(log.read_text(encoding="utf-8")) if log.exists() else []
    laporan_batch = []

    for entri in arsip:
        slug = f"uu-{entri['nomor']}-{entri['tahun']}"
        if only and slug != only:
            continue
        try:
            r = proses_satu(entri)
            laporan_batch.append(r)
            print(f"{slug:<12} skor {r['skor']:>3}  {r['keputusan']:<11} "
                  f"| {r['jumlah']['pasal']} pasal | {'; '.join(r['issues'][:1]) if r['issues'] else '-'}")
        except Exception as e:
            print(f"{slug:<12} GAGAL: {e}")
            laporan_batch.append({"slug": slug, "error": str(e)})

    lulus = [r for r in laporan_batch if r.get("keputusan") == "PASS"]
    karantina = [r for r in laporan_batch if r.get("keputusan") == "QUARANTINE"]
    print(f"\nRINGKASAN: {len(lulus)} PASS (auto-publish) | {len(karantina)} KARANTINA "
          f"| {len([r for r in laporan_batch if r.get('error')])} gagal")

    (STRUCT / "_laporan-batch.json").write_text(
        json.dumps(laporan_batch, ensure_ascii=False, indent=1), encoding="utf-8"
    )
