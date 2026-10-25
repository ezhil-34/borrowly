# Borrowly — Peer-to-Peer Borrowing Marketplace

> **Clean React.js + Tailwind CSS Frontend** · **Express.js Microservices Backend** · **Firebase Firestore Storage**

---

## 🏗️ Architecture Overview

### 1. Frontend (`client/`)
Built with **React 18**, **Vite**, and **Tailwind CSS**, featuring an intuitive modular structure:

```
client/src/
├── api/
│   ├── client.js             # HTTP request client, bearer auth header injection, error handling
│   └── index.js              # Typed endpoint modules (authApi, itemsApi, bookingsApi, messagingApi)
├── components/
│   ├── common/               # Button, Input, Modal, Skeleton, ErrorBox, Countdown, Toast
│   ├── layout/               # Navbar, Footer, MobileNav
│   ├── items/                # ItemCard, ItemGrid, FilterBar
│   ├── bookings/             # BookingCard (rental lifecycle state machine & countdown)
│   └── modals/               # AuthModal (Login/Signup/Reset), AccountModal, ReviewModal, ReportModal
├── context/
│   └── AppContext.jsx        # Global reactive context (user auth, location, saved items, badges)
├── hooks/
│   └── useFetch.js           # Reusable data fetching hook with reload trigger
├── pages/
│   ├── HomePage.jsx          # Hero search, categories, contextual recommendations, near you
│   ├── SearchPage.jsx        # Catalog browsing with filters (category, dates, radius, sort)
│   ├── ItemDetailPage.jsx    # Photo gallery, real-time quote calculator, booking widget, reviews
│   ├── ListItemPage.jsx      # 6-step listing wizard with browser canvas image optimization
│   ├── ActivityPage.jsx      # Tabbed activity tracker (borrowing, lending, overdue, listings)
│   ├── MessagesPage.jsx      # Private in-app chat split-view with auto-polling
│   ├── SavedPage.jsx         # Bookmarked items grid
│   ├── NotificationsPage.jsx # In-app notification stream with read badges
│   ├── HelpPage.jsx          # Safety rules, FAQs, dispute submission
│   ├── HowItWorksPage.jsx    # Step-by-step marketplace guide
│   ├── ProfilePage.jsx       # User profile and neighbourhood management
│   └── NotFoundPage.jsx      # 404 handler
├── utils/
│   ├── constants.js          # Categories, Chennai coordinates, booking status configs
│   └── formatters.js         # INR currency, date/time formatters, star rating helpers
├── App.jsx                   # Central page routing and global modal containers
└── index.css                 # Modern Tailwind styles & Plus Jakarta Sans typography
```

---

### 2. Backend (`server/`)
Decoupled **Express.js Microservices** with **Firebase Firestore** as the data store:

```
server/
├── common/
│   ├── config.js             # Centralized environment config & port registry
│   ├── firebase.js           # Firebase Admin SDK + Local Firestore Engine (zero-config offline)
│   ├── utils.js              # Firestore helpers (getDoc, setDoc, queryCollection), uid, notify
│   └── middleware/
│       ├── auth.middleware.js # JWT verification and requireAuth guard
│       ├── cors.middleware.js # Cross-Origin resource sharing headers
│       └── error.middleware.js# Centralized error handler & asyncHandler wrapper
├── services/
│   ├── auth/                 # 🔐 Auth Microservice (Port 3001)
│   │   ├── auth.service.js   # Signup, bcrypt login, profile updates (Firestore users collection)
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js    # /api/auth/signup, /api/auth/login, /api/me
│   │   └── server.js         # Standalone microservice HTTP server
│   ├── catalog/              # 📦 Catalog & Discovery Microservice (Port 3002)
│   │   ├── catalog.service.js# Item CRUD, date-overlap checks, saved bookmarks (Firestore)
│   │   ├── recommender.js    # TF-IDF cosine similarity + multi-signal scoring
│   │   ├── reviews.summary.js# Keyword-based sentiment and review themes
│   │   ├── catalog.controller.js
│   │   ├── catalog.routes.js # /api/items, /api/recommendations, /api/my/items, /api/saved
│   │   └── server.js         # Standalone microservice HTTP server
│   ├── bookings/             # 📅 Bookings & Rental Lifecycle Microservice (Port 3003)
│   │   ├── pricing.js        # Single source of truth for quotes (5% platform fee, 1.5× late fee)
│   │   ├── bookings.service.js# Firestore transactions for double-booking guard, state transitions
│   │   ├── bookings.controller.js
│   │   ├── bookings.routes.js# /api/quote, /api/bookings, /api/bookings/:id/:action
│   │   └── server.js         # Standalone microservice HTTP server
│   └── messaging/            # 💬 Messaging & Notifications Microservice (Port 3004)
│       ├── messaging.service.js # Firestore sub-collection chat, notification batching
│       ├── messaging.controller.js
│       ├── messaging.routes.js# /api/chat/:id, /api/notifications, /api/reports
│       └── server.js         # Standalone microservice HTTP server
├── runner.js                 # Distributed cluster runner (starts all 4 microservices + Gateway)
├── seed.js                   # Demo database seeder (demo users, items, starter reviews)
└── index.js                  # Gateway entrypoint (Port 3000)
```

---

### 3. Firestore Data Model

| Collection | Description |
|---|---|
| `users` | User profiles (auth, ratings, savedItems, viewedItems arrays) |
| `users/{id}/notifications` | Per-user notification sub-collection |
| `users/{id}/searches` | Per-user search history sub-collection |
| `items` | Listings (status, ownerId, geo coordinates, images) |
| `items/{id}/reviews` | Per-item review sub-collection |
| `bookings` | Booking records with lifecycle history |
| `bookings/{id}/messages` | Per-booking chat message sub-collection |
| `stats` | Per-item view/save/booking counters |
| `events` | Analytics events (view, save, request) |
| `reports` | User-submitted safety reports |

---

## ⚡ How to Run It

### Step 1: Set Up Firebase (Choose One)

#### Option A: Zero-Config Local Mode (No setup needed!)
Just run the app — it automatically uses a **built-in local Firestore engine** stored in `.firebase_local/`.
No accounts, no cloud, no configuration required. Perfect for local development.

#### Option B: Real Firebase (Recommended for production / sharing)
1. Go to [Firebase Console](https://console.firebase.google.com) → Create a project
2. Project Settings → Service Accounts → **Generate new private key** → download `serviceAccountKey.json`
3. Place `serviceAccountKey.json` in the **project root** (next to `package.json`)

#### Option C: Firestore Emulator
```bash
# Install Firebase tools once:
npm.cmd install -g firebase-tools

# Start emulator:
firebase emulators:start --only firestore

# Run the app with emulator:
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
npm.cmd run dev
```

---

### Step 2: Configure Environment (Optional)
```bash
# Copy the example file:
copy .env.example .env

# Edit .env if you want to change JWT secret, ports, etc.
```

---

### Step 3: Install Dependencies
```bash
# Server dependencies:
npm.cmd install

# Client dependencies:
npm.cmd --prefix client install
```

---

### Step 4: Seed Demo Data (Optional)
```bash
npm.cmd run seed
```
> **Demo Login:** `demo@borrowly.app` / `demo1234`

---

### Step 5: Run the Application

#### Option A: Unified Dev Server *(Recommended)*
Runs the API Gateway (Port 3000) and Vite hot-reload frontend (Port 5173) concurrently:
```bash
npm.cmd run dev
```
- **Frontend:** http://localhost:5173 (proxies `/api` → `http://localhost:3000`)
- **API Health:** http://localhost:3000/api/health

---

#### Option B: Distributed Microservices Cluster
Runs each microservice independently:
```bash
npm.cmd run dev:micro
```
| Service | Port |
|---|---|
| 🔐 Auth | 3001 |
| 📦 Catalog | 3002 |
| 📅 Bookings | 3003 |
| 💬 Messaging | 3004 |
| 🌐 API Gateway | 3000 |
| 💻 Frontend | 5173 |

---

#### Option C: Individual Microservices
```bash
npm.cmd run service:auth       # Port 3001
npm.cmd run service:catalog    # Port 3002
npm.cmd run service:bookings   # Port 3003
npm.cmd run service:messaging  # Port 3004
```

---

#### Option D: Production Build & Run
```bash
npm.cmd run build   # Builds the React client
npm.cmd start       # Serves everything from port 3000
```
Visit http://localhost:3000

---

## 🧪 Health Check
```bash
curl http://localhost:3000/api/health
```
```json
{
  "gateway": "healthy",
  "uptime": 12.4,
  "timestamp": "2026-10-25T11:00:00.000Z",
  "microservices": {
    "auth": { "status": "active", "port": 3001 },
    "catalog": { "status": "active", "port": 3002 },
    "bookings": { "status": "active", "port": 3003 },
    "messaging": { "status": "active", "port": 3004 }
  }
}
```

---

## 🔑 Firebase Migration Notes

Redis has been **fully replaced** with Firebase Firestore:

| Old (Redis) | New (Firestore) |
|---|---|
| `redis.set("user:id", ...)` | `db.collection("users").doc(id).set(...)` |
| `redis.smembers("items")` | `db.collection("items").where("status","==","active").get()` |
| `redis.rpush("chat:id", ...)` | `db.collection("bookings").doc(id).collection("messages").add(...)` |
| `redis.lpush("notif:userId", ...)` | `db.collection("users").doc(id).collection("notifications").add(...)` |
| `redis.set(lockKey, ..., "NX")` | `db.runTransaction(tx => { ... })` |
| `redis.hincrby("stats:id", ...)` | `FieldValue.increment(n)` |

All data persists across restarts via:
- **Local Mode:** `.firebase_local/firestore_store.json`
- **Cloud Mode:** Google Cloud Firestore (real-time sync, scalable)
