import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

/* ---------- Robust CORS (trims spaces & trailing slashes, handles OPTIONS) ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))   // trim end slash
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser/health checks
    const o = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(o)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204,
}));
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// serve uploads at /uploads and /api/uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use(['/uploads', '/api/uploads'], express.static(uploadsPath));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), allowedOrigins })
);

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
});
