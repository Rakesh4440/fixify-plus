import Notification from '../models/Notification.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
  dedupe = {}
}) {
  if (!userId) return null;

  const dedupeQuery = {
    user: userId,
    type,
    isRead: false
  };

  if (dedupe.conversationId) dedupeQuery['metadata.conversationId'] = dedupe.conversationId;
  if (dedupe.bookingId) dedupeQuery['metadata.bookingId'] = dedupe.bookingId;
  if (dedupe.listingId) dedupeQuery['metadata.listingId'] = dedupe.listingId;

  const hasDedupeKey = Object.keys(dedupe).length > 0;

  if (hasDedupeKey) {
    const existing = await Notification.findOne(dedupeQuery).sort({ createdAt: -1 });
    if (existing) {
      existing.title = title;
      existing.message = message;
      existing.metadata = {
        ...existing.metadata,
        ...metadata,
        repeatCount: Number(existing.metadata?.repeatCount || 1) + 1
      };
      existing.updatedAt = new Date();
      await existing.save();
      return existing;
    }
  }

  return Notification.create({
    user: userId,
    type,
    title,
    message,
    metadata: {
      repeatCount: 1,
      ...metadata
    }
  });
}
