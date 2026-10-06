// backend/db.js
import 'dotenv/config';
import { DuckDBInstance } from '@duckdb/node-api';
import { LRUCache } from 'lru-cache';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Si DB_PATH es absoluto (ej. /data/econofold.duckdb en Railway)
// se usa tal cual. Si es relativo, se resuelve desde backend/.
const rawPath = process.env.DB_PATH || '../econofold.duckdb';
const DB_PATH = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(__dirname, rawPath);

const cache = new LRUCache({ max: 200, ttl: 1000 * 60 * 5 });

let instance;
let connection;

export async function initDB() {
  console.log('→ Abriendo DuckDB en:', DB_PATH);
  instance = await DuckDBInstance.create(DB_PATH, {
    access_mode: 'READ_ONLY',
  });
  connection = await instance.connect();
  console.log('✓ DuckDB conectado');
  return instance;
}

export async function query(sql, params = [], cacheKey = null) {
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }
  const stmt = await connection.prepare(sql);
  for (let i = 0; i < params.length; i++) {
    stmt.bindVarchar(i + 1, String(params[i]));
  }
  const reader = await stmt.runAndReadAll();
  const rows = reader.getRowObjects();
  if (cacheKey) cache.set(cacheKey, rows);
  return rows;
}

export async function queryOne(sql, params = [], cacheKey = null) {
  const rows = await query(sql, params, cacheKey);
  return rows[0] ?? null;
}