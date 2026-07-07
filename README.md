# Session Plan Automation

Automate college session plans from syllabus text, lecture schedules, and AI-expanded topics.

## Stack

- **Frontend:** React + Vite (`apps/web`) → Vercel
- **Backend:** Express + TypeScript (`apps/api`) → Render
- **Database:** MongoDB Atlas
- **AI:** OpenAI API (optional; regex fallback when unset)

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
OPENAI_API_KEY=sk-...   # optional
CORS_ORIGIN=http://localhost:5173
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
2. Create database user and allow network access.
3. Copy connection string to `MONGODB_URI`.

### Render (API)

1. Connect this repo to Render.
2. Use `render.yaml` or create a Web Service with:
   - Root directory: `apps/api`
   - Build: `cd ../.. && npm run build:api`
   - Start: `npm start`
3. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CORS_ORIGIN`.

### Vercel (Web)

1. Import repo, set root directory to `apps/web`.
2. Set `VITE_API_URL` to your Render API URL.
3. Deploy.

## Usage

1. Register / login as faculty.
2. **Step 1:** Paste syllabus text and parse.
3. **Step 2:** Enter AY, class, semester, division, and lecture dates/times/rooms.
4. **Step 3:** Choose all units, first N units, or manual selection.
5. **Generate** → preview/edit table → **Download DOCX**.

Sample files are in `docs/` for reference.
