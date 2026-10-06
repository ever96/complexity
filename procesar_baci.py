import duckdb
import os

# Rutas basadas en tu entorno exacto
data_dir = r"C:\ever\complejidad\data\BACI_HS92"
db_path = r"C:\ever\complejidad\econofold.duckdb"

# Conectar a DuckDB
con = duckdb.connect(db_path)

print("=== CONECTADO A DUCKDB: INICIANDO PIPELINE DE DATOS ===")

# 1. Cargar todos los archivos anuales de BACI usando comodines
baci_pattern = os.path.join(data_dir, "BACI_HS92_Y*.csv")

print("Cargando y unificando los 30 años de comercio mundial en DuckDB...")
con.execute(f"""
    CREATE OR REPLACE TABLE baci_global AS 
    SELECT * FROM read_csv_auto('{baci_pattern}', ignore_errors=true);
""")

total_filas = con.execute("SELECT COUNT(*) FROM baci_global;").fetchone()[0]
print(f"¡Se han cargado {total_filas:,} transacciones comerciales globales con éxito!")

# 2. Cargar tablas auxiliares
print("Cargando códigos de países y productos...")
con.execute(f"""
    CREATE OR REPLACE TABLE country_codes AS 
    SELECT * FROM read_csv_auto('{os.path.join(data_dir, "country_codes_V202601.csv")}');
""")

con.execute(f"""
    CREATE OR REPLACE TABLE product_codes AS 
    SELECT * FROM read_csv_auto('{os.path.join(data_dir, "product_codes_HS92_V202601.csv")}');
""")

# 3. Calcular la Matriz de RCA (Ventaja Comparativa Revelada)
print("\nCalculando la matriz de RCA para todo el período...")
con.execute("""
    CREATE OR REPLACE TABLE rca_matrix AS 
    WITH total_pais_producto AS (
        SELECT t AS year, i AS country, k AS product, SUM(v) AS x_ik
        FROM baci_global
        GROUP BY t, i, k
    ),
    total_pais AS (
        SELECT t AS year, i AS country, SUM(v) AS x_i
        FROM baci_global
        GROUP BY t, i
    ),
    total_producto AS (
        SELECT t AS year, k AS product, SUM(v) AS x_k
        FROM baci_global
        GROUP BY t, k
    ),
    total_mundial AS (
        SELECT t AS year, SUM(v) AS x_world
        FROM baci_global
        GROUP BY t
    )
    SELECT 
        tpp.year,
        tpp.country,
        tpp.product,
        tpp.x_ik,
        (tpp.x_ik / tp.x_i) / (tpr.x_k / tw.x_world) AS rca
    FROM total_pais_producto tpp
    JOIN total_pais tp ON tpp.year = tp.year AND tpp.country = tp.country
    JOIN total_producto tpr ON tpp.year = tpr.year AND tpp.product = tpr.product
    JOIN total_mundial tw ON tpp.year = tw.year;
""")

print("¡Matriz de RCA calculada y almacenada en DuckDB!")

# 4. Prueba rápida para verificar (ej: Paraguay en 2024)
print("\nEjemplo: Productos con RCA > 1 para Paraguay (código 600) en 2024:")
resultado = con.execute("""
    SELECT r.year, r.country, r.product, p.description, r.rca
    FROM rca_matrix r
    JOIN product_codes p ON r.product = p.code
    WHERE r.country = 600 AND r.year = 2024 AND r.rca > 1
    ORDER BY r.rca DESC
    LIMIT 10;
""").fetchdf()

print(resultado)