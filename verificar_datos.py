# verificar_datos.py
import duckdb

con = duckdb.connect('econofold.duckdb')

print("=" * 70)
print("1. COBERTURA TEMPORAL")
print("=" * 70)
print(con.execute("""
SELECT MIN(year) AS anio_min, MAX(year) AS anio_max,
       COUNT(DISTINCT year) AS n_anios,
       COUNT(DISTINCT country) AS n_paises,
       COUNT(DISTINCT product) AS n_productos
FROM rca_binary
""").df().to_string())

print("\n¿Qué hay en rca_binary_2024?")
print(con.execute("""
SELECT COUNT(DISTINCT country) AS n_paises,
       COUNT(DISTINCT product) AS n_productos,
       SUM(has_rca) AS activos
FROM rca_binary_2024
""").df().to_string())

print("\n" + "=" * 70)
print("2. DENSIDAD DE M POR AÑO")
print("=" * 70)
print(con.execute("""
SELECT year,
       COUNT(*) AS pares,
       SUM(has_rca) AS activos,
       ROUND(SUM(has_rca)::FLOAT / COUNT(*), 4) AS densidad
FROM rca_binary
GROUP BY year
ORDER BY year
""").df().to_string())

print("\n" + "=" * 70)
print("3. CHEQUEO POR PAÍS (último año disponible en rca_binary)")
print("=" * 70)
print(con.execute("""
WITH ultimo AS (SELECT MAX(year) AS y FROM rca_binary)
SELECT c.country_iso3, c.country_name,
       SUM(rb.has_rca) AS productos_con_rca_gt_1
FROM rca_binary rb
JOIN country_codes c ON rb.country = c.country_code
WHERE rb.year = (SELECT y FROM ultimo)
  AND c.country_iso3 IN ('PRY','CHN','BRA','USA','DEU','ARG','URY','CHL','BOL')
GROUP BY c.country_iso3, c.country_name
ORDER BY productos_con_rca_gt_1 DESC
""").df().to_string())

print("\n" + "=" * 70)
print("4. CHEQUEO PRODUCTO: SOJA (120100)")
print("=" * 70)
print(con.execute("""
WITH ultimo AS (SELECT MAX(year) AS y FROM rca_matrix)
SELECT c.country_iso3, c.country_name, ROUND(r.rca, 3) AS rca
FROM rca_matrix r
JOIN country_codes c ON r.country = c.country_code
WHERE r.product = '120100' AND r.year = (SELECT y FROM ultimo)
ORDER BY r.rca DESC
LIMIT 15
""").df().to_string())

print("\n" + "=" * 70)
print("5. CHEQUEO PRODUCTO: COBRE (740311)")
print("=" * 70)
print(con.execute("""
WITH ultimo AS (SELECT MAX(year) AS y FROM rca_matrix)
SELECT c.country_iso3, c.country_name, ROUND(r.rca, 3) AS rca
FROM rca_matrix r
JOIN country_codes c ON r.country = c.country_code
WHERE r.product = '740311' AND r.year = (SELECT y FROM ultimo)
ORDER BY r.rca DESC
LIMIT 15
""").df().to_string())

con.close()
print("\n✓ Verificación terminada.")