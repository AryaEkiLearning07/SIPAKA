import pymysql
import uuid
from datetime import datetime

LANDMARK_MK_DECISIONS = [
    {
        "slug": "ite",
        "canonicalPathPart": "pasal-27/ayat-3",
        "caseNumber": "50/PUU-VI/2008",
        "rulingDate": "2009-05-05",
        "effect": "KONSTITUSIONAL_BERSYARAT",
        "affectedPhrase": "memiliki muatan penghinaan dan/atau pencemaran nama baik",
        "ratioDecidendi": "Pasal 27 ayat (3) UU ITE tidak dapat dipisahkan dari norma hukum pidana materiil mengenai penghinaan dan pencemaran nama baik dalam KUHP (Pasal 310 dan Pasal 311 KUHP), sehingga keberlakuannya mutlak merupakan delik aduan yang hanya dapat dituntut atas pengaduan korban langsung.",
        "rulingVerdict": "Menyatakan Pasal 27 ayat (3) UU ITE adalah konstitusional bersyarat sepanjang dimaknai sebagai delik aduan (klachtdelict) yang merujuk pada Pasal 310 dan Pasal 311 KUHP.",
        "sourceUrl": "https://peraturan.go.id/putusan/putusan-mahkamah-konstitusi-no-50-puu-vi-2008-tahun-2009",
    },
    {
        "slug": "ite",
        "canonicalPathPart": "pasal-27/ayat-1",
        "caseNumber": "2/PUU-VII/2009",
        "rulingDate": "2009-10-22",
        "effect": "KONSTITUSIONAL_BERSYARAT",
        "affectedPhrase": "memiliki muatan yang melanggar kesusilaan",
        "ratioDecidendi": "Frasa 'melanggar kesusilaan' harus ditafsirkan sesuai standar norma moral, kepatutan umum, dan nilai-nilai agama masyarakat Indonesia, bukan standar individual subjektif.",
        "rulingVerdict": "Menolak permohonan pemohon untuk seluruhnya dan menegaskan frasa norma kesusilaan terikat pada standar moralitas Pancasila.",
        "sourceUrl": "https://peraturan.go.id/putusan/putusan-mahkamah-konstitusi-no-2-puu-vii-2009-tahun-2009",
    },
    {
        "slug": "ite",
        "canonicalPathPart": "pasal-5/ayat-1",
        "caseNumber": "20/PUU-XIV/2016",
        "rulingDate": "2016-09-07",
        "effect": "INKONSTITUSIONAL_BERSYARAT",
        "affectedPhrase": "Informasi Elektronik dan/atau Dokumen Elektronik dan/atau hasil cetaknya merupakan alat bukti hukum yang sah",
        "ratioDecidendi": "Penyadapan dan rekaman suara tanpa izin penegak hukum melanggar hak privasi konstitusional (Pasal 28G UUD 1945). Alat bukti rekaman elektronik hanya sah bila dilakukan atas perintah dan izin penegak hukum sesuai prosedur hukum acara resmi (Lawful Interception).",
        "rulingVerdict": "Menyatakan frasa 'Informasi Elektronik dan/atau Dokumen Elektronik' dalam Pasal 5 ayat (1) dan (2) serta Pasal 44 huruf b UU ITE inkonstitusional bersyarat sepanjang tidak dimaknai khususnya penyadapan/rekaman harus dilakukan atas permintaan kepolisian, kejaksaan, dan/atau institusi penegak hukum yang berwenang.",
        "sourceUrl": "https://peraturan.go.id/putusan/putusan-mahkamah-konstitusi-no-20-puu-xiv-2016-tahun-2016",
    },
    {
        "slug": "ite",
        "canonicalPathPart": "pasal-40/ayat-2b",
        "caseNumber": "81/PUU-XVIII/2020",
        "rulingDate": "2021-10-27",
        "effect": "KONSTITUSIONAL_BERSYARAT",
        "affectedPhrase": "Pemerintah berwenang melakukan pemutusan akses dan/atau memerintahkan kepada Penyelenggara Sistem Elektronik untuk melakukan pemutusan akses",
        "ratioDecidendi": "Kewenangan pemerintah memutus akses konten internet terlarang adalah fungsi pengawasan ketertiban umum konstitusional, namun tetap wajib tunduk pada asas akuntabilitas dan dapat diuji melalui Peradilan Tata Usaha Negara (PTUN).",
        "rulingVerdict": "Menyatakan kewenangan pemutusan akses oleh Pemerintah konstitusional bersyarat dengan tetap membuka ruang pengujian peradilan administrasi negara.",
        "sourceUrl": "https://peraturan.go.id/putusan/putusan-mahkamah-konstitusi-no-81-puu-xviii-2020-tahun-2021",
    },
]

def seed_mk():
    print("Menghubungkan ke MariaDB port 3307...")
    conn = pymysql.connect(host='127.0.0.1', port=3307, user='root', password='', database='sipaka_db')
    conn.autocommit(True)

    with conn.cursor() as cur:
        count_inserted = 0
        for item in LANDMARK_MK_DECISIONS:
            # Cari provision berdasarkan slug dan canonicalPath
            cur.execute("""
                SELECT p.id, p.canonicalPath, li.title
                FROM provisions p
                JOIN legal_instruments li ON p.legalInstrumentId = li.id
                WHERE (li.slug = %s OR li.slug LIKE %s)
                  AND (p.canonicalPath LIKE %s OR p.canonicalPath LIKE %s)
                LIMIT 1
            """, (item["slug"], f"%{item['slug']}%", f"%{item['canonicalPathPart']}%", f"%{item['canonicalPathPart'].replace('/', '%')}%"))
            
            row = cur.fetchone()
            if not row:
                print(f"Provision tidak ditemukan untuk {item['slug']} ({item['canonicalPathPart']})")
                continue
            
            prov_id, can_path, li_title = row
            
            # Cek apakah sudah ada anotasi perkara ini
            cur.execute("""
                SELECT id FROM judicial_annotations 
                WHERE provisionId = %s AND caseNumber = %s
            """, (prov_id, item["caseNumber"]))
            if cur.fetchone():
                print(f"Anotasi sudah ada: {item['caseNumber']} -> {can_path}")
                continue

            annot_id = f"mk-{uuid.uuid4().hex[:16]}"
            cur.execute("""
                INSERT INTO judicial_annotations (
                    id, provisionId, court, caseNumber, rulingDate, effect,
                    affectedPhrase, ratioDecidendi, rulingVerdict, sourceUrl, createdAt
                ) VALUES (
                    %s, %s, 'MK', %s, %s, %s,
                    %s, %s, %s, %s, NOW()
                )
            """, (
                annot_id, prov_id, item["caseNumber"], item["rulingDate"], item["effect"],
                item["affectedPhrase"], item["ratioDecidendi"], item["rulingVerdict"], item["sourceUrl"]
            ))
            count_inserted += 1
            print(f"[OK] Sukses menyematkan Putusan MK {item['caseNumber']} pada {can_path} ({item['effect']})")

        cur.execute("SELECT COUNT(*) FROM judicial_annotations")
        total = cur.fetchone()[0]
        print(f"\nTotal Anotasi Yudisial MK di Database: {total} entri.")

if __name__ == "__main__":
    seed_mk()
