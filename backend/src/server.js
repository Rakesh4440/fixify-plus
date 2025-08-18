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

/* ---------- Robust CORS (trims spaces/trailing slashes, handles preflight) ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow server-to-server/health checks
      const o = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(o)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  })
);
app.options('*', cors());

/* ------------------------------- Parsers & logs ------------------------------- */
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

/* ----------------------- Serve uploads at /uploads paths ---------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '..', 'uploads');

// Ensure the folder exists (important on Render)
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

app.use(['/uploads', '/api/uploads'], express.static(uploadsPath));

/* --------------------------------- Healthcheck -------------------------------- */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), allowedOrigins })
);

/* ------------------------------------ APIs ----------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

/* ------------------------------- Error handlers ------------------------------ */
app.use(notFound);
app.use(errorHandler);

/* --------------------------------- Boot server -------------------------------- */
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
});
