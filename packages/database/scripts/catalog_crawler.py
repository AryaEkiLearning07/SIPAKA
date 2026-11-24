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
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "id,en-US;q=0.7,en;q=0.3",
}
DELAY = 1.5
HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"
OUT = HERE / "catalog-index.jsonl"


JENIS_MAP = {
    "uud": "7",
    "uu": "8",
    "perpu": "9",
    "pp": "10",
    "perpres": "11",
    "keppres": "12",
    "inpres": "13",
    "permen": "15",
    "pmk": "42",
    "permenaker": "105",
    "permendag": "67",
    "permen_esdm": "147",
    "permendagri": "40",
    "permenkumham": "46",
    "perda": "19",
    "pergub": "20",
    "perbup": "23",
    "perwali": "30",
    "qanun": "34",
    "tap_mpr": "245",
}


def halaman_tahun(jenis: str, tahun: int, max_pages: int = 3):
    jenis_id = JENIS_MAP.get(jenis.lower(), jenis)
    all_entries = []
    for page in range(1, max_pages + 1):
        url = f"{BASE}/Search?keywords=&jenis={jenis_id}&tahun={tahun}&page={page}"
        try:
            r = requests.get(url, headers=UA, timeout=45)
            items = list(dict.fromkeys(re.findall(r"/Details/(\d+)/([a-z0-9-]+)", r.text)))
            if not items:
                break
            all_entries.extend(items)
            if len(items) < 20:
                break
            time.sleep(0.5)
        except Exception as e:
            print(f"  ! gagal tahun {tahun} hal {page}: {e}")
            break
    return list(dict.fromkeys(all_entries))


def halaman(jenis: str, page: int):
    jenis_id = JENIS_MAP.get(jenis.lower(), jenis)
    url = f"{BASE}/Search?keywords=&jenis={jenis_id}&page={page}"
    try:
        r = requests.get(url, headers=UA, timeout=60)
    except Exception as e:
        print(f"  ! gagal hal {page}: {e}")
        return []
    return list(dict.fromkeys(re.findall(r"/Details/(\d+)/([a-z0-9-]+)", r.text)))


def parse_slug(slug: str):
    # Standar: uu-no-11-tahun-2008 | pp-no-24-tahun-1997 | perpres-no-53-tahun-2021
    m = re.match(r"^([a-z-]+?)-no-(?:nomor-)?(\d+)-tahun-(\d{4})$", slug)
    if m:
        return m.group(1).upper(), m.group(2), m.group(3)
    m = re.match(r"^uu-no-(\d+)-tahun-(\d{4})$", slug)
    if m:
        return "UU", m.group(1), m.group(2)
    # Regional: perda-kab-xyz-no-1-tahun-2024 | pergub-dki-no-2-tahun-2020 | perbup-... | perwali-...
    m_reg = re.search(r"^(perda|pergub|perbup|perwali|qanun).*?-(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)?(\d{4})", slug)
    if m_reg:
        return m_reg.group(1).upper(), m_reg.group(2), m_reg.group(3)
    # Fallback generic
    m_gen = re.search(r"(?:no-)?(?:nomor-)?(\d+)-(?:tahun-)?(\d{4})", slug)
    if m_gen:
        prefix = slug.split("-")[0].upper()
        return prefix, m_gen.group(1), m_gen.group(2)
    return slug.split("-")[0].upper(), None, None


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--jenis", required=True)
    ap.add_argument("--pages-per-year", type=int, default=3, help="Maksimal halaman per tahun (default: 3 = 60 entri)")
    ap.add_argument("--start-year", type=int, default=2026, help="Tahun awal (default: 2026)")
    ap.add_argument("--end-year", type=int, default=1945, help="Tahun akhir (default: 1945)")
    args = ap.parse_args()

    terlihat: dict[str, dict] = {}
    if OUT.exists():
        for line in OUT.read_text(encoding="utf-8").splitlines():
            if line.strip():
                e = json.loads(line)
                terlihat[e["detailsId"]] = e

    print(f"[crawl] jenis={args.jenis} — entri lama: {len(terlihat)}")
    halaman_baru_total = 0
    tahun_list = list(range(args.start_year, args.end_year - 1, -1))
    for tahun in tahun_list:
        entries = halaman_tahun(args.jenis, tahun, max_pages=args.pages_per_year)
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
