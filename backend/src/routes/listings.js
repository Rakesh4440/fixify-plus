import express from 'express';
import cloudinary from "../config/cloudinary.js";

import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';

import Listing from '../models/Listing.js';
import { authRequired } from '../middleware/auth.js';

/* ---------- Cloudinary storage ---------- */
import cloudinary from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: 'fixify-plus',
    resource_type: 'image',
    format: undefined, // keep original
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }]
  }),
});
const upload = multer({ storage });

const router = express.Router();

/* ---------- phone helper (+91) ---------- */
function ensurePlus91(phone) {
  let s = String(phone || '').trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+91')) return s;
  if (digits.startsWith('91') && digits.length >= 12) return '+' + digits;
  if (digits.length === 10) return '+91' + digits;
  return '+91' + digits.slice(-10);
}

/* ---------- GET /api/listings (with filters + paging) ---------- */
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

/* ---------- POST /api/listings (create) ---------- */
// Accepts JSON or multipart; when multipart include field "photo"
router.post('/', authRequired, upload.single('photo'), async (req, res, next) => {
  try {
    const body = { ...(req.body || {}) };

    if (typeof body.isCommunityPosted !== 'undefined') {
      body.isCommunityPosted = body.isCommunityPosted === 'true' || body.isCommunityPosted === true;
    }
    if (body.contactNumber) body.contactNumber = ensurePlus91(body.contactNumber);

    if (req.file) {
      // multer-storage-cloudinary puts secure URL in file.path
      body.photoPath = req.file.path;           // absolute https URL
      body.photoPublicId = req.file.filename;   // cloudinary public_id
    }

    const required = ['title', 'category', 'contactNumber', 'type'];
    const missing = required.filter((k) => !body[k]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    body.postedBy = req.user.id;
    const listing = await Listing.create(body);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

/* ---------- GET /api/listings/:id ---------- */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Listing.findById(req.params.id).populate('postedBy', 'name _id');
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/* ---------- PUT /api/listings/:id (update) ---------- */
// Accepts JSON or multipart with "photo" to replace image
router.put('/:id', authRequired, upload.single('photo'), async (req, res, next) => {
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
    if (body.contactNumber) body.contactNumber = ensurePlus91(body.contactNumber);

    if (req.file) {
      body.photoPath = req.file.path;         // new https URL
      body.photoPublicId = req.file.filename;
    }

    Object.assign(listing, body);
    await listing.save();
    res.json(listing);
  } catch (err) {
    next(err);
  }
});

/* ---------- DELETE /api/listings/:id ---------- */
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

/* ---------- POST /api/listings/:id/reviews ---------- */
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
