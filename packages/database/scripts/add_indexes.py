import pymysql
import sys

def main():
    print("Menghubungkan ke MariaDB port 3307...")
    conn = pymysql.connect(host='127.0.0.1', port=3307, user='root', password='', database='sipaka_db')
    conn.autocommit(True)

    with conn.cursor() as cur:
        # 1. FULLTEXT Index on provision_revisions(content)
        cur.execute("SHOW INDEX FROM provision_revisions WHERE Key_name = 'provision_revisions_content_ft'")
        if not cur.fetchall():
            print("1. Membuat FULLTEXT index pada provision_revisions(content)...")
            cur.execute("ALTER TABLE provision_revisions ADD FULLTEXT INDEX provision_revisions_content_ft (content)")
            print("   -> Sukses membuat FULLTEXT index!")
        else:
            print("1. FULLTEXT index sudah ada.")

        # 2. Index on provision_revisions(effectiveUntil)
        cur.execute("SHOW INDEX FROM provision_revisions WHERE Key_name = 'provision_revisions_effectiveUntil_idx'")
        if not cur.fetchall():
            print("2. Membuat index pada provision_revisions(effectiveUntil)...")
            cur.execute("CREATE INDEX provision_revisions_effectiveUntil_idx ON provision_revisions (effectiveUntil)")
            print("   -> Sukses membuat effectiveUntil index!")
        else:
            print("2. Index effectiveUntil sudah ada.")

        # 3. Index on provisions(legalInstrumentId, type, orderIndex)
        cur.execute("SHOW INDEX FROM provisions WHERE Key_name = 'provisions_instrument_type_order_idx'")
        if not cur.fetchall():
            print("3. Membuat composite index pada provisions(legalInstrumentId, type, orderIndex)...")
            cur.execute("CREATE INDEX provisions_instrument_type_order_idx ON provisions (legalInstrumentId, type, orderIndex)")
            print("   -> Sukses membuat composite index provisions!")
        else:
            print("3. Composite index provisions sudah ada.")

        # 4. Index on legal_instruments(year, type, status)
        cur.execute("SHOW INDEX FROM legal_instruments WHERE Key_name = 'legal_instruments_year_type_status_idx'")
        if not cur.fetchall():
            print("4. Membuat index pada legal_instruments(year, type, status)...")
            cur.execute("CREATE INDEX legal_instruments_year_type_status_idx ON legal_instruments (year, type, status)")
            print("   -> Sukses membuat filter index legal_instruments!")
        else:
            print("4. Index legal_instruments sudah ada.")

    print("Seluruh indeks database berhasil diterapkan!")

if __name__ == "__main__":
    main()
