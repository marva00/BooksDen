require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || process.env.DB_URL || "mongodb://127.0.0.1:27017/book-store";

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const forceHttps = (url = "") => (url ? url.toString().replace(/^http:\/\//i, "https://").trim() : "");

const curatedNews = [
  {
    title: "Global Climate Summit Calls for Urgent Action",
    description:
      "World leaders gather at the Global Climate Summit to discuss urgent strategies to combat climate change, focusing on reducing carbon emissions and renewable energy adoption.",
    category: "climate",
    sourceUrl: "https://www.un.org/en/climatechange",
    image:
      "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=1600",
    publishedAt: new Date("2026-04-01T10:00:00.000Z"),
  },
  {
    title: "Breakthrough in AI Technology Announced",
    description:
      "Researchers announced a major breakthrough in artificial intelligence, with progress expected to influence healthcare, education, and financial systems.",
    category: "technology",
    sourceUrl: "https://openai.com/news",
    image:
      "https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=1600",
    publishedAt: new Date("2026-04-02T10:00:00.000Z"),
  },
  {
    title: "New Space Mission Aims to Explore Distant Galaxies",
    description:
      "A newly announced mission is set to explore distant galaxies, helping scientists gather deeper insights into the formation and evolution of the universe.",
    category: "space",
    sourceUrl: "https://www.nasa.gov/missions/",
    image:
      "https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg?auto=compress&cs=tinysrgb&w=1600",
    publishedAt: new Date("2026-04-03T10:00:00.000Z"),
  },
  {
    title: "Stock Markets Reach Record Highs Amid Economic Recovery",
    description:
      "Major stock indexes reached record highs as investor confidence grew around global economic recovery and improved business performance.",
    category: "finance",
    sourceUrl: "https://www.bloomberg.com/markets",
    image:
      "https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=1600",
    publishedAt: new Date("2026-04-04T10:00:00.000Z"),
  },
  {
    title: "Innovative New Smartphone Released by Leading Tech Company",
    description:
      "A leading tech company released its newest smartphone featuring stronger battery life, refined camera performance, and AI-powered tools.",
    category: "gadgets",
    sourceUrl: "https://www.theverge.com/tech",
    image:
      "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=1600",
    publishedAt: new Date("2026-04-05T10:00:00.000Z"),
  },
];

const run = async () => {
  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.db.collection("news");

  const operations = curatedNews.map((item) => {
    const slug = slugify(item.title);
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            title: item.title,
            slug,
            description: item.description,
            category: item.category,
            sourceUrl: forceHttps(item.sourceUrl),
            image: forceHttps(item.image),
            publishedAt: item.publishedAt,
            isFeatured: true,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
          $currentDate: {
            updatedAt: true,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await collection.bulkWrite(operations, { ordered: false });

  // Fix existing records with missing/invalid image links.
  const existing = await collection
    .find({}, { projection: { _id: 1, title: 1, image: 1, category: 1 } })
    .toArray();

  const fallbackUpdates = [];
  for (const item of existing) {
    const image = (item?.image || "").toString().trim();
    const isMissing = !image || image === "book-1.png" || image.startsWith("data:");
    if (!isMissing) continue;

    const query = encodeURIComponent(`${item.title || item.category || "news"},editorial`);
    const fallbackImage = `https://source.unsplash.com/1600x900/?${query}`;

    fallbackUpdates.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: { image: fallbackImage },
          $currentDate: { updatedAt: true },
        },
      },
    });
  }

  if (fallbackUpdates.length > 0) {
    await collection.bulkWrite(fallbackUpdates, { ordered: false });
  }

  console.log(`Seeded/updated curated news items: ${operations.length}`);
  console.log(`Mongo matched: ${result.matchedCount}`);
  console.log(`Mongo modified: ${result.modifiedCount}`);
  console.log(`Mongo upserted: ${result.upsertedCount}`);
  console.log(`Fallback image updates: ${fallbackUpdates.length}`);

  const total = await collection.countDocuments();
  console.log(`Total news records in DB: ${total}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Failed to seed/update news:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
