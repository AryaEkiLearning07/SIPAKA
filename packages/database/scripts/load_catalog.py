"""Loader: catalog-index.jsonl -> tabel catalog_index (via SQL bulk, tanpa dependensi tambahan)."""
import json
from pathlib import Path

import pymysql  # tersedia via pdfminer? tidak — gunakan mysql CLI bila tidak ada

jsonl = Path(__file__).resolve().parent.parent / "seed" / "structured" / "catalog-index.jsonl"
rows = [json.loads(l) for l in jsonl.read_text(encoding="utf-8").splitlines() if l.strip()]

try:
    import pymysql
    conn = pymysql.connect(host="127.0.0.1", port=3307, user="root", password="", database="lexvera_db")
    with conn.cursor() as cur:
        for e in rows:
            cur.execute(
                "INSERT INTO catalog_index (id, detailsId, slug, jenis, nomor, tahun, status, diupdate) "
                "VALUES (UUID(), %s, %s, %s, %s, %s, %s, NOW()) "
                "ON DUPLICATE KEY UPDATE slug=VALUES(slug), jenis=VALUES(jenis), "
                "nomor=VALUES(nomor), tahun=VALUES(tahun), diupdate=NOW()",
                (e["detailsId"], e["slug"], e.get("jenis"), e.get("nomor"), e.get("tahun"), e.get("status", "TERDAFTAR")),
            )
    conn.commit()
    conn.close()
    print(f"OK: {len(rows)} entri katalog masuk DB (pymysql)")
except ImportError:
    # fallback: generate SQL untuk mysql CLI
    def esc(s):
        return (s or "").replace("\\", "\\\\").replace("'", "''")
    stmts = ["SET autocommit=0;"]
    for e in rows:
        stmts.append(
            f"INSERT INTO catalog_index (id, details_id, slug, jenis, nomor, tahun, status, diupdate) "
            f"VALUES (UUID(), '{esc(e['detailsId'])}', '{esc(e['slug'])}', {repr(e.get('jenis'))}, "
            f"{repr(e.get('nomor'))}, {repr(e.get('tahun'))}, 'TERDAFTAR', NOW()) "
            f"ON DUPLICATE KEY UPDATE slug=VALUES(slug), diupdate=NOW();"
        )
    stmts.append("COMMIT;")
    sql = "\n".join(stmts)
    Path("catalog-index.sql").write_text(sql, encoding="utf-8")
    print("SQL dibuat: catalog-index.sql — jalankan via mysql CLI")
