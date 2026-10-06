// backend/routes/treemap.js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET /api/treemap/:iso3
router.get('/:iso3', async (req, res) => {
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