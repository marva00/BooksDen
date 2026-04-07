require("dotenv").config();
const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/env");
const { enrichBookRecord } = require("../src/books/book.enrichment");

const FIELDS_TO_COMPARE = [
  "title",
  "name",
  "description",
  "category",
  "author",
  "brand",
  "rating",
  "stock",
];

const hasValueChanged = (currentValue, nextValue) => {
  if (typeof currentValue === "number" || typeof nextValue === "number") {
    return Number(currentValue) !== Number(nextValue);
  }
  return String(currentValue ?? "") !== String(nextValue ?? "");
};

const run = async () => {
  const dryRun = process.argv.includes("--dry-run");

  await mongoose.connect(mongoUri);

  const collection = mongoose.connection.db.collection("books");
  const books = await collection
    .find({}, {
      projection: {
        title: 1,
        name: 1,
        description: 1,
        category: 1,
        author: 1,
        brand: 1,
        rating: 1,
        stock: 1,
        trending: 1,
        seo: 1,
      },
    })
    .toArray();

  if (!books.length) {
    console.log("No books found.");
    await mongoose.disconnect();
    return;
  }

  const updates = [];
  const sampleChanges = [];

  for (const book of books) {
    const enriched = enrichBookRecord(book, { forceDescription: true });
    const setPayload = {};

    for (const field of FIELDS_TO_COMPARE) {
      if (hasValueChanged(book[field], enriched[field])) {
        setPayload[field] = enriched[field];
      }
    }

    const currentSeo = book?.seo || {};
    const nextSeo = enriched?.seo || {};
    if (JSON.stringify(currentSeo) !== JSON.stringify(nextSeo)) {
      setPayload.seo = nextSeo;
    }

    if (Object.keys(setPayload).length === 0) {
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: book._id },
        update: {
          $set: setPayload,
          $currentDate: { updatedAt: true },
        },
      },
    });

    if (sampleChanges.length < 12) {
      sampleChanges.push({
        title: enriched.title,
        updatedFields: Object.keys(setPayload),
      });
    }
  }

  console.log(`Books scanned: ${books.length}`);
  console.log(`Books requiring enrichment: ${updates.length}`);
  console.log("Sample changes:");
  console.log(sampleChanges);

  if (!dryRun && updates.length > 0) {
    const result = await collection.bulkWrite(updates, { ordered: false });
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
  } else if (dryRun) {
    console.log("Dry run mode enabled. No database writes performed.");
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Failed to enrich inventory:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect error
  }
  process.exit(1);
});
