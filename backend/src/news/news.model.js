const mongoose = require("mongoose");

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const forceHttps = (value = "") => value.toString().replace(/^http:\/\//i, "https://").trim();

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      default: "https://images.pexels.com/photos/261909/pexels-photo-261909.jpeg",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "industry",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

newsSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || !this.slug.trim())) {
    this.slug = slugify(this.title) || "news-item";
  }

  if (this.image) {
    this.image = forceHttps(this.image);
  }

  if (this.sourceUrl) {
    this.sourceUrl = forceHttps(this.sourceUrl);
  }

  next();
});

const News = mongoose.model("News", newsSchema, "news");

module.exports = News;
