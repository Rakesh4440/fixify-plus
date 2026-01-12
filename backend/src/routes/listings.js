import express from 'express';
import multer from 'multer';
import pkg from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import Listing from '../models/Listing.js';
import auth from '../middleware/auth.js';

const { CloudinaryStorage } = pkg;

const router = express.Router();

/* ---------------- CLOUDINARY STORAGE ---------------- */

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fixify',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

/* ---------------- CREATE LISTING ---------------- */

router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const listing = new Listing({
      ...req.body,
      postedBy: req.user.id,
      photoPath: req.file?.path || ''
    });

    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ---------------- GET LISTINGS ---------------- */

router.get('/', async (req, res) => {
  try {
    const {
      q,
      type,
      city,
      area,
      pincode,
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (city) filter.city = new RegExp(city, 'i');
    if (area) filter.area = new RegExp(area, 'i');
    if (pincode) filter.pincode = pincode;
    if (q) filter.title = new RegExp(q, 'i');

    const skip = (page - 1) * limit;

    const items = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      items,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- GET SINGLE LISTING ---------------- */

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ---------------- UPDATE LISTING ---------------- */

router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const update = {
      ...req.body
    };

    if (req.file) update.photoPath = req.file.path;

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ---------------- DELETE LISTING ---------------- */

router.delete('/:id', auth, async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
