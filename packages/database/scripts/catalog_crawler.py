"""
Crawler Katalog BPK (metadata-only, TANPA unduh PDF).
Menyapu Search?jenis=<jenis>&page=N hingga halaman tanpa entri baru,
lalu menulis setiap entri ke seed/structured/catalog-index.jsonl.

Pemakaian:
  python catalog_crawler.py --jenis uu --max-pages 100
  python catalog_crawler.py --jenis pp --max-pages 200
"""
import json
import re
import time
from pathlib import Path

import requests

BASE = "https://peraturan.bpk.go.id"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 SIPAKA-Research/1.0"}
DELAY = 1.5
HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"
OUT = HERE / "catalog-index.jsonl"


def halaman_tahun(jenis: str, tahun: int):
    url = f"{BASE}/Search?keywords=&jenis={jenis}&tahun={tahun}"
    try:
        r = requests.get(url, headers=UA, timeout=60)
    except Exception as e:
        print(f"  ! gagal tahun {tahun}: {e}")
        return []
    return list(dict.fromkeys(re.findall(r"/Details/(\d+)/([a-z0-9-]+)", r.text)))


def halaman(jenis: str, page: int):
    url = f"{BASE}/Search?keywords=&jenis={jenis}&page={page}"
    try:
        r = requests.get(url, headers=UA, timeout=60)
    except Exception as e:
        print(f"  ! gagal hal {page}: {e}")
        return []
    return list(dict.fromkeys(re.findall(r"/Details/(\d+)/([a-z0-9-]+)", r.text)))


def parse_slug(slug: str):
    # contoh: uu-no-11-tahun-2008 | permen-no-5-tahun-2020 | perda-kota-...-no-nomor-1-tahun-...
    m = re.match(r"^([a-z-]+?)-no-(?:nomor-)?(\d+)-tahun-(\d{4})$", slug)
    if m:
        return m.group(1).upper(), m.group(2), m.group(3)
    m = re.match(r"^uu-no-(\d+)-tahun-(\d{4})$", slug)
    if m:
        return "UU", m.group(1), m.group(2)
    return slug.split("-")[0].upper(), None, None


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--jenis", required=True)
    ap.add_argument("--max-pages", type=int, default=200)
    args = ap.parse_args()

    terlihat: dict[str, dict] = {}
    if OUT.exists():
        for line in OUT.read_text(encoding="utf-8").splitlines():
            if line.strip():
                e = json.loads(line)
                terlihat[e["detailsId"]] = e

    print(f"[crawl] jenis={args.jenis} — entri lama: {len(terlihat)}")
    halaman_baru_total = 0
    tahun_list = list(range(2026, 1944, -1))
    for tahun in tahun_list:
        entries = halaman_tahun(args.jenis, tahun)
        baru = [(i, s) for i, s in entries if i not in terlihat]
        print(f"  {tahun}: {len(entries)} entri, {len(baru)} baru")
        if not baru:
            continue
        for details_id, slug in baru:
            jenis, nomor, tahun = parse_slug(slug)
            e = {
                "detailsId": details_id,
                "slug": slug,
                "jenis": jenis,
                "nomor": nomor,
                "tahun": tahun,
                "status": "TERDAFTAR",
            }
            terlihat[details_id] = e
            with OUT.open("a", encoding="utf-8") as f:
                f.write(json.dumps(e, ensure_ascii=False) + "\n")
        halaman_baru_total += 1
        time.sleep(DELAY)

    print(f"[crawl] TOTAL entri {args.jenis}: {len(terlihat)}")
