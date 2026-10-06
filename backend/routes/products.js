// backend/routes/products.js
import { Router } from 'express';
import { query, queryOne } from '../db.js';

const router = Router();

// GET /api/products/:code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const row = await queryOne(
      `SELECT code, description FROM product_codes WHERE code = ?`,
      [code],
      `product:${code}`
    );
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:code/neighbors
router.get('/:code/neighbors', async (req, res) => {
  try {
    const { code } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const rows = await query(
      `
      WITH pares AS (
        SELECT p1, p2, proximity FROM product_proximity WHERE p1 = ?
        UNION ALL
        SELECT p2 AS p1, p1 AS p2, proximity FROM product_proximity WHERE p2 = ?
      )
      SELECT
        pares.p2 AS code,
        p.description AS name,
        pares.proximity
      FROM pares
      JOIN product_codes p ON p.code = pares.p2
      ORDER BY pares.proximity DESC
      LIMIT ${limit}
      `,
      [code, code],
      `product:${code}:neighbors:${limit}`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/search?q=...
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const rows = await query(
      `
      SELECT code, description
      FROM product_codes
      WHERE LOWER(description) LIKE LOWER(?)
      LIMIT ${limit}
      `,
      [`%${q}%`],
      `product:search:${q}:${limit}`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;