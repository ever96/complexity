import duckdb

db_path = r"C:\ever\complejidad\econofold.duckdb"
con = duckdb.connect(db_path)

# Configurar DuckDB para usar almacenamiento temporal en disco si la RAM se satura
con.execute("SET memory_limit='4GB';")
con.execute("SET temp_directory='C:/ever/complejidad/duckdb_temp';")

print("Calculando la matriz binaria de RCA (RCA >= 1) solo para el año 2024...")
con.execute("""
    CREATE OR REPLACE TABLE rca_binary_2024 AS 
    SELECT country, product, 1 as has_rca
    FROM rca_matrix
    WHERE year = 2024 AND rca >= 1;
""")

print("Creando índice para acelerar co-ocurrencias...")
con.execute("CREATE INDEX IF NOT EXISTS idx_rca_country ON rca_binary_2024(country);")
con.execute("CREATE INDEX IF NOT EXISTS idx_rca_product ON rca_binary_2024(product);")

print("Calculando proximidades entre productos de forma optimizada...")
con.execute("""
    CREATE OR REPLACE TABLE product_proximity AS 
    WITH product_totals AS (
        SELECT product, SUM(has_rca) as p_total
        FROM rca_binary_2024
        GROUP BY product
    ),
    co_occurrences AS (
        SELECT 
            a.product as p1,
            b.product as p2,
            COUNT(DISTINCT a.country) as both_have
        FROM rca_binary_2024 a
        JOIN rca_binary_2024 b ON a.country = b.country AND a.product < b.product
        GROUP BY a.product, b.product
    )
    SELECT 
        c.p1,
        c.p2,
        c.both_have,
        CAST(c.both_have AS DOUBLE) / NULLIF(GREATEST(t1.p_total, t2.p_total), 0) AS proximity
    FROM co_occurrences c
    JOIN product_totals t1 ON c.p1 = t1.product
    JOIN product_totals t2 ON c.p2 = t2.product
    WHERE c.both_have > 3
    ORDER BY proximity DESC;
""")

print("¡Proximidades calculadas con éxito!")
print(con.execute("SELECT * FROM product_proximity LIMIT 10;").fetchdf())