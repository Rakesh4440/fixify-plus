import express from 'express';
import Listing from '../models/Listing.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();

// PUT /api/users/:id/community-verify
// Body: { listingId }
router.put('/:id/community-verify', authRequired, requireRole('admin', 'community'), async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'listingId required' });
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.isVerified = true;
    await listing.save();
    res.json({ message: 'Listing marked Community Verified', listingId: listing._id });
  } catch (err) {
    next(err);
  }
});

export default router;
