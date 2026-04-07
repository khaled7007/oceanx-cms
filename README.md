# OceanX CMS — Admin Portal

Internal content management portal for [OceanX Insight](https://insight.oceanx.sa).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Rich text | TipTap |
| Data fetching | TanStack Query v5 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Cloudflare R2 (via Worker) |

---

## Architecture

```
Browser ──▶ React SPA
              ├── Firebase Auth  (login / session)
              ├── Cloud Firestore (all CRUD data)
              └── Cloudflare Worker ──▶ R2 Bucket (file uploads)
```

- **No backend server.** All data lives in Firestore, and uploads go through a lightweight Cloudflare Worker that proxies files to an R2 bucket.
- Reports and media are fully persisted in Firestore. Other modules (articles, news, pages, services) currently use in-memory mock data — they can be migrated to Firestore as needed using the same pattern found in `src/services/reports.service.ts`.

---

## Prerequisites

- Node.js ≥ 18
- A [Firebase](https://console.firebase.google.com/) project with **Authentication** (Email/Password) and **Firestore** enabled
- A [Cloudflare](https://dash.cloudflare.com/) account with an **R2 bucket** and a **Worker** deployed

---

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd oceanx-cms/frontend
npm install
```

### 2. Firebase configuration

1. In the Firebase console, enable **Email/Password** sign-in under Authentication → Sign-in method.
2. Create a **Firestore Database** (start in production mode or test mode as needed).
3. Copy your Firebase web app config values.

### 3. Cloudflare R2 + Worker

1. Create an R2 bucket (e.g. `oceanx-media`) in the Cloudflare dashboard.
2. Enable **public access** on the bucket (Settings → Public access) and note the public URL.
3. Deploy the upload worker:

```bash
cd frontend/oceanx-upload-worker
npm install
npx wrangler secret put UPLOAD_SECRET   # set a strong random string
npx wrangler deploy
```

4. Note the deployed worker URL (e.g. `https://oceanx-upload-worker.<account>.workers.dev`).

### 4. Environment variables

```bash
cd frontend
cp .env.example .env
```

Fill in your `.env`:

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Cloudflare R2
VITE_R2_WORKER_URL=https://oceanx-upload-worker.<account>.workers.dev
VITE_R2_UPLOAD_SECRET=<same secret you set in wrangler>
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 5. Create an admin user

In the Firebase console → Authentication → Add user, create a user with your desired email and password. This is the account you'll log in with.

---

## Running (Development)

```bash
cd frontend
npm run dev
```

Visit: **http://localhost:5174**

---

## Production Build

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, Firebase Hosting, etc.).

---

## Project Structure

```
frontend/
├── src/
│   ├── api/            # Data access layer (Firestore services + mock modules)
│   ├── components/     # Shared UI components
│   │   ├── layout/     # Header, Sidebar, Layout
│   │   └── ui/         # Button, Input, Modal, FileUpload, etc.
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── i18n/           # English + Arabic translations
│   ├── lib/            # Firebase initialization
│   ├── pages/          # Route pages (articles, reports, media, etc.)
│   ├── services/       # Business logic (reports.service, storage.service)
│   └── types/          # TypeScript interfaces
├── oceanx-upload-worker/   # Cloudflare Worker for R2 file uploads
└── .env.example
```

---

## Content Modules

| Module | Data source | Status |
|---|---|---|
| Reports | Firestore (`reports` collection) | ✅ Fully integrated |
| Media Library | Firestore (`media` collection) + R2 | ✅ Fully integrated |
| Articles | In-memory mock | Mock data |
| News | In-memory mock | Mock data |
| Pages | In-memory mock | Mock data |
| Services | In-memory mock | Mock data |
| Dashboard | In-memory mock | Mock data |

### Migrating a mock module to Firestore

Follow the pattern in `src/services/reports.service.ts`:

1. Create `src/services/<module>.service.ts` with Firestore CRUD (see `reports.service.ts` as a template)
2. Update `src/api/<module>.ts` to call the service instead of using in-memory arrays
3. Set up Firestore security rules for the new collection

---

## File Uploads

Files (images, PDFs) are uploaded to **Cloudflare R2** via a Cloudflare Worker:

1. Frontend sends the file via `PUT` to the Worker with an `X-Upload-Secret` header
2. Worker validates the secret and streams the file to the R2 bucket
3. Worker returns the public URL
4. Frontend stores the URL in the relevant Firestore document

The upload logic lives in `src/services/storage.service.ts` and supports progress tracking.

---

## Internationalization

The CMS supports **English** and **Arabic** (RTL). Translations are in `src/i18n/translations.ts`. Language can be toggled from the header.
