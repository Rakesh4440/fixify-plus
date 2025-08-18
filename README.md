# Fixify+ — Community Services & P2P Rentals (MERN)

**Fixify+** is a community-driven marketplace that connects residents with **local service providers** (maids, plumbers, cooks, tutors) and enables **peer-to-peer rentals** (tools, bicycles, gear).  
It’s designed to be **inclusive**: providers don’t need smartphones or accounts—**community members can post on their behalf**, and customers contact them directly via **WhatsApp/Call**.

---

## ✨ Features
- Community-posted listings (on behalf of providers).
- Services & Rentals in one model (`type: "service" | "rental"`).
- Image uploads (stored locally).
- Search & Filters: query, category, city/area/pincode, type.
- Pagination & indexing for performance.
- Reviews & Ratings system (stars + comments).
- Direct WhatsApp & Call buttons.
- JWT-based auth for secure login/registration.
- Owner-only edit/delete for listings.

---

## 🚀 Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # edit with your details
npm install
npm run dev
.env example

ini
Copy
Edit
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:5173
Frontend
bash
Copy
Edit
cd frontend
cp .env.example .env
npm install
npm run dev
.env example

bash
Copy
Edit
VITE_API_URL=http://localhost:5000/api
Optional: Seed Demo Data
bash
Copy
Edit
cd backend
npm run seed
🧭 How It Works
Register/Login

Post a listing (with phone number & photo)

Browse & Filter listings by location/category

Contact provider directly via WhatsApp/Call

Leave reviews and rate services

📦 Tech Stack
MongoDB Atlas — database

Express.js — backend APIs

React (Vite) — frontend

Node.js — server

Multer — file uploads

JWT + bcrypt — authentication & security

📂 Project Structure
bash
Copy
Edit
fixify-plus/
  backend/
    src/models/Listing.js
    src/models/User.js
    src/routes/
    uploads/
  frontend/
    src/components/
    src/pages/
    src/services/
🔐 Security
JWT authentication

Passwords hashed with bcrypt

CORS restricted

Edit/Delete only allowed for owners

☁️ Deployment
Backend: Render / Railway

Frontend: Vercel / Netlify

Env vars must be configured accordingly.