import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.warn('[auth] Google OAuth is disabled because required env vars are missing.');
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, ...(email ? [{ email }] : [])]
          });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName || 'Google User',
              email: email || `google-${profile.id}@fixify.local`,
              phone: '0000000000',
              password: 'google-oauth',
              avatarUrl: profile.photos?.[0]?.value || '',
              role: 'user'
            });
          } else {
            user.googleId = profile.id;
            user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
            if (email) user.email = email;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  return passport;
}

