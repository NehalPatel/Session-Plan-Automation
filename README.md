# Session Plan Automation

Automate college session plans from syllabus text and lecture schedules.

## Stack

- **Frontend:** React + Vite (`apps/web`) → Vercel
- **Backend:** Express + TypeScript (`apps/api`) → Render
- **Database:** MongoDB Atlas

## Local development

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/sessionplan
JWT_SECRET=dev-secret
CORS_ORIGIN=http://localhost:5173
```

Edit `apps/web/.env`:

```
VITE_API_URL=http://localhost:4000
```

### Run

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Web
npm run dev:web
```

- Web: http://localhost:5173
- API: http://localhost:4000

## Deployment

### MongoDB Atlas

1. Create a free M0 cluster.
2. Create database user and allow network access (`0.0.0.0/0` for Render).
3. Use database name **`sessionplan`** (not other existing DBs).
4. Copy connection string to `MONGODB_URI` on Render and in local `apps/api/.env` for seeding.

Example:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sessionplan?retryWrites=true&w=majority
```

### Render (API)

**Dashboard:** Render → Web Service → **Environment** → Add variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas URI with `/sessionplan` |
| `JWT_SECRET` | Long random string (Render can generate) |
| `CORS_ORIGIN` | `https://session-plan-automation-web.vercel.app` (no trailing slash) |

**Service settings:**

| Field | Value |
|-------|--------|
| Root Directory | `apps/api` |
| Build Command | `cd ../.. && npm install --include=dev && npm run build:api` |
| Start Command | `npm start` |

Or deploy via [`render.yaml`](render.yaml) at repo root.

### Vercel (Web)

**Dashboard:** Vercel → Project → **Settings** → **Environment Variables**

| Key | Value | Environments |
|-----|--------|----------------|
| `VITE_API_URL` | `https://session-plan-api.onrender.com` (no trailing slash) | Production, Preview |

**Project settings:**

| Field | Value |
|-------|--------|
| Root Directory | `apps/web` |
| Build | Uses [`apps/web/vercel.json`](apps/web/vercel.json) |

After changing `VITE_API_URL`, **Redeploy** (env vars are baked in at build time).

Do **not** put `MONGODB_URI` or `JWT_SECRET` on Vercel.

### Admin account (seed)

Admin users are created in MongoDB, not via public registration. Run from your machine against the **same** `MONGODB_URI` as production:

1. Set `MONGODB_URI` in `apps/api/.env` to your Atlas production URI.
2. Run (PowerShell):

```powershell
$env:ADMIN_NAME = "Admin"
$env:ADMIN_EMAIL = "your-admin@email.com"
$env:ADMIN_PASSWORD = "your-secure-password"
npm run seed:admin
```

3. Log in on the Vercel site with those credentials → lands on `/admin` (users list).

Re-running the seed updates password and promotes an existing email to admin.

## Usage

### Faculty

1. Register / login.
2. **Step 1:** Paste syllabus text and prepare lectures (first line = unit, each following line = topic).
3. **Step 2:** Enter AY, class, semester, divisions, lecture dates; uncheck holidays.
4. **Step 3:** Choose units.
5. **Generate** → preview/edit → **Download DOCX**.

### Admin

1. Log in with seeded admin account.
2. View all faculty users and expand **View plans** for each user's session plans.

Sample files are in `docs/` for reference.
