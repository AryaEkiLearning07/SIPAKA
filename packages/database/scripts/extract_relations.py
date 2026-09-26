"""
Extractor Relasi (Mesin 3) — menghubungkan undang-undang satu dengan lainnya.

Dua sumber relasi:
1. MENGUBAH — dari change_sets yang sudah ada (amandemen terverifikasi)
2. MERUJUK  — dari pemindaian rujukan "UU Nomor X Tahun Y" di isi pasal
   antar instrumen yang sudah masuk database (x-reference antar dokumen)

Semua relasi ditulis ke instrument_relations (idempoten: tidak menduplikasi).
"""
import re

import pymysql

DB = dict(host="127.0.0.1", port=3307, user="root", password="", database="lexvera_db")
RE_RUJUK = re.compile(
    r"UU(?:\s+Nomor|\s+No\.?|\s*nomor)\s*(\d{1,4})\s+Tahun\s+(\d{4})", re.IGNORECASE
)


def main():
    conn = pymysql.connect(**DB, charset="utf8mb4")
    cur = conn.cursor()

    # Peta instrumen: (nomor, tahun) -> id ; slug -> (nomor, tahun, id)
    cur.execute("SELECT id, number, year, slug FROM legal_instruments")
    by_numtahun = {}
    idinfo = {}
    for iid, num, year, slug in cur.fetchall():
        by_numtahun[(int(num), int(year))] = iid
        idinfo[iid] = slug

    dibuat = {"MENGUBAH": 0, "MERUJUK": 0}
    dilewati_sendiri = 0

    def tambah(source_id: str, target_id: str, jenis: str, klausa: str) -> bool:
        if source_id == target_id:
            return False
        cur.execute(
            "SELECT id FROM instrument_relations WHERE sourceId=%s AND targetId=%s AND jenis=%s",
            (source_id, target_id, jenis),
        )
        if cur.fetchone():
            return False
        cur.execute(
            "INSERT INTO instrument_relations (id, sourceId, targetId, jenis, sumberKlausa) "
            "VALUES (UUID(), %s, %s, %s, %s)",
            (source_id, target_id, jenis, klausa[:200]),
        )
        return True

    # ---- 1. MENGUBAH: dari change_sets (amandemen terverifikasi) ----
    cur.execute(
        "SELECT amendingInstrumentId, targetInstrumentId, legalBasisNote FROM change_sets"
    )
    for amender, target, basis in cur.fetchall():
        if amender and target and tambah(amender, target, "MENGUBAH", basis or "Pasal I UU pengubah"):
            dibuat["MENGUBAH"] += 1

    # ---- 2. MERUJUK: pindai isi pasal tiap instrumen ----
    cur.execute(
        "SELECT p.legalInstrumentId, pr.content FROM provision_revisions pr "
        "JOIN provisions p ON p.id = pr.provisionId"
    )
    for iid, content in cur.fetchall():
        if not content:
            continue
        for m in RE_RUJUK.finditer(content):
            num, year = int(m.group(1)), int(m.group(2))
            target = by_numtahun.get((num, year))
            if not target:
                continue  # target belum ada di database — dilewati, bisa dipindai ulang nanti
            if target == iid:
                dilewati_sendiri += 1
                continue
            if tambah(iid, target, "MERUJUK", f"Rujukan teks: UU No. {num} Tahun {year}"):
                dibuat["MERUJUK"] += 1

    conn.commit()

    print("== HASIL EXTRACTOR RELASI ==")
    for jenis, n in dibuat.items():
        print(f"  {jenis}: {n} relasi baru")
    print(f"  rujukan ke diri sendiri dilewati: {dilewati_sendiri}")

    cur.execute("SELECT jenis, COUNT(*) FROM instrument_relations GROUP BY jenis")
    for jenis, n in cur.fetchall():
        print(f"  total {jenis}: {n}")
    conn.close()


if __name__ == "__main__":
    main()
