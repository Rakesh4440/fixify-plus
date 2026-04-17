import Notification from '../models/Notification.js';

export async function createNotification({
  userId,
  senderId = null,
  type,
  title,
  message,
  link = ''
}) {
  if (!userId || !type || !title || !message) return null;

  const recentThreshold = new Date(Date.now() - 2 * 60 * 1000);
  const existing = await Notification.findOne({
    user: userId,
    type,
    link,
    createdAt: { $gte: recentThreshold }
  }).sort({ createdAt: -1 });

  if (existing) {
    existing.sender = senderId || existing.sender || null;
    existing.title = title;
    existing.message = message;
    existing.link = link || existing.link || '';
    existing.isRead = false;
    await existing.save();
    return existing;
  }

  return Notification.create({
    user: userId,
    sender: senderId,
    type,
    title,
    message,
    link
  });
}
