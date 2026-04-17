import express from 'express';
import Conversation from '../models/Conversation.js';
import Listing from '../models/Listing.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('listingId', 'title photoPath')
      .populate('participants', 'name avatarUrl role')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const participants = [String(req.user.id), String(listing.postedBy)].sort();

    let conversation = await Conversation.findOne({
      listingId,
      participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        listingId,
        participants
      });
    }

    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.some((id) => String(id) === String(req.user.id))) {
      return res.status(403).json({ message: 'Not allowed to view this conversation' });
    }

    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.some((id) => String(id) === String(req.user.id))) {
      return res.status(403).json({ message: 'Not allowed to send messages here' });
    }

    const receiverId = conversation.participants.find((id) => String(id) !== String(req.user.id));
    const [sender, listing] = await Promise.all([
      User.findById(req.user.id).select('name'),
      Listing.findById(conversation.listingId).select('title')
    ]);
    const message = await Message.create({
      conversationId: conversation._id,
      listingId: conversation.listingId,
      senderId: req.user.id,
      receiverId,
      text: req.body.text
    });

    conversation.lastMessage = req.body.text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await createNotification({
      userId: receiverId,
      type: 'message',
      title: `New message from ${sender?.name || 'someone'}`,
      message: req.body.text.slice(0, 120),
      metadata: {
        conversationId: conversation._id,
        listingId: conversation.listingId,
        senderId: req.user.id,
        senderName: sender?.name || 'Unknown user',
        listingTitle: listing?.title || 'Listing'
      },
      dedupe: {
        conversationId: String(conversation._id),
        listingId: String(conversation.listingId)
      }
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

export default router;
