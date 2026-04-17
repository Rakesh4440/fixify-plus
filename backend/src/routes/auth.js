import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../utils/token.js';

const router = express.Router();
const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
);

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    favorites: user.favorites || []
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone,
      role: role === 'admin' ? 'user' : role || 'user'
    });

    const token = signToken(user);

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isGoogleOnly = user.googleId && user.password === 'google-oauth';
    const ok = isGoogleOnly ? false : await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites', '_id title');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/google', (req, res, next) => {
  if (!googleEnabled) {
    return res.status(503).json({ message: 'Google OAuth is not configured yet.' });
  }

  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google-not-configured`);
  }

  return passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google`
  })(req, res, async () => {
    const token = signToken(req.user);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
  });
});

router.post('/favorites/:listingId', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = user.favorites.some((id) => String(id) === req.params.listingId);
    if (existing) {
      user.favorites = user.favorites.filter((id) => String(id) !== req.params.listingId);
      await Listing.findByIdAndUpdate(req.params.listingId, { $inc: { favoritesCount: -1 } });
    } else {
      user.favorites.push(req.params.listingId);
      await Listing.findByIdAndUpdate(req.params.listingId, { $inc: { favoritesCount: 1 } });
    }

    await user.save();
    res.json({
      favorites: user.favorites,
      isFavorite: !existing
    });
  } catch (err) {
    next(err);
  }
});

export default router;
