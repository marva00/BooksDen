require("dotenv").config();
const mongoose = require("mongoose");

const DB_URI = process.env.MONGODB_URI || process.env.DB_URL;

if (!DB_URI) {
  console.error("Missing MONGODB_URI/DB_URL in environment.");
  process.exit(1);
}

const normalizeUrl = (url = "") => {
  if (!url || typeof url !== "string") return "";
  return url.replace(/^http:\/\//i, "https://").trim();
};

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "book";

const isWeakCover = (url = "") => {
  const normalized = normalizeUrl(url);
  if (!normalized) return true;
  if (/^book-\d+\.png$/i.test(normalized)) return true;
  if (normalized.startsWith("data:")) return true;
  if (normalized.includes("picsum.photos")) return true;
  if (normalized.includes("source.unsplash.com")) return true;
  return false;
};

const FALLBACK_POOLS = {
  business: [
    "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  technology: [
    "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  fiction: [
    "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  horror: [
    "https://images.pexels.com/photos/374716/pexels-photo-374716.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  adventure: [
    "https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  default: [
    "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
};

const normalizeCategory = (category = "") => {
  const value = slugify(category).replace(/-/g, " ");
  if (value.includes("tech")) return "technology";
  if (value.includes("business")) return "business";
  if (value.includes("horror")) return "horror";
  if (value.includes("adventure")) return "adventure";
  if (value.includes("fiction") || value.includes("mystery") || value.includes("romance")) return "fiction";
  return "default";
};

const stableHash = (value = "") => {
  let hash = 0;
  const input = value.toString();
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickInternetFallbackCover = (title, category) => {
  const categoryKey = normalizeCategory(category);
  const pool = FALLBACK_POOLS[categoryKey] || FALLBACK_POOLS.default;
  const selectedIndex = stableHash(`${title}-${categoryKey}`) % pool.length;
  return pool[selectedIndex];
};

const fetchGoogleBooksCover = async (title) => {
  const query = encodeURIComponent(`intitle:${title}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3&printType=books`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "book-store-image-updater/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) return "";

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  for (const item of items) {
    const links = item?.volumeInfo?.imageLinks || {};
    const candidate = links.thumbnail || links.smallThumbnail || links.small || links.medium || links.large || "";
    const normalized = normalizeUrl(candidate);
    if (normalized) return normalized;
  }

  return "";
};

const fetchOpenLibraryCover = async (title) => {
  const query = encodeURIComponent(title);
  const url = `https://openlibrary.org/search.json?title=${query}&limit=5`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "book-store-image-updater/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) return "";

  const data = await response.json();
  const docs = Array.isArray(data?.docs) ? data.docs : [];

  for (const doc of docs) {
    if (doc?.cover_i) {
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
  }

  return "";
};

const pickCoverForTitle = async (title) => {
  let cover = "";
  let source = "none";

  try {
    cover = await fetchGoogleBooksCover(title);
    if (cover) source = "google";
  } catch {
    // Try fallback below.
  }

  if (!cover) {
    try {
      cover = await fetchOpenLibraryCover(title);
      if (cover) source = "openlibrary";
    } catch {
      // Leave empty; caller handles fallback.
    }
  }

  return { cover: normalizeUrl(cover), source };
};

const run = async () => {
  await mongoose.connect(DB_URI);

  const collection = mongoose.connection.db.collection("books");
  const books = await collection
    .find({}, { projection: { title: 1, name: 1, category: 1, coverImage: 1, images: 1 } })
    .toArray();

  if (!books.length) {
    console.log("No books found.");
    await mongoose.disconnect();
    return;
  }

  const updates = [];
  let mapped = 0;
  let fallbackExisting = 0;

  for (const book of books) {
    const title = (book?.title || book?.name || "").toString().trim();
    if (!title) continue;

    const { cover, source } = await pickCoverForTitle(title);
    let finalCover = cover;

    if (!finalCover) {
      const existing = normalizeUrl(book?.coverImage || (Array.isArray(book?.images) ? book.images[0] : ""));
      if (existing && !isWeakCover(existing)) {
        finalCover = existing;
        fallbackExisting += 1;
      } else {
        finalCover = pickInternetFallbackCover(title, book?.category);
      }
    }

    if (!finalCover) continue;

    updates.push({
      updateOne: {
        filter: { _id: book._id },
        update: {
          $set: {
            coverImage: finalCover,
            images: [finalCover],
          },
        },
      },
    });

    mapped += source === "google" || source === "openlibrary" ? 1 : 0;
    console.log(`Updated: ${title} -> ${finalCover}`);
  }

  if (updates.length) {
    const result = await collection.bulkWrite(updates, { ordered: false });
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
  }

  console.log(`Total books scanned: ${books.length}`);
  console.log(`Updated records: ${updates.length}`);
  console.log(`Mapped by lookup (Google/OpenLibrary): ${mapped}`);
  console.log(`Fallback to existing URL: ${fallbackExisting}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Failed to update book images:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
