// backend/routes/countries.js
import { Router } from 'express';
import { query, queryOne } from '../db.js';

const router = Router();

// GET /api/countries
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      `
      SELECT
        c.country_iso3 AS code,
        c.country_name AS name,
        COUNT(DISTINCT rb.product) AS n_products,
        COALESCE(SUM(r.x_ik), 0) AS total_exports
      FROM country_codes c
      LEFT JOIN rca_binary rb
        ON rb.country = c.country_code AND rb.year = 2024 AND rb.has_rca = 1
      LEFT JOIN rca_matrix r
        ON r.country = c.country_code AND r.year = 2024
      WHERE c.country_iso3 IS NOT NULL
      GROUP BY c.country_iso3, c.country_name
      HAVING COUNT(DISTINCT rb.product) > 0
      ORDER BY n_products DESC
      `,
      [],
      'countries:list'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/countries/:iso3
router.get('/:iso3', async (req, res) => {
  try {
    const { iso3 } = req.params;
    const row = await queryOne(
      `
      SELECT
        c.country_iso3 AS code,
        c.country_name AS name,
        c.country_iso2 AS iso2,
        c.country_code AS numeric_code
      FROM country_codes c
      WHERE c.country_iso3 = ?
      `,
      [iso3],
      `country:${iso3}`
    );
    if (!row) return res.status(404).json({ error: 'País no encontrado' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/countries/:iso3/products
router.get('/:iso3/products', async (req, res) => {
  try {
    const { iso3 } = req.params;
    const year = parseInt(req.query.year) || 2024;
    const limit = Math.min(parseInt(req.query.limit) || 200, 2000);

    const rows = await query(
      `
      SELECT
        r.product AS code,
        p.description AS name,
        r.rca AS rca,
        r.x_ik AS value,
        CASE WHEN r.rca > 1 THEN 1 ELSE 0 END AS has_rca
      FROM rca_matrix r
      JOIN country_codes c ON r.country = c.country_code
      JOIN product_codes p ON r.product = p.code
      WHERE c.country_iso3 = ? AND r.year = ?
      ORDER BY r.x_ik DESC
      LIMIT ${limit}
      `,
      [iso3, year],
      `country:${iso3}:products:${year}:${limit}`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;