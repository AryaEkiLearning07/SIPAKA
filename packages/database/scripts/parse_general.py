"""
Parser Naskah Generik (M2 tahap 1) — membaca PDF UU/PP/Perpres mana pun dari JDIH BPK
dan memecahnya menjadi pohon BAB -> PASAL -> AYAT/ANGKA -> HURUF.

Pemakaian:
  python parse_general.py --pdf ../seed/pdfs/uu-1-2023.pdf --slug uu-1-2023 \
      --url "https://..." [--sha <sha256>]

Prinsip:
- Status keluaran selalu PARSED_AUTO_MENUNGGU_KURASI — kejujuran di atas segalanya.
- Normalisasi HANYA merapikan spasi & artefak layout; tidak ada kata yang diubah.
- Mode penomoran per pasal ditentukan otomatis: butir pertama "N." = ANGKA (definisi),
  butir pertama "(N)" = AYAT.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from pdfminer.high_level import extract_text

HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
         "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
         "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20, "XXI": 21,
         "XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25, "XXVI": 26, "XXVII": 27,
         "XXVIII": 28, "XXIX": 29, "XXX": 30}


def roman_to_int(r: str) -> int:
    return ROMAN.get(r.upper(), 99)


def normalisasi(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"\s+", " ", s).strip()
    tokens = s.split(" ")
    out, i = [], 0
    while i < len(tokens):
        j = i
        while j < len(tokens) and re.fullmatch(r"[a-z]", tokens[j]):
            j += 1
        if j - i >= 3:
            out.append("".join(tokens[i:j]))
            i = j
        else:
            out.append(tokens[i])
            i += 1
    return " ".join(out)


def buang_derau(lines):
    drop = re.compile(
        r"^(-\s*\d+\s*-\s*$"
        r"|\d{1,4}\s*$"
        r"|PRES\s?IDEN\s*$|PRESIDEN REPUBLIK INDONESIA\s*$|REPUBLIK INDONESIA\s*$"
        r"|www\..*|http[s]?://\S*)$",
        re.IGNORECASE,
    )
    return [ln for ln in lines if ln.strip() and not drop.match(ln.strip())]


def temukan_awal_body(teks: str) -> int:
    """Awal batang tubuh: 'Menetapkan' / 'MEMUTUSKAN'; fallback BAB pertama."""
    for kunci in ("Menetapkan", "MEMUTUSKAN"):
        i = teks.rfind(kunci)
        if i >= 0:
            return i
    m = re.search(r"BAB\s+[IVXLCDM]+\s*$", teks, re.MULTILINE)
    return m.start() if m else 0


def temukan_akhir_body(teks: str, awal: int) -> int:
    """Akhir batang tubuh: sebelum Penjelasan/Lampiran bila ada."""
    kandidat = []
    for kunci in ("PENJELASAN", "Lampiran", "LAMPIRAN"):
        m = re.search(kunci, teks[awal:])
        if m:
            kandidat.append(awal + m.start())
    return min(kandidat) if kandidat else len(teks)


def parse(pdf_path: str, slug: str, url: str = "", sha256: str = "") -> dict:
    teks = extract_text(pdf_path)
    awal = temukan_awal_body(teks)
    akhir = temukan_akhir_body(teks, awal)
    lines = buang_derau(teks[awal:akhir].split("\n"))

    nodes, bab, pasal, ayat, huruf = [], None, None, None, None
    buku = None
    caps_run: list[str] = []
    pasal_index: dict[str, ProvisionNode] = {}  # global lintas-bab (artefak layout)

    re_bab = re.compile(r"^BAB\s+([IVXLCDM]+)\s*$")
    re_buku = re.compile(r"^BUKU\s+([IVXLCDM]+)\s*$")
    re_pasal = re.compile(r"^Pasal\s+(\d+[a-z]?)\s*$")
    re_ayat = re.compile(r"^\((\d+[a-z]?)\)\s+(.*)$")
    re_angka = re.compile(r"^(\d+)\.\s+(.*)$")
    re_huruf = re.compile(r"^([a-z])\.\s+(.*)$")
    re_caps = re.compile(r"^[A-Z0-9,.\-()/&' ]+$")

    def judul_dari_run():
        kandidat = [l for l in caps_run if not l.startswith("BAB") and not l.endswith(".")]
        return normalisasi(" ".join(kandidat))

    for ln in lines:
        s = ln.strip()
        m = re_buku.match(s)
        if m:
            roman = m.group(1).upper()
            path = f"{slug}/buku-{roman.lower()}"
            existing = next((n for n in nodes if n["canonicalPath"] == path), None)
            if existing:
                buku = existing
            else:
                buku = {"canonicalPath": path, "type": "BUKU",
                        "orderIndex": roman_to_int(roman), "label": f"BUKU {roman}",
                        "title": "", "content": "", "versionTag": "ORIGINAL", "children": []}
                nodes.append(buku)
            caps_run = []
            bab = pasal = ayat = huruf = None
            continue
        m = re_bab.match(s)
        if m:
            roman = m.group(1).upper()
            bab_path = f"{slug}/{'buku-' + re.match(r'buku-([ivxlcdm]+)', buku['canonicalPath']).group(1) + '/' if buku else ''}bab-{roman.lower()}"
            existing_bab = next((n for n in (buku["children"] if buku else nodes) if n["canonicalPath"] == bab_path), None)
            if existing_bab:
                bab = existing_bab
            else:
                bab = {"canonicalPath": bab_path, "type": "BAB",
                   "orderIndex": roman_to_int(roman), "label": f"BAB {roman}",
                   "title": judul_dari_run(), "content": "", "versionTag": "ORIGINAL",
                   "children": []}
            caps_run = []
            if existing_bab is None:
                (buku["children"] if buku else nodes).append(bab)
            pasal = ayat = huruf = None
            continue
        if re_pasal.match(s):
            caps_run = []
        elif re_caps.match(s):
            caps_run.append(s)
        else:
            caps_run = []
        if buku is not None and buku["title"] == "" and re_caps.match(s) and not s.endswith(".") and not re_pasal.match(s) and not re_bab.match(s):
            buku["title"] = s
            continue
        if bab is not None and pasal is None:
            if re_pasal.match(s):
                pass
            elif bab["title"] == "" and re_caps.match(s) and not s.endswith("."):
                bab["title"] = (bab["title"] + " " + s).strip()
                continue
            else:
                continue
        m = re_pasal.match(s)
        if m:
            n = m.group(1)
            path = f"{slug}/pasal-{n}"
            container = bab["children"] if bab is not None else nodes
            existing = pasal_index.get(path) or next((c for c in container if c["canonicalPath"] == path), None)
            if existing:
                # artefak pindah halaman: judul pasal terulang — sambung kontinuitas
                pasal = existing
                ayat = huruf = None
                continue
            order = float(n[:-1]) + 0.1 if not n.isdigit() else int(n)
            pasal = {"canonicalPath": path, "type": "PASAL",
                     "orderIndex": order, "label": f"Pasal {n}", "content": "",
                     "versionTag": "ORIGINAL", "children": []}
            pasal_index[path] = pasal
            container.append(pasal)
            ayat = huruf = None
            continue
        if pasal is None:
            continue
        m = re_ayat.match(s)
        if m:
            n = m.group(1)
            path = f"{pasal['canonicalPath']}/ayat-{n}"
            existing = next((c for c in pasal["children"] if c["canonicalPath"] == path), None)
            if existing:
                existing["content"] = normalisasi((existing["content"] + " " + m.group(2)).strip())
                ayat = existing; huruf = None
                continue
            order = float(n[:-1]) + 0.1 if not n.isdigit() else int(n)
            ayat = {"canonicalPath": path, "type": "AYAT", "orderIndex": order,
                    "label": f"Ayat ({n})", "content": normalisasi(m.group(2)),
                    "versionTag": "ORIGINAL", "children": []}
            pasal["children"].append(ayat); huruf = None
            continue
        m = re_angka.match(s)
        if m:
            n = int(m.group(1))
            path = f"{pasal['canonicalPath']}/angka-{n}"
            existing = next((c for c in pasal["children"] if c["canonicalPath"] == path), None)
            if existing:
                existing["content"] = normalisasi((existing["content"] + " " + m.group(2)).strip())
                ayat = existing; huruf = None
                continue
            ayat = {"canonicalPath": path, "type": "ANGKA", "orderIndex": n,
                    "label": f"Angka {n}", "content": normalisasi(m.group(2)),
                    "versionTag": "ORIGINAL", "children": []}
            pasal["children"].append(ayat); huruf = None
            continue
        m = re_huruf.match(s)
        if m and ayat is not None:
            h = m.group(1)
            path = f"{ayat['canonicalPath']}/huruf-{h}"
            existing = next((c for c in ayat["children"] if c["canonicalPath"] == path), None)
            if existing:
                existing["content"] = normalisasi((existing["content"] + " " + m.group(2)).strip())
                huruf = existing
                continue
            huruf = {"canonicalPath": path, "type": "HURUF", "orderIndex": ord(h) - 96,
                     "label": f"Huruf {h}", "content": normalisasi(m.group(2)),
                     "versionTag": "ORIGINAL", "children": []}
            ayat["children"].append(huruf)
            continue
        if s:
            target = huruf or ayat or pasal
            target["content"] = normalisasi((target["content"] + " " + s).strip())

    for b in nodes:
        if "title" in b:
            b["title"] = normalisasi(b["title"]).upper()

    n_bab = len(nodes)
    n_pasal = sum(len(b["children"]) for b in nodes)
    n_ayat = sum(len(p["children"]) for b in nodes for p in b["children"])
    n_huruf = sum(len(a["children"]) for b in nodes for p in b["children"] for a in p["children"])

    return {
        "slug": slug,
        "source": {
            "url": url, "sha256": sha256,
            "penerbit": "JDIH BPK (peraturan.bpk.go.id)",
            "metode": "pdfminer.six + parser generik",
            "status": "PARSED_AUTO_MENUNGGU_KURASI",
        },
        "stats": {"bab": n_bab, "pasal": n_pasal, "ayat_angka": n_ayat, "huruf": n_huruf},
        "nodes": nodes,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--url", default="")
    ap.add_argument("--sha", default="")
    args = ap.parse_args()

    sha = args.sha or hashlib.sha256(Path(args.pdf).read_bytes()).hexdigest()
    hasil = parse(args.pdf, args.slug, args.url, sha)
    out = HERE / f"{args.slug}.json"
    out.write_text(json.dumps(hasil, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{args.slug}: {hasil['stats']} -> {out.name}")
