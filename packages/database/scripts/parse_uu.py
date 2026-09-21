"""
Parser Naskah UU — tahap deterministik (M2 tahap 1).
Input : pdfs/uu-11-2008.pdf (PDF resmi JDIH BPK)
Output: structured/uu-11-2008.json (pohon BAB -> PASAL -> AYAT/ANGKA -> HURUF)

Catatan kurasi:
- Naskah hasil ekstraksi otomatis berstatus DRAFT menurut filosofi platform —
  wajib lolos kurasi manusia sebelum dinyatakan PUBLISHED.
- Normalisasi HANYA: spasi berlebih dirapatkan + run token huruf tunggal
  artefak layout disambung; tidak ada kata yang diubah.
"""
import json
import re
from pathlib import Path

from pdfminer.high_level import extract_text

HERE = Path(__file__).resolve().parent.parent / "seed" / "structured"
SLUG = "uu-11-2008"
SHA256 = "3c174f55b4a7982af268a24316e3353c8e712fc8a57e87a9fdf0502da4ea0af3"
SOURCE_URL = "https://peraturan.bpk.go.id/Download/26683/UU%20Nomor%2011%20Tahun%202008.pdf"

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
         "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14}


def normalisasi(s: str) -> str:
    """Rapikan spasi; sambung run token 1-huruf (artefak layout) tanpa mengubah kata."""
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
    """Buang header/footer halaman. Aman: hanya baris yang BENAR-BENAR derau."""
    drop = re.compile(
        r"^(-\s*\d+\s*-\s*$"        # "- 4 -"
        r"|\d{1,3}\s*$"             # nomor halaman polos (baris berisi angka saja)
        r"|PRES\s?IDEN\s*$|PRESIDEN REPUBLIK INDONESIA\s*$|REPUBLIK INDONESIA\s*$"
        r"|www\..*|http[s]?://\S*)$",
        re.IGNORECASE,
    )
    return [ln for ln in lines if ln.strip() and not drop.match(ln.strip())]


def main():
    teks = extract_text(str(HERE.parent / "pdfs" / f"{SLUG}.pdf"))
    (HERE / f"{SLUG}-pdfminer.txt").write_text(teks, encoding="utf-8")

    # Batasi ke batang tubuh: mulai 'Menetapkan', potong sebelum PENJELASAN
    i = teks.find("Menetapkan")
    if i < 0:
        raise SystemExit("kata 'Menetapkan' tidak ditemukan")
    m_penj = re.search(r"PENJELASAN", teks[i:])
    body = teks[i : i + m_penj.start()] if m_penj else teks[i:]
    lines = buang_derau(body.split("\n"))

    nodes, bab, pasal, ayat, huruf = [], None, None, None, None
    caps_run = []  # run baris-kapital berurutan (kandidat judul BAB yang tercetak sebelum label)

    re_bab = re.compile(r"^BAB\s+([IVX]+)\s*$")
    re_pasal = re.compile(r"^Pasal\s+(\d+)\s*$")
    re_ayat = re.compile(r"^\((\d+[a-z]?)\)\s+(.*)$")
    re_angka = re.compile(r"^(\d+)\.\s+(.*)$")
    re_huruf = re.compile(r"^([a-z])\.\s+(.*)$")
    re_caps = re.compile(r"^[A-Z0-9,.\-()/&' ]+$")

    def judul_dari_run():
        kandidat = [l for l in caps_run if not l.startswith("BAB") and not l.endswith(".")]
        return normalisasi(" ".join(kandidat))

    for ln in lines:
        s = ln.strip()
        m = re_bab.match(s)
        if m:
            roman = m.group(1)
            bab = {"canonicalPath": f"{SLUG}/bab-{roman.lower()}", "type": "BAB",
                   "orderIndex": ROMAN.get(roman, 99), "label": f"BAB {roman}",
                   "title": judul_dari_run(), "content": "", "versionTag": "ORIGINAL_2008",
                   "children": []}
            caps_run = []
            nodes.append(bab); pasal = ayat = huruf = None
            continue
        if re_pasal.match(s):
            caps_run = []
        elif re_caps.match(s):
            caps_run.append(s)
        else:
            caps_run = []
        if bab is not None and pasal is None:
            if re_pasal.match(s):
                pass
            elif bab["title"] == "" and re_caps.match(s) and not s.endswith("."):
                bab["title"] = (bab["title"] + " " + s).strip()
                continue
            else:
                continue
        m = re_pasal.match(s)
        if m and bab is not None:
            n = int(m.group(1))
            pasal = {"canonicalPath": f"{SLUG}/pasal-{n}", "type": "PASAL", "orderIndex": n,
                     "label": f"Pasal {n}", "content": "", "versionTag": "ORIGINAL_2008", "children": []}
            bab["children"].append(pasal); ayat = huruf = None
            continue
        if pasal is None:
            continue
        m = re_ayat.match(s)
        if m:
            n = m.group(1)
            is_sisip = not n.isdigit()
            path = f"{pasal['canonicalPath']}/ayat-{n}"
            existing = next((c for c in pasal["children"] if c["canonicalPath"] == path), None)
            if existing:
                # artefak pindah halaman: baris bernomor terulang — sambung kontinuitas teks
                existing["content"] = normalisasi((existing["content"] + " " + m.group(2)).strip())
                ayat = existing; huruf = None
                continue
            ayat = {"canonicalPath": path, "type": "AYAT",
                    "orderIndex": float(n[:-1]) + 0.1 if is_sisip else int(n),
                    "label": f"Ayat ({n})", "content": normalisasi(m.group(2)),
                    "versionTag": "ORIGINAL_2008", "children": []}
            pasal["children"].append(ayat); huruf = None
            continue
        m = re_angka.match(s)
        if m and pasal["orderIndex"] == 1:
            n = int(m.group(1))
            path = f"{pasal['canonicalPath']}/angka-{n}"
            existing = next((c for c in pasal["children"] if c["canonicalPath"] == path), None)
            if existing:
                existing["content"] = normalisasi((existing["content"] + " " + m.group(2)).strip())
                ayat = existing; huruf = None
                continue
            ayat = {"canonicalPath": path, "type": "ANGKA",
                    "orderIndex": n, "label": f"Angka {n}", "content": normalisasi(m.group(2)),
                    "versionTag": "ORIGINAL_2008", "children": []}
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
            huruf = {"canonicalPath": path, "type": "HURUF",
                     "orderIndex": ord(h) - 96, "label": f"Huruf {h}",
                     "content": normalisasi(m.group(2)), "versionTag": "ORIGINAL_2008", "children": []}
            ayat["children"].append(huruf)
            continue
        if s:
            target = huruf or ayat or pasal
            target["content"] = normalisasi((target["content"] + " " + s).strip())

    for b in nodes:
        b["title"] = normalisasi(b["title"]).upper()

    stats = {
        "bab": len(nodes),
        "pasal": sum(len(b["children"]) for b in nodes),
        "ayat_angka": sum(len(p["children"]) for b in nodes for p in b["children"]),
        "huruf": sum(len(a["children"]) for b in nodes for p in b["children"] for a in p["children"]),
    }
    out = {
        "slug": SLUG,
        "source": {
            "url": SOURCE_URL, "sha256": SHA256,
            "penerbit": "JDIH BPK (peraturan.bpk.go.id)", "diunduh": "2026-09-22",
            "metode": "pdfminer.six + parser deterministik",
            "status": "PARSED_AUTO_MENUNGGU_KURASI",
        },
        "stats": stats,
        "nodes": nodes,
    }
    (HERE / f"{SLUG}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("OK:", stats)


if __name__ == "__main__":
    main()
