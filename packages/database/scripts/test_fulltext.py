import pymysql
import time

conn = pymysql.connect(host='127.0.0.1', port=3307, user='root', password='', database='sipaka_db')
with conn.cursor() as cur:
    t0 = time.time()
    query = """
        SELECT pr.id, p.canonicalPath, p.label, MATCH(pr.content) AGAINST(%s IN BOOLEAN MODE) as score
        FROM provision_revisions pr
        JOIN provisions p ON pr.provisionId = p.id
        WHERE MATCH(pr.content) AGAINST(%s IN BOOLEAN MODE)
          AND pr.effectiveUntil IS NULL
        ORDER BY score DESC
        LIMIT 10
    """
    cur.execute(query, ('elektronik transaksi', '+elektronik +transaksi'))
    rows = cur.fetchall()
    t1 = time.time()
    print(f"FULLTEXT Search took: {(t1-t0)*1000:.2f} ms!")
    print(f"Found: {len(rows)} rows")
    for r in rows[:3]:
        print(" ", r[1], r[2], f"Score: {r[3]:.2f}")
