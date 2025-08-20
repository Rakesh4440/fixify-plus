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

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contactNumber: { type: String, required: true, trim: true },

    // flags
    isCommunityPosted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // legacy freeform
    location: { type: String, trim: true },

    // explicit address fields (for filtering)
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
    pincode: { type: String, trim: true },

    // pricing / type
    price: { type: Number },
    type: { type: String, enum: ['service', 'rental'], required: true },

    // Service-specific
    serviceType: { type: String, trim: true },
    availability: { type: String, trim: true },

    // Rental-specific
    rentalDurationUnit: { type: String, enum: ['hour', 'day', 'week', 'month'] },
    itemCondition: { type: String, trim: true },

    // Reviews
    reviews: [reviewSchema],

    // Community endorsements (optional)
    endorsements: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Cloudinary image fields
    photoPath: { type: String, trim: true },       // https URL to the image
    photoPublicId: { type: String, trim: true }     // cloudinary public_id (for future delete/replace)
  },
  { timestamps: true }
);

export default mongoose.model('Listing', listingSchema);
