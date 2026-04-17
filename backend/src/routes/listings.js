import express from 'express';
import multer from 'multer';
import pkg from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/notifications.js';

const { CloudinaryStorage } = pkg;
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fixify',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

function toGeoPayload(body = {}) {
  const latitude = body.latitude === '' || body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude === '' || body.longitude == null ? null : Number(body.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: null, longitude: null, coordinates: undefined };
  }

  return {
    latitude,
    longitude,
    coordinates: {
      type: 'Point',
      coordinates: [longitude, latitude]
    }
  };
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function assertOwnerOrAdmin(listingId, userId, role) {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return { error: { status: 404, message: 'Listing not found' } };
  }

  if (role !== 'admin' && String(listing.postedBy) !== String(userId)) {
    return { error: { status: 403, message: 'Only the owner or admin can modify this listing' } };
  }

  return { listing };
}

router.get('/suggestions', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ suggestions: [] });

    const items = await Listing.find(
      {
        $or: [
          { title: new RegExp(q, 'i') },
          { category: new RegExp(q, 'i') },
          { city: new RegExp(q, 'i') },
          { area: new RegExp(q, 'i') }
        ]
      },
      'title category city area'
    )
      .limit(8)
      .lean();

    const suggestions = [...new Set(items.flatMap((item) => [item.title, item.category, item.city, item.area].filter(Boolean)))].slice(0, 8);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const listing = new Listing({
      ...req.body,
      ...toGeoPayload(req.body),
      postedBy: req.user.id,
      photoPath: req.file?.path || ''
    });

    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      q,
      type,
      city,
      area,
      pincode,
      page = 1,
      limit = 12,
      nearLat,
      nearLng
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (city) filter.city = new RegExp(city, 'i');
    if (area) filter.area = new RegExp(area, 'i');
    if (pincode) filter.pincode = pincode;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const items = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    let enriched = items;

    if (Number.isFinite(Number(nearLat)) && Number.isFinite(Number(nearLng))) {
      enriched = items
        .map((item) => {
          if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
            return {
              ...item,
              distanceKm: distanceKm(Number(nearLat), Number(nearLng), item.latitude, item.longitude)
            };
          }
          return item;
        })
        .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
    }

    if (req.user?.id) {
      const currentUser = await User.findById(req.user.id).select('favorites').lean();
      const favorites = new Set((currentUser?.favorites || []).map((id) => String(id)));
      enriched = enriched.map((item) => ({
        ...item,
        isFavorite: favorites.has(String(item._id))
      }));
    }

    const total = await Listing.countDocuments(filter);

    res.json({
      items: enriched,
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('postedBy', 'name email phone role avatarUrl');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    let isFavorite = false;
    if (req.user?.id) {
      const user = await User.findById(req.user.id).select('favorites').lean();
      isFavorite = (user?.favorites || []).some((fav) => String(fav) === String(listing._id));
    }

    res.json({
      ...listing.toObject(),
      isFavorite
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const { error, listing } = await assertOwnerOrAdmin(req.params.id, req.user.id, req.user.role);
    if (error) return res.status(error.status).json({ message: error.message });

    Object.assign(listing, req.body, toGeoPayload(req.body));
    if (req.file) listing.photoPath = req.file.path;
    await listing.save();

    res.json(listing);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { error, listing } = await assertOwnerOrAdmin(req.params.id, req.user.id, req.user.role);
    if (error) return res.status(error.status).json({ message: error.message });

    await listing.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment = '' } = req.body || {};

  console.log('[reviews] Incoming review submission', {
    listingId: id,
    userId: req.user?.id,
    rating
  });

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn('[reviews] Invalid listing id', { listingId: id });
    return res.status(400).json({ message: 'Invalid listing id' });
  }

  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      console.warn('[reviews] Listing not found for review', { listingId: id });
      return res.status(404).json({ message: 'Listing not found' });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5' });
    }

    const existingReview = listing.reviews.find(
      (review) => String(review.user) === String(req.user.id)
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment?.trim() || '';
      existingReview.isHidden = false;
    } else {
      listing.reviews.push({
        user: req.user.id,
        rating: numericRating,
        comment: comment?.trim() || ''
      });
    }

    await listing.save();

    console.log('[reviews] Review saved successfully', {
      listingId: id,
      totalReviews: listing.reviews.length,
      updatedExisting: Boolean(existingReview)
    });

    res.status(existingReview ? 200 : 201).json({
      message: existingReview ? 'Review updated' : 'Review added',
      reviews: listing.reviews
    });
  } catch (err) {
    console.error('[reviews] Failed to save review', {
      listingId: id,
      error: err.message
    });
    next(err);
  }
});

router.post('/:id/report', requireAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const report = await Report.create({
      reporterId: req.user.id,
      listingId: req.params.id,
      reason: req.body.reason || 'General concern',
      details: req.body.details || ''
    });

    listing.reportsCount += 1;
    await listing.save();

    await createNotification({
      userId: listing.postedBy,
      type: 'report',
      title: 'Listing reported',
      message: `"${listing.title}" received a new report.`,
      metadata: {
        listingId: listing._id,
        reportId: report._id,
        listingTitle: listing.title,
        actorId: req.user.id,
        actorName: req.user.name || 'A user'
      },
      dedupe: {
        listingId: String(listing._id)
      }
    });

    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:listingId/reviews/:reviewId', requireAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const review = listing.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const canModerate =
      req.user.role === 'admin' ||
      String(listing.postedBy) === String(req.user.id) ||
      String(review.user) === String(req.user.id);

    if (!canModerate) {
      return res.status(403).json({ message: 'Not allowed to moderate this review' });
    }

    review.deleteOne();
    await listing.save();

    res.json({ message: 'Review removed', reviews: listing.reviews });
  } catch (err) {
    next(err);
  }
});

export default router;
