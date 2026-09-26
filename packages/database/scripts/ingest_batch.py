"""
Runner Batch Ingestion (Mesin 3) — proses banyak dokumen sekaligus, resumable.
Untuk setiap dokumen di arsip: parse (bila belum) -> validasi -> simpan JSON + laporan.

Pemakaian:
  python ingest_batch.py                 # proses semua dokumen di _akuisisi-log.json
  python ingest_batch.py --only uu-1-2023
"""
import json
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


if __name__ == "__main__":
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
