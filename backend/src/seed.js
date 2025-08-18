import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Listing from './models/Listing.js';

dotenv.config();

async function main() {
  await connectDB(process.env.MONGO_URI);

  // 1) Ensure admin user
  const adminEmail = 'admin@fixify.local';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10); // change later
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      phone: '9999999999',
      password: hash,
      role: 'admin'
    });
    console.log('✔ Created admin:', admin.email, '(password: admin123)');
  } else {
    console.log('• Admin already exists:', admin.email);
  }

  // 2) Ensure a demo community user
  const commEmail = 'community@fixify.local';
  let community = await User.findOne({ email: commEmail });
  if (!community) {
    const hash = await bcrypt.hash('community123', 10);
    community = await User.create({
      name: 'Community Lead',
      email: commEmail,
      phone: '8888888888',
      password: hash,
      role: 'community'
    });
    console.log('✔ Created community user:', community.email, '(password: community123)');
  } else {
    console.log('• Community user already exists:', community.email);
  }

  // 3) If there are no listings, add a few samples
  const count = await Listing.countDocuments();
  if (count === 0) {
    const samples = [
      {
        title: 'Reliable Maid (Morning shift)',
        description: 'Trustworthy maid available 6 days/week. Sweeping, mopping, utensils, cloth wash & folding.',
        category: 'maid',
        type: 'service',
        contactNumber: '9876543210',
        isCommunityPosted: true,
        isVerified: true,
        postedBy: admin._id,
        state: 'Karnataka',
        city: 'Bengaluru',
        area: 'Whitefield',
        pincode: '560066',
        location: 'Near Forum Shantiniketan',
        serviceType: 'housekeeping',
        availability: 'Mon-Sat, 7–11 AM',
        reviews: [
          { user: admin._id, rating: 5, comment: 'Very punctual and sincere.' }
        ]
      },
      {
        title: 'Home Cook (South Indian specialist)',
        description: 'Experienced home cook. Veg/Non-veg, breakfast & dinner. Can do weekly meal prep.',
        category: 'cook',
        type: 'service',
        contactNumber: '9876501234',
        isCommunityPosted: true,
        isVerified: false,
        postedBy: community._id,
        state: 'Karnataka',
        city: 'Bengaluru',
        area: 'Indiranagar',
        pincode: '560038',
        availability: 'Daily, 6–9 AM & 6–9 PM',
        reviews: [
          { user: community._id, rating: 4, comment: 'Tasty and hygienic.' }
        ]
      },
      {
        title: 'Plumber on-call (Emergency & Regular)',
        description: 'Fixes leaks, taps, flush tanks, RO fitting. Same-day visits possible.',
        category: 'plumbing',
        type: 'service',
        contactNumber: '9811112233',
        isCommunityPosted: false,
        isVerified: false,
        postedBy: admin._id,
        state: 'Karnataka',
        city: 'Bengaluru',
        area: 'Marathahalli',
        pincode: '560037'
      },
      {
        title: 'Bicycle for Rent (MTB)',
        description: 'Well-maintained MTB, helmet included. Great for weekend rides.',
        category: 'bicycle',
        type: 'rental',
        contactNumber: '9898989898',
        isCommunityPosted: false,
        postedBy: admin._id,
        state: 'Karnataka',
        city: 'Bengaluru',
        area: 'HSR Layout',
        pincode: '560102',
        rentalDurationUnit: 'day',
        itemCondition: 'Good'
      }
    ];

    await Listing.insertMany(samples);
    console.log(`✔ Inserted ${samples.length} sample listings`);
  } else {
    console.log(`• Listings already exist: ${count}`);
  }

  console.log('✅ Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
