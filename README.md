# OceanX CMS — Admin Portal

Internal content management portal for [OceanX Insight](https://insight.oceanx.sa).

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Rich text | TipTap |
| Data fetching | TanStack Query v5 |
| Auth | JWT (HS256) |
| File uploads | Multer (local) |

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm or pnpm

---

## Setup

### 1. Clone & install

```bash
cd /Users/khaledalghamdi/oceanx-cms

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database

Create the PostgreSQL database:

```bash
createdb oceanx_cms
# or: psql -U postgres -c "CREATE DATABASE oceanx_cms;"
```

### 3. Environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET at minimum
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to /api (proxied through Vite dev server)
```

### 4. Run migrations

```bash
cd backend
npm run migrate
```

### 5. Seed demo data

```bash
npm run seed
```

This creates:
- Admin user: `admin@oceanx.sa` / `Admin@123`
- 3 reports, 3 articles, 2 pages, 4 services, 3 news items

---

## Running (Development)

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 4000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5174)
cd frontend
npm run dev
```

Visit: **http://localhost:5174**

Login with: `admin@oceanx.sa` / `Admin@123`

---

## API Reference

All endpoints (except `/api/auth/login`) require:
```
Authorization: Bearer <jwt_token>
```

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| PUT | /api/auth/change-password | Change password |
| GET | /api/dashboard/stats | Dashboard counts + activity |
| GET/POST | /api/reports | List / Create |
| GET/PUT/DELETE | /api/reports/:id | Get / Update / Delete |
| PATCH | /api/reports/:id/toggle-status | Toggle draft/published |
| GET/POST | /api/articles | List / Create |
| GET/PUT/DELETE | /api/articles/:id | Get / Update / Delete |
| PATCH | /api/articles/:id/toggle-status | Toggle draft/published |
| GET/POST | /api/pages | List / Create |
| GET/PUT/DELETE | /api/pages/:id | Get / Update / Delete |
| PATCH | /api/pages/:id/toggle-status | Toggle draft/published |
| GET | /api/media | List media |
| POST | /api/media/upload | Upload file (multipart) |
| PATCH | /api/media/:id/tags | Update tags |
| DELETE | /api/media/:id | Delete file |
| GET/POST | /api/services | List / Create |
| GET/PUT/DELETE | /api/services/:id | Get / Update / Delete |
| PATCH | /api/services/:id/toggle-active | Toggle active/inactive |
| GET/POST | /api/news | List / Create |
| GET/PUT/DELETE | /api/news/:id | Get / Update / Delete |
| PATCH | /api/news/:id/toggle-status | Toggle draft/published |

Query params for list endpoints: `?page=1&limit=10&search=keyword&status=published`

---

## Production Build

```bash
# Backend
cd backend && npm run build
node dist/server.js

# Frontend
cd frontend && npm run build
# Serve dist/ with nginx or any static host
```

---

## File Uploads

Uploaded files are stored in `backend/uploads/` and served at `http://localhost:4000/uploads/<filename>`.

To use S3, set the AWS environment variables in `.env` and update `upload.middleware.ts` to use `multer-s3`.

---

## Adding a New Content Module

1. Add table to `migrations/001_initial.sql`
2. Create `src/controllers/<module>.controller.ts` (CRUD + toggle)
3. Create `src/routes/<module>.routes.ts`
4. Register route in `src/server.ts`
5. Add `src/api/<module>.ts` on the frontend
6. Add list + form pages in `src/pages/<module>/`
7. Register routes in `src/App.tsx`
8. Add nav item in `src/components/layout/Sidebar.tsx`
