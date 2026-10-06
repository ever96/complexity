// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import countriesRouter from './routes/countries.js';
import productsRouter from './routes/products.js';
import graphRouter from './routes/graph.js';
import treemapRouter from './routes/treemap.js';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS bloqueado: ${origin}`));
  },
}));

app.use(express.json());

// Logger solo en desarrollo
if (NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.url} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

app.use('/api/countries', countriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/treemap', treemapRouter);

app.get('/health', (req, res) => res.json({
  status: 'ok',
  env: NODE_ENV,
  timestamp: new Date().toISOString(),
}));

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Backend escuchando en puerto ${PORT} (${NODE_ENV})`);
      console.log(`  DB_PATH: ${process.env.DB_PATH || '../econofold.duckdb'}`);
      console.log(`  CORS: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('✗ Error iniciando DB:', err);
    process.exit(1);
  });