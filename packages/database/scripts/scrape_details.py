"""
Scraper Metadata Detail BPK (Mesin 1b) — perkaya catalog-index dengan:
  judul, lnNumber, tlnNumber, enactedAt, pdfUrl,
  diubahOleh (list detailsId UU pengubah),
  mencabut (list detailsId UU yang dicabut)

Pemakaian:
  python scrape_details.py                    # proses semua TERDAFTAR belum punya judul
  python scrape_details.py --slug uu-no-40-tahun-2007
  python scrape_details.py --jenis UU --limit 50

Output: seed/structured/catalog-rich.jsonl  (idempoten — update bila sudah ada)
"""
import argparse
import json
import re
import time
from pathlib import Path

import requests

BASE = "https://peraturan.bpk.go.id"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 SIPAKA-Research/1.0"}
DELAY = 1.5
HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"
INDEX_IN  = HERE / "catalog-index.jsonl"
RICH_OUT  = HERE / "catalog-rich.jsonl"


# ─── Parser Helper ─────────────────────────────────────────────────────────────

def _get(url: str, timeout: int = 30) -> requests.Response | None:
    try:
        r = requests.get(url, headers=UA, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        return r
    except Exception as e:
        print(f"  ! GET gagal {url}: {e}")
        return None


def _text(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def parse_ln(html: str) -> tuple[str | None, str | None]:
    """Ekstrak LN dan TLN dari teks seperti 'LN.2007/NO.106, TLN NO.4756'."""
    m = re.search(r"LN\.\d{4}/NO\.(\d+)", html)
    ln = m.group(1) if m else None
    m = re.search(r"TLN\s+NO\.(\d+)", html)
    tln = m.group(1) if m else None
    return ln, tln


def parse_tanggal(html: str) -> str | None:
    """Cari pola tanggal Indonesia: '16 Agustus 2007'."""
    BULAN = {"januari":"01","februari":"02","maret":"03","april":"04",
              "mei":"05","juni":"06","juli":"07","agustus":"08",
              "september":"09","oktober":"10","november":"11","desember":"12"}
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", html)
    if m:
        bln = BULAN.get(m.group(2).lower())
        if bln:
            return f"{m.group(3)}-{bln}-{int(m.group(1)):02d}"
    return None


def parse_judul(html: str, slug: str) -> str:
    """Cari judul UU dari <title> atau heading."""
    m = re.search(r"<title>([^<]{10,200})</title>", html, re.IGNORECASE)
    if m:
        t = _text(m.group(1))
        # Bersihkan suffix site (hanya potong bila ada spasi di sekitar separator agar tidak memotong Undang-Undang)
        t = re.sub(r"\s+[|–\-]\s+.*?(BPK|JDIH|Database|Peraturan).*$", "", t, flags=re.IGNORECASE).strip()
        if len(t) > 10:
            return t
    # Fallback: dari slug
    parts = slug.replace("-", " ").title()
    return parts


def parse_tentang(html: str) -> str | None:
    """Ekstrak pokok bahasan (TENTANG ...) dari baris tabel BPK."""
    m = re.search(r"TENTANG\s+([^<\r\n]+)", html, re.IGNORECASE)
    if m:
        t = _text(m.group(1)).strip()
        if len(t) > 3:
            return t
    return None


def parse_abstrak(html: str) -> list[str]:
    """Ekstrak butir-butir abstrak dari blok ABSTRAK:."""
    m = re.search(r"ABSTRAK:\s*</td>\s*<td>(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
    if not m:
        return []
    items = []
    for li in re.finditer(r"<li>(.*?)</li>", m.group(1), re.DOTALL | re.IGNORECASE):
        txt = _text(li.group(1)).strip()
        if txt:
            items.append(txt)
    return items


def parse_pdf_url(html: str) -> str | None:
    m = re.search(r'href="(/Download/[^"]+)"', html)
    if m:
        url = m.group(1).replace("&amp;", "&")
        return BASE + url
    return None


def parse_relasi(html: str, label: str) -> list[dict]:
    """
    Ekstrak relasi antar-peraturan dari blok HTML BPK di bawah label:
    'Diubah dengan :', 'Mencabut :', 'Dicabut dengan :', 'Dicabut sebagian dengan :'.
    """
    m = re.search(rf"{re.escape(label)}\s*:", html, re.IGNORECASE)
    if not m:
        return []
    pos = m.end()
    sub = html[pos:pos+4000]
    next_sec = re.search(r"(?:Diubah dengan|Mencabut|Dicabut|STATUS PERATURAN|UJI MATERI|ABSTRAK)\s*:", sub, re.IGNORECASE)
    if next_sec:
        sub = sub[:next_sec.start()]

    items = []
    pattern = r'href="/Details/(\d+)/([a-z0-9-]+)"[^>]*>([^<]+)</a>(?:\s*<span class="text-muted">tentang</span>\s*([^<\r\n]+))?'
    for am in re.finditer(pattern, sub, re.IGNORECASE):
        items.append({
            "detailsId": am.group(1),
            "slug": am.group(2),
            "label": am.group(3).strip(),
            "tentang": (am.group(4) or "").strip(),
        })
    return items


def scrape_details(details_id: str, slug: str) -> dict:
    url = f"{BASE}/Details/{details_id}/{slug}"
    r = _get(url)
    if not r:
        return {}

    html = r.text
    judul = parse_judul(html, slug)
    tentang = parse_tentang(html)
    abstrak = parse_abstrak(html)
    ln, tln = parse_ln(html)
    enacted = parse_tanggal(html)
    pdf_url = parse_pdf_url(html)

    diubah_oleh = parse_relasi(html, "Diubah dengan")
    mencabut = parse_relasi(html, "Mencabut")
    dicabut_penuh = parse_relasi(html, "Dicabut dengan")
    dicabut_sebagian = parse_relasi(html, "Dicabut sebagian dengan")

    return {
        "judul": judul,
        "tentang": tentang,
        "abstrak": abstrak,
        "lnNumber": ln,
        "tlnNumber": tln,
        "enactedAt": enacted,
        "pdfUrl": pdf_url,
        "diubahOleh": diubah_oleh,        # list {detailsId, slug, label, tentang}
        "mencabut": mencabut,              # list {detailsId, slug, label, tentang}
        "dicabutOleh": dicabut_penuh + dicabut_sebagian,
    }


# ─── Main ──────────────────────────────────────────────────────────────────────

def load_index() -> dict[str, dict]:
    if not INDEX_IN.exists():
        return {}
    rows: dict[str, dict] = {}
    for line in INDEX_IN.read_text("utf-8").splitlines():
        if line.strip():
            e = json.loads(line)
            rows[e["detailsId"]] = e
    return rows


def load_rich() -> dict[str, dict]:
    if not RICH_OUT.exists():
        return {}
    rows: dict[str, dict] = {}
    for line in RICH_OUT.read_text("utf-8").splitlines():
        if line.strip():
            e = json.loads(line)
            rows[e["detailsId"]] = e
    return rows


def save_rich(rich: dict[str, dict]) -> None:
    lines = [json.dumps(e, ensure_ascii=False) for e in rich.values()]
    RICH_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", help="Proses slug tertentu saja")
    ap.add_argument("--jenis", default="UU", help="Filter jenis (default: UU)")
    ap.add_argument("--limit", type=int, default=0, help="Maks entri diproses (0=semua)")
    ap.add_argument("--force", action="store_true", help="Re-scrape meski sudah ada judul")
    args = ap.parse_args()

    index = load_index()
    rich  = load_rich()

    # Tentukan target
    if args.slug:
        targets = [e for e in index.values() if e["slug"] == args.slug]
    else:
        targets = [
            e for e in index.values()
            if (e.get("jenis") or "").upper() == args.jenis.upper()
        ]
        if not args.force:
            targets = [e for e in targets if e["detailsId"] not in rich or not rich[e["detailsId"]].get("judul")]

    if args.limit:
        targets = targets[:args.limit]

    print(f"[scrape_details] {len(targets)} entri akan diproses (jenis={args.jenis})")

    ok = skip = err = 0
    for i, entry in enumerate(targets, 1):
        did  = entry["detailsId"]
        slug = entry["slug"]
        print(f"  [{i}/{len(targets)}] {slug} ({did})…", end=" ")
        try:
            detail = scrape_details(did, slug)
            if not detail:
                print("SKIP (request gagal)")
                skip += 1
                continue
            merged = {**entry, **detail}
            rich[did] = merged
            # Simpan inkremental tiap 10 entri
            if i % 10 == 0:
                save_rich(rich)
            print(f"OK | judul={detail.get('judul','')[:50]} | diubahOleh={detail.get('diubahOleh')}")
            ok += 1
        except Exception as exc:
            print(f"ERROR: {exc}")
            err += 1
        time.sleep(DELAY)

    save_rich(rich)
    print(f"\n[scrape_details] Selesai — OK:{ok} skip:{skip} error:{err}")
    print(f"Output: {RICH_OUT} ({len(rich)} total entri)")


if __name__ == "__main__":
    main()
