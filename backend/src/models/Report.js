import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'dismissed'],
      default: 'open'
    }
  },
  { timestamps: true }
);

reportSchema.index({ listingId: 1, status: 1 });

export default mongoose.model('Report', reportSchema);

