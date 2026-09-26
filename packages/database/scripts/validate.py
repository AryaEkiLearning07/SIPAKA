"""
Gerbang Keyakinan (Confidence Gate) — Mesin SIPAKA M2.
Memeriksa hasil parse AST dan memberi skor + daftar masalah:
  - Gap & duplikat penomoran pasal (deteksi otomatis yang menangkap KUHP/PDP kemarin)
  - Urutan BAB (romawi) bila ada
  - Urutan ayat per pasal
  - Cakupan konten (pasal kosong)
Keputusan: skor >= 85 dan tanpa gap/duplikat = PASS (AUTO_PUBLISH); selain itu QUARANTINE.
"""
import re


def _num(label: str) -> float | None:
    m = re.search(r"(\d+)([a-z]?)", label)
    if not m:
        return None
    return int(m.group(1)) + (0.1 if m.group(2) else 0.0)


def cek_urutan(nums: list[float], jenis: str, issues: list[str]) -> None:
    """Nomor harus berurutan 1..max tanpa duplikat (sufis huruf diperbolehkan)."""
    if not nums:
        return
    int_only = sorted(n for n in nums if float(n).is_integer())
    dups = sorted({n for n in int_only if int_only.count(n) > 1})
    if dups:
        issues.append(f"{jenis} DUPLIKAT: {dups[:8]}{'…' if len(dups) > 8 else ''}")
    maks = int(max(int_only))
    hilang = [n for n in range(1, maks + 1) if n not in int_only]
    if hilang:
        issues.append(f"{jenis} GAP (nomor hilang dari 1..{maks}): {hilang[:10]}{'…' if len(hilang) > 10 else ''}")


def validate(doc: dict) -> dict:
    issues: list[str] = []

    # ATURAN PENTING: dokumen dengan 0 pasal terbaca = gagal total (scan rusak/format
    # tak dikenal), BUKAN lolos. Tanpa aturan ini dokumen tak terbaca lolos diam-diam.
    stats0 = doc.get("stats", {})
    if stats0.get("pasal", 0) == 0:
        return {
            "slug": doc.get("slug"),
            "skor": 0,
            "keputusan": "QUARANTINE",
            "jumlah": stats0,
            "issues": ["PASAL KOSONG TOTAL: 0 pasal terbaca dari seluruh dokumen — kemungkinan scan rusak / format tidak dikenal / bukan naskah peraturan."],
        }
    pasal_nums: list[float] = []
    pasal_kosong: list[str] = []
    ayat_dups: list[str] = []
    bab_nums: list[float] = []

    def walk_pasal(pasal: dict) -> None:
        label = pasal.get("label", "")
        n = _num(label)
        if n is not None:
            pasal_nums.append(n)
        if not (pasal.get("content") or "").strip() and not (pasal.get("children") or []):
            pasal_kosong.append(pasal["canonicalPath"])
        # Urutan ayat dalam pasal ini
        ayat_nums = [_num(a["label"]) for a in pasal.get("children", []) if a["type"] == "AYAT"]
        int_ayat = sorted(a for a in ayat_nums if a is not None and float(a).is_integer())
        dups = sorted({a for a in int_ayat if int_ayat.count(a) > 1})
        if dups:
            ayat_dups.append(f"{pasal['canonicalPath']}: {dups[:5]}")
        for a in pasal.get("children", []):
            walk_pasal(a) if a.get("type") in ("BUKU", "BAB") else None
            for h in a.get("children", []):
                if h.get("type") in ("BUKU", "BAB"):
                    walk_pasal(h)

    for top in doc.get("nodes", []):
        if top.get("type") in ("BUKU", "BAB"):
            rn = _num(top["label"])
            if rn is not None and float(rn).is_integer():
                bab_nums.append(rn)
            for child in top.get("children", []):
                if child.get("type") in ("BUKU", "BAB"):
                    rn2 = _num(child["label"])
                    if rn2 is not None and float(rn2).is_integer():
                        bab_nums.append(rn2)
                walk_pasal(child)
        elif top.get("type") == "PASAL":
            walk_pasal(top)

    cek_urutan(pasal_nums, "PASAL", issues)
    if bab_nums:
        cek_urutan(bab_nums, "BAB", issues)
    if ayat_dups:
        issues.append(f"AYAT DUPLIKAT: {ayat_dups[:5]}{'…' if len(ayat_dups) > 5 else ''}")
    if pasal_kosong:
        issues.append(f"PASAL KOSONG: {len(pasal_kosong)} ({pasal_kosong[:3]}{'…' if len(pasal_kosong) > 3 else ''})")

    skor = 100
    for it in issues:
        if it.startswith("PASAL GAP"):
            skor -= 15
        elif it.startswith("PASAL DUPLIKAT"):
            skor -= 15
        elif it.startswith("BAB GAP") or it.startswith("BAB DUPLIKAT"):
            skor -= 10
        elif it.startswith("AYAT DUPLIKAT"):
            skor -= 5
        elif it.startswith("PASAL KOSONG"):
            skor -= 5

    skor = max(0, min(100, skor))
    tanpa_cacat_struktur = not any(
        it.startswith(("PASAL GAP", "PASAL DUPLIKAT", "BAB GAP", "BAB DUPLIKAT")) for it in issues
    )
    keputusan = "PASS" if (tanpa_cacat_struktur and skor >= 85) else "QUARANTINE"

    return {
        "slug": doc.get("slug"),
        "skor": skor,
        "keputusan": keputusan,
        "jumlah": doc.get("stats"),
        "issues": issues,
    }
