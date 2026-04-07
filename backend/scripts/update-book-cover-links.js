require("dotenv").config();
const mongoose = require("mongoose");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "book";

const forceHttps = (url = "") => {
  if (!url) return "";
  return url.replace(/^http:\/\//i, "https://");
};

const pickGoogleImage = (volumeInfo = {}) => {
  const links = volumeInfo.imageLinks || {};
  return (
    links.extraLarge ||
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    links.smallThumbnail ||
    ""
  );
};

const getGoogleBooksCover = async (title) => {
  const query = encodeURIComponent(`intitle:${title}`);
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&printType=books&maxResults=10&langRestrict=en`
  );

  if (!response.ok) return "";
  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length) return "";

  const normalizedTitle = normalize(title);
  const scored = items
    .map((item) => {
      const info = item?.volumeInfo || {};
      const candidateTitle = normalize(info.title || "");
      const image = pickGoogleImage(info);
      if (!image) return null;

      let score = 0;
      if (candidateTitle === normalizedTitle) score += 100;
      if (candidateTitle.includes(normalizedTitle) || normalizedTitle.includes(candidateTitle)) score += 40;
      if (info.printType === "BOOK") score += 10;

      return {
        score,
        image: forceHttps(image),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.image || "";
};

const getOpenLibraryCover = async (title) => {
  const query = encodeURIComponent(title);
  const response = await fetch(`https://openlibrary.org/search.json?title=${query}&limit=5`);
  if (!response.ok) return "";
  const data = await response.json();
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  if (!docs.length) return "";

  const normalizedTitle = normalize(title);
  const best = docs
    .map((doc) => {
      const candidateTitle = normalize(doc?.title || "");
      const coverId = doc?.cover_i;
      if (!coverId) return null;

      let score = 0;
      if (candidateTitle === normalizedTitle) score += 100;
      if (candidateTitle.includes(normalizedTitle) || normalizedTitle.includes(candidateTitle)) score += 40;

      return {
        score,
        image: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return best[0]?.image || "";
};

const buildFallbackCover = (title) => `https://picsum.photos/seed/${slugify(title)}/600/900`;

const resolveCover = async (title) => {
  const fromGoogle = await getGoogleBooksCover(title);
  if (fromGoogle) return { url: fromGoogle, source: "google-books" };

  const fromOpenLibrary = await getOpenLibraryCover(title);
  if (fromOpenLibrary) return { url: fromOpenLibrary, source: "open-library" };

  return { url: buildFallbackCover(title), source: "picsum-fallback" };
};

(async () => {
  const uri = process.env.MONGODB_URI || process.env.DB_URL;
  if (!uri) {
    console.error("Missing MONGODB_URI/DB_URL in environment");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const books = await db.collection("books").find({}).toArray();
  console.log(`Found ${books.length} books`);

  let updated = 0;
  let googleCount = 0;
  let openLibraryCount = 0;
  let fallbackCount = 0;

  for (const [index, book] of books.entries()) {
    const title = (book?.title || book?.name || "Untitled Book").toString().trim();

    try {
      const { url, source } = await resolveCover(title);

      await db.collection("books").updateOne(
        { _id: book._id },
        {
          $set: {
            coverImage: url,
            images: [url],
            title,
            name: title,
          },
        }
      );

      if (source === "google-books") googleCount += 1;
      if (source === "open-library") openLibraryCount += 1;
      if (source === "picsum-fallback") fallbackCount += 1;

      updated += 1;
      console.log(`[${index + 1}/${books.length}] Updated: ${title} -> ${url} (${source})`);
    } catch (error) {
      console.error(`[${index + 1}/${books.length}] Failed: ${title}`, error?.message || error);
    }

    // Small delay to avoid hammering public APIs.
    await wait(120);
  }

  console.log("--- Summary ---");
  console.log(`Updated: ${updated}/${books.length}`);
  console.log(`Google Books: ${googleCount}`);
  console.log(`Open Library: ${openLibraryCount}`);
  console.log(`Fallback: ${fallbackCount}`);

  await mongoose.disconnect();
})().catch(async (error) => {
  console.error("Script failed", error);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
