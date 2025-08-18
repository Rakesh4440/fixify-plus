import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

import Listing from '../models/Listing.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

/* ---------------- Ensure uploads go to backend/uploads ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// routes/ -> .. -> src -> .. -> backend -> uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ----------------------------- Multer setup ---------------------------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage });

/* ---------------------------- List & search ---------------------------- */
// GET /api/listings  (search + filters + pagination)
router.get('/', async (req, res, next) => {
  try {
    const { q, category, type, city, area, pincode } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (city) filter.city = new RegExp(city, 'i');
    if (area) filter.area = new RegExp(area, 'i');
    if (pincode) filter.pincode = new RegExp(`^${pincode}`);
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { area: new RegExp(q, 'i') },
        { pincode: new RegExp(q, 'i') }
      ];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Listing.countDocuments(filter)
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit), limit });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Create listing -------------------------- */
// POST /api/listings  (multipart or json)
router.post('/', upload.any(), authRequired, async (req, res, next) => {
  try {
    const body = { ...(req.body || {}) };

    if (typeof body.isCommunityPosted !== 'undefined') {
      body.isCommunityPosted = body.isCommunityPosted === 'true' || body.isCommunityPosted === true;
    }

    const photo = (req.files || []).find(f => f.fieldname === 'photo') || (req.files || [])[0];
    if (photo) body.photoPath = `/uploads/${photo.filename}`;

    const required = ['title', 'category', 'contactNumber', 'type'];
    const missing = required.filter((k) => !body[k]);
    if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

    body.postedBy = req.user.id;

    const listing = await Listing.create(body);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ Read one ------------------------------- */
// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Listing.findById(req.params.id).populate('postedBy', 'name _id');
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ Update one ----------------------------- */
// PUT /api/listings/:id  (multipart or json)
router.put('/:id', upload.any(), authRequired, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const body = { ...(req.body || {}) };
    if (typeof body.isCommunityPosted !== 'undefined') {
      body.isCommunityPosted = body.isCommunityPosted === 'true' || body.isCommunityPosted === true;
    }

    const photo = (req.files || []).find(f => f.fieldname === 'photo') || (req.files || [])[0];
    if (photo) body.photoPath = `/uploads/${photo.filename}`;

    Object.assign(listing, body);
    await listing.save();
    res.json(listing);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ Delete one ----------------------------- */
// DELETE /api/listings/:id
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await listing.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ Reviews -------------------------------- */
// POST /api/listings/:id/reviews  (upsert my review)
router.post('/:id/reviews', authRequired, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const existing = listing.reviews.find((r) => r.user.toString() === req.user.id);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
    } else {
      listing.reviews.push({ user: req.user.id, rating, comment });
    }

    await listing.save();
    res.status(201).json(listing.reviews);
  } catch (err) {
    next(err);
  }
});

export default router;
