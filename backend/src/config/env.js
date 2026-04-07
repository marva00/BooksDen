const crypto = require("crypto");

const parseCsv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "https://book-app-frontend-tau.vercel.app",
];

const configuredCorsOrigins = parseCsv(process.env.CORS_ORIGINS || "");
const corsOrigins = configuredCorsOrigins.length > 0 ? configuredCorsOrigins : defaultCorsOrigins;

const jwtSecret =
  process.env.JWT_SECRET_KEY ||
  process.env.JWT_SECRET ||
  crypto.randomBytes(64).toString("hex");

if (!process.env.JWT_SECRET_KEY && !process.env.JWT_SECRET) {
  console.warn(
    "[Config] JWT secret is not set in env. Using an in-memory development secret; existing tokens will stop working after restart."
  );
}

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.DB_URL ||
  "mongodb://127.0.0.1:27017/book-store";

if (!process.env.MONGODB_URI && !process.env.DB_URL) {
  console.warn(
    "[Config] MongoDB connection string not set in env. Falling back to mongodb://127.0.0.1:27017/book-store"
  );
}

const port = Number(process.env.PORT) || 8001;

module.exports = {
  corsOrigins,
  jwtSecret,
  mongoUri,
  port,
};
