import express from 'express';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { authorize, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth, authorize('admin'));

router.get('/stats', async (_req, res, next) => {
  try {
    const [users, listings, bookings, reports] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Booking.countDocuments(),
      Report.countDocuments()
    ]);

    const reviewsAgg = await Listing.aggregate([
      { $project: { reviewCount: { $size: '$reviews' } } },
      { $group: { _id: null, total: { $sum: '$reviewCount' } } }
    ]);

    res.json({
      totals: {
        users,
        listings,
        reviews: reviewsAgg[0]?.total || 0,
        bookings,
        reports
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.get('/listings', async (_req, res, next) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 }).populate('postedBy', 'name email role');
    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

router.get('/reports', async (_req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate('listingId', 'title')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/listings/:id', async (req, res, next) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:listingId/:reviewId', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const review = listing.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.isHidden = Boolean(req.body.isHidden);
    await listing.save();

    res.json({ review });
  } catch (err) {
    next(err);
  }
});

router.patch('/reports/:id', async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || 'reviewed' },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

export default router;

