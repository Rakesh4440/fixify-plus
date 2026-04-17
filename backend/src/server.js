import express from 'express';
import http from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import passport from 'passport';
import { Server } from 'socket.io';

import { connectDB, getDBStatus } from './config/db.js';
import { configurePassport } from './config/passport.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import conversationRoutes from './routes/conversations.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import listingRoutes from './routes/listings.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import Listing from './models/Listing.js';
import User from './models/User.js';
import { createNotification } from './utils/notifications.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ---------- Robust CORS ---------- */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (!allowedOrigins.length) return cb(null, true);
      const o = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(o)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  })
);
app.options('*', cors());

/* ---------- Parsers & logs ---------- */
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  })
);

configurePassport();
app.use(passport.initialize());

/* ---------- Serve uploads from a *resolved* directory ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveUploadsDir() {
  const envDir = process.env.UPLOADS_DIR;
  if (envDir && path.isAbsolute(envDir)) return envDir;
  if (envDir) return path.join(__dirname, '..', envDir);
  return path.join(__dirname, '..', 'uploads');
}

const uploadsDir = resolveUploadsDir();
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(['/uploads', '/api/uploads'], express.static(uploadsDir));

/* ---------- Health ---------- */
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    allowedOrigins,
    uploadsDir,
    db: getDBStatus()
  })
);

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

/* ---------- Errors ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Realtime ---------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:user', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('chat:send', async (payload) => {
    try {
      const { conversationId, listingId, senderId, receiverId, text } = payload || {};
      if (!conversationId || !listingId || !senderId || !receiverId || !text) return;

      const [sender, listing] = await Promise.all([
        User.findById(senderId).select('name'),
        Listing.findById(listingId).select('title')
      ]);

      const message = await Message.create({
        conversationId,
        listingId,
        senderId,
        receiverId,
        text
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date()
      });

      await createNotification({
        userId: receiverId,
        type: 'message',
        title: `New message from ${sender?.name || 'someone'}`,
        message: text.slice(0, 120),
        metadata: {
          conversationId,
          listingId,
          senderId,
          senderName: sender?.name || 'Unknown user',
          listingTitle: listing?.title || 'Listing'
        },
        dedupe: {
          conversationId: String(conversationId),
          listingId: String(listingId)
        }
      });

      io.to(`user:${receiverId}`).emit('message:new', message);
      io.to(`user:${senderId}`).emit('message:new', message);
      io.to(`user:${receiverId}`).emit('notification:new');
    } catch (error) {
      console.error('[socket] Failed to send chat message', error.message);
    }
  });
});

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
  connectDB(process.env.MONGO_URI);
});
