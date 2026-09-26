"""
Akuisisi otomatis PDF resmi UU dari JDIH BPK (peraturan.bpk.go.id).
Alur per dokumen: cari di /Search -> buka /Details/<id> -> ambil /Download/<fileid> -> unduh -> hash.
Politeness: jeda antar-request; identitas user-agent jelas.
"""
import hashlib
import json
import re
import sys
import time
from pathlib import Path

import requests

BASE = "https://peraturan.bpk.go.id"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36 SIPAKA-Research/1.0"
DELAY = 2.0
HERE = Path(__file__).resolve().parent.parent / "seed"
PDF_DIR = HERE / "pdfs"
STRUCT_DIR = HERE / "structured"


def get(url: str) -> requests.Response | None:
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=45, allow_redirects=True)
        return r
    except Exception as e:
        print(f"  ! gagal {url}: {e}")
        return None


def cari_details_id(nomor: int, tahun: int, keyword: str) -> str | None:
    """Cari ID /Details/<id> via kata kunci judul, cocokkan slug uu-no-<n>-tahun-<y>."""
    slug = f"uu-no-{nomor}-tahun-{tahun}"
    for hal in (1, 2, 3):
        r = get(f"{BASE}/Search?keywords={keyword.replace(' ', '%20')}&page={hal}")
        if not r:
            continue
        for m in re.finditer(r"/Details/(\d+)/([a-z0-9-]+)", r.text):
            if m.group(2) == slug:
                return m.group(1)
        time.sleep(DELAY)
    return None


def unduh(details_id: str, nomor: int, tahun: int) -> tuple[Path, str, str] | None:
    r = get(f"{BASE}/Details/{details_id}/uu-no-{nomor}-tahun-{tahun}")
    if not r:
        return None
    m = re.search(r'href="(/Download/[^"]+)"', r.text)
    if not m:
        print(f"  ! tautan /Download tidak ditemukan di Details {details_id}")
        return None
    dl_url = BASE + m.group(1).replace("&amp;", "&")
    pdf = PDF_DIR / f"uu-{nomor}-{tahun}.pdf"
    r2 = get(dl_url)
    if not r2 or not r2.content[:4] == b"%PDF":
        print(f"  ! unduhan bukan PDF: {dl_url}")
        return None
    pdf.write_bytes(r2.content)
    sha = hashlib.sha256(r2.content).hexdigest()
    judul = re.search(r"<title>([^<]+)", r.text)
    return pdf, sha, (judul.group(1).strip() if judul else "")


def proses(nomor: int, tahun: int, keyword: str) -> dict | None:
    print(f"[{nomor}/{tahun}] mencari: {keyword}…")
    details_id = cari_details_id(nomor, tahun, keyword)
    if not details_id:
        print(f"  ! Details tidak ditemukan")
        return None
    time.sleep(DELAY)
    hasil = unduh(details_id, nomor, tahun)
    if not hasil:
        return None
    pdf, sha, judul = hasil
    print(f"  ✓ {pdf.name} | sha256={sha[:16]}… | {judul[:60]}")
    return {"nomor": nomor, "tahun": tahun, "pdf": str(pdf), "sha256": sha,
            "details": f"{BASE}/Details/{details_id}", "judul": judul}


if __name__ == "__main__":
    target = [
        (1, 2023, "kuhp"),
        (27, 2022, "pelindungan data pribadi"),
        (13, 2003, "ketenagakerjaan"),
        (40, 2007, "perseroan terbatas"),
        (1, 1974, "perkawinan"),
    ]
    if len(sys.argv) > 1:
        target = [tuple(t) for t in json.loads(sys.argv[1])]
    PDF_DIR.mkdir(exist_ok=True)
    STRUCT_DIR.mkdir(exist_ok=True)
    hasil = []
    for nomor, tahun, keyword in target:
        h = proses(nomor, tahun, keyword)
        if h:
            hasil.append(h)
        time.sleep(DELAY)
    out = STRUCT_DIR / "_akuisisi-log.json"
    existing = json.loads(out.read_text()) if out.exists() else []
    existing.extend(hasil)
    out.write_text(json.dumps(existing, ensure_ascii=False, indent=1))
    print(f"Selesai: {len(hasil)}/{len(target)} berhasil -> {out}")
