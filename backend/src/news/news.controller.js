const News = require("./news.model");

const toClientNews = (doc) => {
  const raw = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  if (!raw) return raw;

  return {
    ...raw,
    title: raw?.title || "Untitled Article",
    description: raw?.description || "",
    image: raw?.image || "",
    category: raw?.category || "industry",
    sourceUrl: raw?.sourceUrl || "",
    publishedAt: raw?.publishedAt || raw?.createdAt,
    isFeatured: !!raw?.isFeatured,
  };
};

const getAllNews = async (req, res) => {
  try {
    const limitParam = Number(req.query?.limit);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;

    const records = await News.find({})
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json(records.map((item) => toClientNews(item)));
  } catch (error) {
    console.error("Failed to fetch news", error);
    return res.status(500).json({ message: "Failed to fetch news" });
  }
};

module.exports = {
  getAllNews,
};
