const express = require("express");
const app = express();
const cors = require("cors");

const mongoose = require("mongoose");
require("dotenv").config();
const { corsOrigins, mongoUri, port } = require("./src/config/env");

// Return fresh JSON payloads for API calls to avoid 304/empty-body issues with client caches.
app.set("etag", false);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);
};

// middleware
// Allow larger payloads (e.g., base64 cover images from dashboard uploads).
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require("./src/orders/order.route")
const userRoutes =  require("./src/users/user.route")
const adminRoutes = require("./src/stats/admin.stats")
const aiRoutes = require("./src/ai/ai.route")
const newsRoutes = require("./src/news/news.route")

app.use("/api/books", bookRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/auth", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/news", newsRoutes)

app.get("/", (req, res) => {
  res.send("Book Store Server is running!");
});

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Mongodb connected successfully!");
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

startServer();
