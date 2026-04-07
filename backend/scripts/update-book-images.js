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
    .find({}, { projection: { title: 1, name: 1, coverImage: 1, images: 1 } })
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
      finalCover = existing;
      fallbackExisting += existing ? 1 : 0;
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
