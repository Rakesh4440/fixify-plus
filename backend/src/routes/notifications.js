import express from 'express';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('sender', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { user, sender = null, type, title, message, link = '' } = req.body || {};
    const targetUser = user || req.user.id;

    const recentThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const existing = await Notification.findOne({
      user: targetUser,
      type,
      link,
      createdAt: { $gte: recentThreshold }
    }).sort({ createdAt: -1 });

    const notification = existing
      ? await Notification.findByIdAndUpdate(
          existing._id,
          {
            sender: sender || existing.sender || null,
            title,
            message,
            link,
            isRead: false
          },
          { new: true }
        ).populate('sender', 'name email avatarUrl')
      : await Notification.create({
          user: targetUser,
          sender,
          type,
          title,
          message,
          link
        });

    res.status(existing ? 200 : 201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    ).populate('sender', 'name email avatarUrl');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    }).populate('sender', 'name email avatarUrl');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
});

export default router;
