import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

/* ---------- Robust CORS ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const o = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(o)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204
  })
);
app.options('*', cors());

/* ---------- Parsers & logs ---------- */
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

/* ---------- Serve uploads from a *resolved* directory ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveUploadsDir() {
  const envDir = process.env.UPLOADS_DIR; // e.g. /tmp/uploads on Render
  if (envDir && path.isAbsolute(envDir)) return envDir;
  if (envDir) return path.join(__dirname, '..', envDir);
  return path.join(__dirname, '..', 'uploads'); // local dev default
}

const uploadsDir = resolveUploadsDir();
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(['/uploads', '/api/uploads'], express.static(uploadsDir));

/* ---------- Health ---------- */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), allowedOrigins, uploadsDir })
);

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

/* ---------- Errors ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
});
