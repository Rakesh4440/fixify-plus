import express from 'express';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/notifications.js';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { listingId, date, notes = '' } = req.body;
    const listing = await Listing.findById(listingId).populate('postedBy', 'email name');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const booking = await Booking.create({
      userId: req.user.id,
      providerId: listing.postedBy._id,
      listingId,
      date,
      notes,
      paymentStatus: 'pending'
    });

    await createNotification({
      userId: listing.postedBy._id,
      type: 'booking',
      title: 'New booking request',
      message: `${req.user.name || 'A user'} requested "${listing.title}".`,
      metadata: {
        bookingId: booking._id,
        listingId,
        actorId: req.user.id,
        actorName: req.user.name || 'A user',
        listingTitle: listing.title,
        bookingDate: booking.date
      },
      dedupe: {
        bookingId: String(booking._id),
        listingId: String(listingId)
      }
    });

    await sendEmail({
      to: listing.postedBy.email,
      subject: 'New Fixify+ booking request',
      text: `You received a new booking request for "${listing.title}" on ${new Date(date).toLocaleString()}.`
    });

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [{ userId: req.user.id }, { providerId: req.user.id }]
    })
      .populate('listingId', 'title category city area contactNumber')
      .populate('userId', 'name email')
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listingId', 'title')
      .populate('userId', 'email name')
      .populate('providerId', 'email name');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const canManage =
      req.user.role === 'admin' ||
      String(booking.providerId._id) === String(req.user.id) ||
      String(booking.userId._id) === String(req.user.id);

    if (!canManage) {
      return res.status(403).json({ message: 'Not allowed to update this booking' });
    }

    const { status, paymentStatus } = req.body;
    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    await booking.save();

    await createNotification({
      userId: booking.userId._id,
      type: 'booking-status',
      title: 'Booking updated',
      message: `Your booking for "${booking.listingId.title}" is now ${booking.status}.`,
      metadata: {
        bookingId: booking._id,
        listingId: booking.listingId._id,
        actorId: booking.providerId._id,
        actorName: booking.providerId.name || 'Provider',
        listingTitle: booking.listingId.title,
        bookingStatus: booking.status
      },
      dedupe: {
        bookingId: String(booking._id),
        listingId: String(booking.listingId._id)
      }
    });

    await sendEmail({
      to: booking.userId.email,
      subject: 'Your Fixify+ booking was updated',
      text: `Your booking for "${booking.listingId.title}" is now ${booking.status}. Payment: ${booking.paymentStatus}.`
    });

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.get('/listing/:listingId', requireAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (req.user.role !== 'admin' && String(listing.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not allowed to view these bookings' });
    }

    const bookings = await Booking.find({ listingId: req.params.listingId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

export default router;
