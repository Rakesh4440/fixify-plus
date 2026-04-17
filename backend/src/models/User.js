import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'admin', 'community'], default: 'user' },
    googleId: { type: String, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
