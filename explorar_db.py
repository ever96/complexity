# explorar_db.py
import duckdb

con = duckdb.connect('econofold.duckdb')

print("=" * 60)
print("TABLAS EN LA BASE")
print("=" * 60)
tables = con.execute("SHOW TABLES").fetchall()
for (t,) in tables:
    print(f"\n=== {t} ===")
    print(con.execute(f"DESCRIBE {t}").df().to_string())
    n = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"Filas: {n:,}")
    print("\nMuestra:")
    print(con.execute(f"SELECT * FROM {t} LIMIT 3").df().to_string())

con.close()