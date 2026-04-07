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
