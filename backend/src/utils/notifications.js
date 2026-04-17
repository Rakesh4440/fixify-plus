import Notification from '../models/Notification.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {}
}) {
  if (!userId) return null;

  return Notification.create({
    user: userId,
    type,
    title,
    message,
    metadata
  });
}

