# Book Store (MERN)

## Run Locally

### Backend
1. Open a terminal in `backend`.
2. Install dependencies:
	`npm install`
3. Copy `.env.example` to `.env` and set values.
4. Start in development mode:
	`npm run dev`

### Frontend
1. Open a terminal in `frontend`.
2. Install dependencies:
	`npm install`
3. Copy `.env.example` to `.env.local` and set Firebase values.
4. Start the app:
	`npm run dev`

## Notes
- Frontend calls backend using `VITE_API_BASE_URL` (defaults to `http://localhost:8001`).
- Backend supports `MONGODB_URI` or legacy `DB_URL`.
- Backend supports `JWT_SECRET_KEY` or `JWT_SECRET`.

## Deploy on Vercel

Deploy the `backend` and `frontend` folders as two separate Vercel projects.

### Backend project
- Root Directory: `backend`
- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `npm install`
- Environment Variables:
  - `MONGODB_URI`
  - `JWT_SECRET_KEY`
  - `OPENAI_API_KEY` (optional, required for AI SEO/chat)
  - `CORS_ORIGINS=https://your-frontend-domain.vercel.app`

After deployment, test:
`https://your-backend-domain.vercel.app/`

### Frontend project
- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL=https://your-backend-domain.vercel.app`
  - Firebase `VITE_*` variables from `frontend/.env.example`

After both deployments, update backend `CORS_ORIGINS` with the final frontend URL and redeploy the backend.
