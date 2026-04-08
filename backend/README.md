# book-app-backend

## Setup
1. Install dependencies:
	`npm install`
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` and `JWT_SECRET_KEY`.

## Run
- Development: `npm run dev`
- Legacy dev alias: `npm run start:dev`
- Production-like: `npm start`

## Data Maintenance
- Seed and update news records with online image links: `npm run news:seed`
- Refresh inventory cover images from online sources: `npm run inventory:update-images`
