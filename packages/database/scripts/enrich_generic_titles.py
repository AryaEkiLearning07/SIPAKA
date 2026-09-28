"""
Skrip untuk memperkaya seluruh undang-undang di MariaDB yang masih berformat judul generik:
"Undang-Undang Nomor X Tahun Y" -> ditarik judul substantif "tentang ..." dan abstrak resminya dari BPK.
"""
import json
from pathlib import Path
import re
import requests
import pymysql

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 SIPAKA-Research/1.0"}

def load_index():
    index_path = Path(__file__).resolve().parent.parent / "seed" / "structured" / "catalog-index.jsonl"
    slug_map = {}
    if index_path.exists():
        for line in index_path.read_text("utf-8").splitlines():
            if line.strip():
                try:
                    e = json.loads(line)
                    if e.get("slug"):
                        slug_map[e["slug"]] = e
                except Exception:
                    pass
    return slug_map

def main():
    slug_map = load_index()
    conn = pymysql.connect(host="localhost", port=3307, user="root", password="", database="lexvera_db")
    cur = conn.cursor()
    cur.execute("SELECT id, slug, number, year, title FROM legal_instruments WHERE year IN (2025, 2024)")
    rows = cur.fetchall()
    print(f"[enrich] Memeriksa {len(rows)} undang-undang 2024-2025...", flush=True)

    for inst_id, slug, num, yr, old_title in rows:
        idx_entry = slug_map.get(slug)
        details_id = idx_entry.get("detailsId") if idx_entry else None
        detail_slug = slug
        if not details_id:
            continue

        try:
            rd = requests.get(f"https://peraturan.bpk.go.id/Details/{details_id}/{detail_slug}", headers=UA, timeout=20)
            if rd.ok:
                html = rd.text
                mt = re.search(r"<title>([^<]+)</title>", html, re.IGNORECASE)
                title_text = mt.group(1) if mt else ""
                title_clean = re.sub(r"\s+[|–\-]\s+.*?(BPK|JDIH|Database|Peraturan).*$", "", title_text, flags=re.IGNORECASE).strip()

                m_tentang = re.search(r"TENTANG\s+([^<\r\n]+)", html, re.IGNORECASE)
                tentang = m_tentang.group(1).strip() if m_tentang else ""

                m_abs = re.search(r"ABSTRAK:\s*</td>\s*<td>(.*?)</td>", html, re.DOTALL | re.IGNORECASE)
                abstrak = ""
                if m_abs:
                    li = re.search(r"<li>(.*?)</li>", m_abs.group(1), re.DOTALL)
                    if li:
                        abstrak = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", li.group(1))).strip()

                m_ln = re.search(r"LN\.\d{4}/NO\.(\d+)", html)
                ln = int(m_ln.group(1)) if m_ln else None
                m_tln = re.search(r"TLN\s+NO\.(\d+)", html)
                tln = int(m_tln.group(1)) if m_tln else None

                final_title = title_clean if "tentang" in title_clean.lower() else (f"UU No. {num} Tahun {yr} tentang {tentang}" if tentang else old_title)
                short_title = f"UU {num}/{yr}"

                cur.execute(
                    "UPDATE legal_instruments SET title=%s, shortTitle=%s, description=%s, lnNumber=%s, tlnNumber=%s WHERE id=%s",
                    (final_title, short_title, abstrak or None, ln, tln, inst_id)
                )
                conn.commit()
                print(f"  [OK] {slug} -> {final_title[:60]}", flush=True)
        except Exception as e:
            print(f"  ! Error {slug}: {e}", flush=True)

    conn.close()
    print("[enrich] Selesai.", flush=True)

if __name__ == "__main__":
    main()
