// backend/routes/graph.js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET /api/graph/:iso3?top=50
router.get('/:iso3', async (req, res) => {
  try {
    const { iso3 } = req.params;
    const top = Math.min(parseInt(req.query.top) || 50, 200);
    const year = parseInt(req.query.year) || 2024;

    const nodes = await query(
      `
      SELECT
        r.product AS id,
        p.description AS name,
        r.rca AS rca,
        r.x_ik AS value
      FROM rca_matrix r
      JOIN country_codes c ON r.country = c.country_code
      JOIN product_codes p ON r.product = p.code
      WHERE c.country_iso3 = ? AND r.year = ?
      ORDER BY r.x_ik DESC
      LIMIT ${top}
      `,
      [iso3, year],
      `graph:${iso3}:${year}:${top}:nodes`
    );

    if (nodes.length === 0) return res.json({ nodes: [], links: [] });

    const ids = nodes.map((n) => n.id);
    const placeholders = ids.map(() => '?').join(',');

    const links = await query(
      `
      SELECT p1 AS source, p2 AS target, proximity
      FROM product_proximity
      WHERE p1 IN (${placeholders}) AND p2 IN (${placeholders})
        AND proximity > 0.15
      ORDER BY proximity DESC
      LIMIT 500
      `,
      [...ids, ...ids],
      `graph:${iso3}:${year}:${top}:links`
    );

    res.json({ nodes, links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/treemap/:iso3
router.get('/treemap/:iso3', async (req, res) => {
  try {
    const { iso3 } = req.params;
    const year = parseInt(req.query.year) || 2024;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    const rows = await query(
      `
      SELECT
        r.product AS code,
        p.description AS name,
        r.rca AS rca,
        r.x_ik AS value,
        SUBSTRING(r.product, 1, 2) AS hs_chapter
      FROM rca_matrix r
      JOIN country_codes c ON r.country = c.country_code
      JOIN product_codes p ON r.product = p.code
      WHERE c.country_iso3 = ? AND r.year = ? AND r.x_ik > 0
      ORDER BY r.x_ik DESC
      LIMIT ${limit}
      `,
      [iso3, year],
      `treemap:${iso3}:${year}:${limit}`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;