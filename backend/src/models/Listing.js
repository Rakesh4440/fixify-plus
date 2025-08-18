import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true }
  },
  { timestamps: true }
);

const reportSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true }
  },
  { timestamps: true }
);

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },

    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contactNumber: { type: String, required: true, trim: true },
    isCommunityPosted: { type: Boolean, default: false },

    // (These exist so current routes don't crash; we'll simplify later)
    isVerified: { type: Boolean, default: false },
    reviewStatus: { type: String, enum: ['ok', 'under_review'], default: 'ok' },

    // locality
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
    pincode: { type: String, trim: true },
    location: { type: String, trim: true },

    // pricing/type
    price: { type: Number },
    type: { type: String, enum: ['service', 'rental'], required: true },

    // service-only
    serviceType: { type: String, trim: true },
    availability: { type: String, trim: true },

    // rental-only
    rentalDurationUnit: { type: String, enum: ['hour', 'day', 'week', 'month'] },
    itemCondition: { type: String, trim: true },

    // media
    photoPath: { type: String, trim: true },

    // community signals
    reviews: [reviewSchema],
    endorsements: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reports: [reportSchema]
  },
  { timestamps: true }
);

// speeds up filters & sorting on home
listingSchema.index({ city: 1, area: 1, pincode: 1, category: 1, type: 1, createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
