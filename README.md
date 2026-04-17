# Fixify+ — Production-Ready MERN Marketplace

Fixify+ is a recruiter-friendly MERN application for neighborhood services and rentals. The app keeps the original marketplace flow intact, including the existing WhatsApp and Call actions, while extending it with bookings, chat, notifications, admin tooling, location-aware discovery, analytics, and Docker support.

## Highlights

- JWT auth with role-aware access control
- Google OAuth via Passport.js
- Listing ownership protection for edit/delete
- Booking system with provider accept/reject flow
- Real-time chat with Socket.io and MongoDB persistence
- Notification center for bookings, messages, and moderation events
- Admin dashboard with stats, user/listing deletion, and report review
- Browser geolocation support and nearby sorting
- Favorites/bookmarks, reports, listing view analytics, and search suggestions
- Dark mode, loading skeletons, and responsive UI improvements
- Standardized `/api/...` routes, centralized error handling, and rate limiting
- Docker support for frontend, backend, and MongoDB

## Project Structure

```bash
fixify-plus/
  backend/
    src/
      config/
      middleware/
      models/
      routes/
      utils/
  frontend/
    src/
      components/
      pages/
      services/
  docker-compose.yml
```

## Backend Environment

Copy `backend/.env.example` to `backend/.env` and configure:

```ini
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fixifyplus?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=300
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=no-reply@fixify.local
```

## Frontend Environment

Copy `frontend/.env.example` to `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

Important: in production, `VITE_API_URL` must point to your deployed backend `/api` base URL. The frontend no longer falls back to `localhost`.

## Local Development

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Optional seed:

```bash
cd backend
npm run seed
```

## API Modules

- `/api/auth`
  Register, login, current user, Google OAuth, favorites
- `/api/listings`
  CRUD, reviews, suggestions, reporting, geolocation-aware listing fetch
- `/api/bookings`
  Booking create/history/provider status updates
- `/api/conversations`
  Chat threads and messages
- `/api/notifications`
  Notification center and read state
- `/api/admin`
  Stats, moderation, user/listing management

## Deployment Notes

### Frontend on Vercel

- Set project root to `frontend`
- Add `VITE_API_URL` pointing to your backend
- `frontend/vercel.json` rewrites dynamic SPA routes like `/listing/:id` to `index.html`

### Backend on Render/Railway

- Set `CORS_ORIGIN` to your frontend origin
- Set `FRONTEND_URL` for Google OAuth redirect
- Configure MongoDB, Google OAuth, and optional SMTP credentials

## Docker

Run the full stack with:

```bash
docker-compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

If you prefer MongoDB Atlas, set `MONGO_URI` in your shell before running `docker-compose up` and the backend will use it instead of the local Mongo container default.

## Existing Features Preserved

- WhatsApp button remains active on listing cards and detail pages
- Call button remains active on listing cards and detail pages
- Listing creation, editing, detail views, and reviews remain in place

## Recruiter-Impressive Additions

- Admin-ready operational dashboard
- Realtime customer-to-provider chat
- Booking workflow and notifications
- Nearby search plus richer listing analytics
- Favorites, reporting, dark mode, and loading skeletons
- Dockerized local environment and deployment-oriented env structure
