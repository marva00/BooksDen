const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Book = require("../books/book.model");
const Order = require("../orders/order.model");
const { optionalUserToken } = require("../middleware/verifyUserToken");

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_SEARCH_RESULTS = 8;
const MAX_SUGGESTIONS = 10;
const DEFAULT_RECOMMENDATION_LIMIT = 6;
const COUPON_RULES = {
  SAVE10: 10,
  WELCOME15: 15,
  BOOK20: 20,
};

let catalogCache = {
  expiresAt: 0,
  categories: [],
  brands: [],
};

const SYSTEM_PROMPT = `You are a Smart E-Commerce Assistant.
Use tools to answer product and order questions accurately.
If user is idle or asks for suggestions, recommend trending products.
Before adding to cart, always ask for confirmation and then emit addToCart tool call after confirmation.
For product discovery, support natural language filters for price, category, rating, and brand.
For cart assistance, support add/remove actions, coupon application, and abandoned-cart reminders.
For order tracking, always fetch live status with the getOrderItem tool instead of guessing.
For FAQs, answer shipping info, return policy, and payment methods clearly.
When users ask for recommendations, combine behavior signals, purchase history, trending products, and customers-also-bought style logic.
Keep responses concise and friendly.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Search books by keyword with optional category, price, rating, and brand filters.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" },
          brand: { type: "string" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          minRating: { type: "number" },
          maxRating: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderItem",
      description: "Get user's order status using authenticated user identity.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Prepare add-to-cart intent for a product (requires confirmation).",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number" },
          productIndex: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "removeFromCart",
      description: "Remove a product from the user's current cart context.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          productIndex: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "applyCoupon",
      description: "Apply a coupon code to the current cart. Use valid codes only.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string" },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getShippingFAQ",
      description: "Return FAQ response text for shipping info, return policy, and payment methods.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
        },
        required: ["question"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTrendingProducts",
      description: "Get trending products sorted by rating then recency.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecommendations",
      description: "Get product recommendations using behavior, purchase history, trending products, and customers-also-bought signals.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
  },
];

const FAQ_PATH = path.join(__dirname, "faq.json");
const FAQ_ENTRIES = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
const DEFAULT_FAQ_REPLY =
  "You can ask about shipping info, return policy, or payment methods, and I will help right away.";

const isFaqIntent = (text = "") =>
  /shipping|delivery|arrival|shipping time|fee|cost|charge|return|refund|exchange|policy|payment|payments|how to pay|card|debit|credit|cod|cash on delivery|upi|wallet|bank transfer/i.test(
    (text || "").toLowerCase()
  );

const getFaqAnswer = (question = "") => {
  const normalizedQuestion = (question || "").toLowerCase();
  const found = FAQ_ENTRIES.find(
    (entry) =>
      Array.isArray(entry?.keywords) &&
      entry.keywords.some((keyword) =>
        normalizedQuestion.includes(String(keyword || "").toLowerCase())
      )
  );

  return found?.answer || DEFAULT_FAQ_REPLY;
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickFiniteNumber = (...values) => {
  for (const value of values) {
    const parsed = toFiniteNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const cleanText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s&'\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getBookTitle = (book) => book?.title || book?.name || "Untitled Book";

const getBookPrice = (book) => {
  const price = Number(book?.newPrice ?? book?.price);
  return Number.isFinite(price) ? price : 0;
};

const getBookBrand = (book) => {
  const directBrand = typeof book?.brand === "string" ? book.brand.trim() : "";
  if (directBrand) return directBrand;
  const authorBrand = typeof book?.author === "string" ? book.author.trim() : "";
  if (authorBrand) return authorBrand;
  return "generic";
};

const getBookCover = (book) => {
  if (typeof book?.coverImage === "string" && book.coverImage.trim()) return book.coverImage;
  if (Array.isArray(book?.images) && book.images.length > 0) return book.images[0];
  return "book-1.png";
};

const mapBookCard = (book) => ({
  id: book._id,
  title: getBookTitle(book),
  price: getBookPrice(book),
  slug: book.slug,
  coverImage: getBookCover(book),
  category: book.category,
  brand: getBookBrand(book),
  rating: typeof book.rating === "number" ? book.rating : 0,
});

const addAndCondition = (query, condition) => {
  query.$and = query.$and || [];
  query.$and.push(condition);
};

const applyCategoryFilter = (query, category) => {
  if (typeof category !== "string" || !category.trim()) return;
  query.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
};

const applyBrandFilter = (query, brand) => {
  if (typeof brand !== "string" || !brand.trim()) return;
  const safeBrand = escapeRegex(brand.trim());
  addAndCondition(query, {
    $or: [
      { brand: { $regex: safeBrand, $options: "i" } },
      { author: { $regex: safeBrand, $options: "i" } },
    ],
  });
};

const applyPriceFilter = (query, minPrice, maxPrice) => {
  const hasMin = typeof minPrice === "number";
  const hasMax = typeof maxPrice === "number";
  if (!hasMin && !hasMax) return;

  const range = {};
  if (hasMin) range.$gte = minPrice;
  if (hasMax) range.$lte = maxPrice;

  addAndCondition(query, { $or: [{ newPrice: range }, { price: range }] });
};

const applyRatingFilter = (query, minRating, maxRating) => {
  const hasMin = typeof minRating === "number";
  const hasMax = typeof maxRating === "number";
  if (!hasMin && !hasMax) return;

  const range = {};
  if (hasMin) range.$gte = minRating;
  if (hasMax) range.$lte = maxRating;

  addAndCondition(query, { rating: range });
};

const applyKeywordSearch = (query, keyword) => {
  if (typeof keyword !== "string" || !keyword.trim()) return;
  const tokens = keyword
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((token) => escapeRegex(token));

  if (tokens.length === 0) return;

  const pattern = tokens.join(".*");
  addAndCondition(query, {
    $or: [
      { title: { $regex: pattern, $options: "i" } },
      { name: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { category: { $regex: pattern, $options: "i" } },
      { brand: { $regex: pattern, $options: "i" } },
      { author: { $regex: pattern, $options: "i" } },
      { "seo.metaTitle": { $regex: pattern, $options: "i" } },
      { "seo.metaDescription": { $regex: pattern, $options: "i" } },
      { "seo.keywords": { $regex: pattern, $options: "i" } },
    ],
  });
};

const normalizeSearchText = (text = "") =>
  text
    .toString()
    .replace(/\$?\d+(?:\.\d+)?/g, " ")
    .replace(/\b(show|find|search|looking|look|for|me|please|products?|items?|books?|under|below|above|over|less|more|than|max|min|between|and|rated|rating|stars?|brand|category|from|by|with)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSearchQuery = ({
  query,
  category,
  brand,
  minPrice,
  maxPrice,
  minRating,
  maxRating,
} = {}) => {
  const mongoQuery = {};
  applyCategoryFilter(mongoQuery, category);
  applyBrandFilter(mongoQuery, brand);
  applyPriceFilter(mongoQuery, minPrice, maxPrice);
  applyRatingFilter(mongoQuery, minRating, maxRating);
  applyKeywordSearch(mongoQuery, query);

  if (Array.isArray(mongoQuery.$and) && mongoQuery.$and.length === 0) {
    delete mongoQuery.$and;
  }

  return mongoQuery;
};

const searchBooks = async (filters = {}, limit = MAX_SEARCH_RESULTS) => {
  const query = buildSearchQuery(filters);
  const books = await Book.find(query)
    .sort({ trending: -1, rating: -1, createdAt: -1 })
    .limit(Math.max(1, Math.min(MAX_SEARCH_RESULTS, Number(limit) || MAX_SEARCH_RESULTS)));
  return books.map(mapBookCard);
};

const detectFacetFromCatalog = (text, facets = []) => {
  if (!text || !Array.isArray(facets) || facets.length === 0) return "";
  const normalizedText = cleanText(text);
  const candidates = facets
    .filter((facet) => typeof facet === "string" && facet.trim())
    .map((facet) => ({ raw: facet.trim(), normalized: cleanText(facet) }))
    .filter((facet) => facet.normalized)
    .sort((a, b) => b.normalized.length - a.normalized.length);

  const match = candidates.find(({ normalized }) => {
    const pattern = new RegExp(`\\b${escapeRegex(normalized)}\\b`, "i");
    return pattern.test(normalizedText);
  });

  return match?.raw || "";
};

const getCatalogFacets = async () => {
  const now = Date.now();
  if (catalogCache.expiresAt > now) {
    return {
      categories: catalogCache.categories,
      brands: catalogCache.brands,
    };
  }

  const [rawCategories, rawBrands, rawAuthors] = await Promise.all([
    Book.distinct("category"),
    Book.distinct("brand"),
    Book.distinct("author"),
  ]);

  const categories = rawCategories.filter((item) => typeof item === "string" && item.trim());
  const brands = [...rawBrands, ...rawAuthors]
    .filter((item) => typeof item === "string" && item.trim())
    .filter((item, index, array) => array.findIndex((candidate) => cleanText(candidate) === cleanText(item)) === index);

  catalogCache = {
    categories,
    brands,
    expiresAt: now + CATALOG_CACHE_TTL_MS,
  };

  return {
    categories,
    brands,
  };
};

const parseToolArgs = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const buildOrderTimeline = (status = "pending") => {
  const flow = ["pending", "processing", "shipped", "delivered"];
  const index = flow.indexOf((status || "pending").toLowerCase());
  return flow.map((step, i) => ({
    step: step[0].toUpperCase() + step.slice(1),
    done: i <= (index >= 0 ? index : 0),
    current: i === (index >= 0 ? index : 0),
  }));
};

const parsePriceBounds = (text) => {
  const normalized = text || "";
  const matches = normalized.match(/\d+(?:\.\d+)?/g) || [];
  const nums = matches.map(Number).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return {};
  if (/(under|below|max|less than|at most|up to)/i.test(normalized)) return { maxPrice: nums[0] };
  if (/(above|over|min|more than|at least|and above|\+)/i.test(normalized)) return { minPrice: nums[0] };
  if (nums.length >= 2) {
    return {
      minPrice: Math.min(nums[0], nums[1]),
      maxPrice: Math.max(nums[0], nums[1]),
    };
  }
  return {};
};

const parseRatingBounds = (text) => {
  const normalized = text || "";
  if (!/(star|stars|rating)/i.test(normalized)) return {};

  const matches = normalized.match(/\d(?:\.\d+)?/g) || [];
  const nums = matches
    .map(Number)
    .filter((num) => Number.isFinite(num))
    .map((num) => Math.max(0, Math.min(5, num)));

  if (nums.length === 0) return {};
  if (/(under|below|max|at most|up to)/i.test(normalized)) return { maxRating: nums[0] };
  if (/(above|over|min|at least|and above|\+)/i.test(normalized)) return { minRating: nums[0] };
  if (nums.length >= 2) {
    return {
      minRating: Math.min(nums[0], nums[1]),
      maxRating: Math.max(nums[0], nums[1]),
    };
  }

  return { minRating: nums[0] };
};

const parseBrandFromText = (text) => {
  if (!text) return "";

  const patterns = [
    /brand\s+([a-z0-9][a-z0-9\s&'\-]{1,40})/i,
    /from\s+([a-z0-9][a-z0-9\s&'\-]{1,40})/i,
    /by\s+([a-z0-9][a-z0-9\s&'\-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const cleaned = match[1]
      .replace(/\b(books?|products?|items?)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned) return cleaned;
  }

  return "";
};

const extractNaturalLanguageSearch = async (text) => {
  const { categories, brands } = await getCatalogFacets();
  const category = detectFacetFromCatalog(text, categories);
  const brandFromCatalog = detectFacetFromCatalog(text, brands);
  const brandFromPhrase = parseBrandFromText(text);
  const { minPrice, maxPrice } = parsePriceBounds(text);
  const { minRating, maxRating } = parseRatingBounds(text);

  return {
    category,
    brand: brandFromCatalog || brandFromPhrase,
    minPrice,
    maxPrice,
    minRating,
    maxRating,
  };
};

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString().trim();
  }
  return "";
};

const uniqueIdList = (values = [], max = 40) => {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const id = toIdString(value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(id);
    if (output.length >= max) break;
  }
  return output;
};

const parseBehaviorContext = (raw = {}) => ({
  viewedProductIds: uniqueIdList(Array.isArray(raw?.viewedProductIds) ? raw.viewedProductIds : [], 20),
  clickedProductIds: uniqueIdList(Array.isArray(raw?.clickedProductIds) ? raw.clickedProductIds : [], 20),
});

const normalizeCartContext = (raw = {}) => {
  const items = Array.isArray(raw?.items)
    ? raw.items
        .map((item) => ({
          id: toIdString(item?.id || item?._id || item?.productId),
          title: typeof item?.title === "string" ? item.title.trim() : "",
          quantity: Math.max(1, Number(item?.quantity) || 1),
          price: Number(item?.price) || 0,
        }))
        .filter((item) => item.id)
    : [];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const couponCode = typeof raw?.appliedCoupon?.code === "string"
    ? raw.appliedCoupon.code.trim().toUpperCase()
    : "";
  const couponPercent = Number(raw?.appliedCoupon?.percent);
  const appliedCoupon = couponCode && Number.isFinite(couponPercent) && couponPercent > 0
    ? { code: couponCode, percent: Math.min(100, Math.max(1, couponPercent)) }
    : null;

  return {
    items,
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    appliedCoupon,
  };
};

const isAddToCartIntent = (text = "") => /add .*cart|add the first|add first/i.test((text || "").toLowerCase());
const isRemoveFromCartIntent = (text = "") => /remove .*cart|remove from cart|delete from cart|take .*out .*cart/i.test((text || "").toLowerCase());
const isApplyCouponIntent = (text = "") => /(apply|use).*(coupon|promo|discount)|coupon code|promo code/i.test((text || "").toLowerCase());
const isClearCouponIntent = (text = "") => /(remove|clear).*(coupon|promo|discount)/i.test((text || "").toLowerCase());

const extractCouponCodeFromText = (text = "") => {
  const byKeyword = (text.match(/(?:coupon|promo|discount)\s*(?:code)?\s*[:\-]?\s*([a-z0-9]{4,20})/i) || [])[1];
  if (byKeyword) return byKeyword.toUpperCase();

  const byApplyPhrase = (text.match(/(?:apply|use)\s+([a-z0-9]{4,20})/i) || [])[1];
  if (byApplyPhrase) return byApplyPhrase.toUpperCase();

  return "";
};

const findCartItemForRemoval = (latestUserText = "", cartContext = { items: [] }) => {
  const items = Array.isArray(cartContext.items) ? cartContext.items : [];
  if (items.length === 0) return null;

  const explicitId = extractOrderIdFromText(latestUserText);
  if (explicitId) {
    const byId = items.find((item) => item.id === explicitId);
    if (byId) return byId;
  }

  if (/remove first|remove 1st|remove item 1|remove product 1/i.test(latestUserText)) {
    return items[0];
  }

  const indexMatch = latestUserText.match(/(?:item|product)\s*(\d+)/i);
  if (indexMatch) {
    const index = Math.max(1, Number(indexMatch[1])) - 1;
    if (items[index]) return items[index];
  }

  const normalizedText = cleanText(latestUserText);
  const titleMatch = items.find((item) => normalizedText.includes(cleanText(item.title || "")));
  if (titleMatch) return titleMatch;

  return items[0];
};

const buildCouponActionResponse = (couponCode, cartContext) => {
  if (!couponCode) {
    return {
      reply: `Please share a coupon code. Available coupons: ${Object.keys(COUPON_RULES).join(", ")}.`,
      products: [],
      actions: [],
    };
  }

  const normalizedCode = couponCode.toUpperCase();
  const percent = COUPON_RULES[normalizedCode];
  if (!percent) {
    return {
      reply: `That coupon code is invalid. Try one of: ${Object.keys(COUPON_RULES).join(", ")}.`,
      products: [],
      actions: [],
    };
  }

  if (cartContext.itemsCount === 0) {
    return {
      reply: `Coupon ${normalizedCode} is valid (${percent}% off), but your cart is empty right now.`,
      products: [],
      actions: [],
    };
  }

  return {
    reply: `Coupon ${normalizedCode} applied. You get ${percent}% off your current cart total.`,
    products: [],
    actions: [{ type: "apply_coupon", payload: { code: normalizedCode, percent } }],
  };
};

const getOrderProductIds = (orderDoc) => {
  const directIds = Array.isArray(orderDoc?.productIds) ? orderDoc.productIds : [];
  const itemIds = Array.isArray(orderDoc?.items)
    ? orderDoc.items.map((item) => item?.productId)
    : [];
  return uniqueIdList([...directIds, ...itemIds], 60);
};

const listToSentence = (parts = []) => {
  const cleaned = parts.filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
};

const getUserPurchasedProductIds = async (userId) => {
  if (!userId) return [];
  const orders = await Order.find(
    { userId },
    { productIds: 1, items: 1, createdAt: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(30);

  const productIds = [];
  for (const order of orders) {
    productIds.push(...getOrderProductIds(order));
  }
  return uniqueIdList(productIds, 40);
};

const getCustomersAlsoBoughtScores = async (seedIds = []) => {
  const normalizedSeedIds = uniqueIdList(seedIds, 40);
  if (normalizedSeedIds.length === 0) return new Map();

  const seedSet = new Set(normalizedSeedIds);
  const relatedOrders = await Order.find(
    {
      $or: [
        { productIds: { $in: normalizedSeedIds } },
        { "items.productId": { $in: normalizedSeedIds } },
      ],
    },
    { productIds: 1, items: 1, createdAt: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(120);

  const scoreMap = new Map();

  for (const order of relatedOrders) {
    const ids = getOrderProductIds(order);
    const containsSeed = ids.some((id) => seedSet.has(id));
    if (!containsSeed) continue;

    for (const id of ids) {
      if (!id || seedSet.has(id)) continue;
      scoreMap.set(id, (scoreMap.get(id) || 0) + 1);
    }
  }

  return scoreMap;
};

const isRecommendationIntent = (text = "") =>
  /recommend|recommendation|you may like|similar|also bought|customers also bought|for you|personalized/i.test(text);

const isOrderTrackingIntent = (text = "") =>
  /where is my order|my order|order status|track|tracking/i.test((text || "").toLowerCase());

const extractOrderIdFromText = (text = "") => {
  const match = (text || "").match(/\b[a-f0-9]{24}\b/i);
  return match ? match[0] : "";
};

const buildOrderTrackingResponse = async ({ req, latestUserText = "" }) => {
  if (!req.user?.id) {
    return { reply: "Please login first so I can check your orders securely.", products: [], actions: [] };
  }

  const orderIdInText = extractOrderIdFromText(latestUserText);
  const orderQuery = orderIdInText && mongoose.Types.ObjectId.isValid(orderIdInText)
    ? { _id: orderIdInText, userId: req.user.id }
    : { userId: req.user.id };

  const order = await Order.findOne(orderQuery).sort({ createdAt: -1 });
  if (!order) {
    return {
      reply: orderIdInText
        ? "I could not find that order on your account."
        : "I could not find any orders on your account yet.",
      products: [],
      actions: [],
    };
  }

  const timeline = buildOrderTimeline(order.status);
  return {
    reply: `Order ${order._id} is currently ${order.status}.`,
    products: [],
    actions: [{ type: "order_timeline", payload: { orderId: order._id, timeline } }],
  };
};

const buildRecommendationResponse = async ({
  req,
  behaviorContext = {},
  lastShownProducts = [],
  limit = DEFAULT_RECOMMENDATION_LIMIT,
}) => {
  const safeLimit = Math.max(3, Math.min(MAX_SEARCH_RESULTS, Number(limit) || DEFAULT_RECOMMENDATION_LIMIT));
  const { viewedProductIds, clickedProductIds } = parseBehaviorContext(behaviorContext);
  const shownProductIds = uniqueIdList(
    Array.isArray(lastShownProducts) ? lastShownProducts.map((product) => product?.id) : [],
    10
  );

  const purchasedProductIds = await getUserPurchasedProductIds(req.user?.id);
  const seedProductIds = uniqueIdList(
    [...clickedProductIds, ...viewedProductIds, ...purchasedProductIds, ...shownProductIds],
    40
  );

  const seedBooks = seedProductIds.length
    ? await Book.find(
        { _id: { $in: seedProductIds } },
        { category: 1, brand: 1, author: 1 }
      )
    : [];

  const categorySet = new Set(
    seedBooks
      .map((book) => cleanText(book?.category || ""))
      .filter(Boolean)
  );
  const brandSet = new Set(
    seedBooks
      .map((book) => cleanText(book?.brand || book?.author || ""))
      .filter(Boolean)
  );

  const alsoBoughtScores = await getCustomersAlsoBoughtScores(
    seedProductIds.length > 0 ? seedProductIds : purchasedProductIds
  );
  const alsoBoughtIds = Array.from(alsoBoughtScores.keys());

  const candidateOr = [{ trending: true }];
  if (categorySet.size > 0) {
    candidateOr.push({
      category: {
        $in: Array.from(categorySet).map((category) => new RegExp(`^${escapeRegex(category)}$`, "i")),
      },
    });
  }
  if (brandSet.size > 0) {
    const brandRegexList = Array.from(brandSet).map((brand) => new RegExp(`^${escapeRegex(brand)}$`, "i"));
    candidateOr.push({ brand: { $in: brandRegexList } });
    candidateOr.push({ author: { $in: brandRegexList } });
  }
  if (alsoBoughtIds.length > 0) {
    candidateOr.push({ _id: { $in: alsoBoughtIds } });
  }

  const candidateBooks = await Book.find(
    {
      _id: { $nin: seedProductIds },
      $or: candidateOr,
    },
    {
      title: 1,
      name: 1,
      newPrice: 1,
      price: 1,
      slug: 1,
      coverImage: 1,
      images: 1,
      category: 1,
      brand: 1,
      author: 1,
      rating: 1,
      trending: 1,
      createdAt: 1,
    }
  )
    .sort({ trending: -1, rating: -1, createdAt: -1 })
    .limit(60);

  const scoredRecommendations = candidateBooks
    .map((book) => {
      const card = mapBookCard(book);
      const category = cleanText(card.category || "");
      const brand = cleanText(card.brand || "");
      const coPurchaseCount = alsoBoughtScores.get(toIdString(book._id)) || 0;

      let score = 0;
      const reasons = [];

      if (coPurchaseCount > 0) {
        score += coPurchaseCount * 4;
        reasons.push("Customers also bought this");
      }
      if (category && categorySet.has(category)) {
        score += 2;
        reasons.push("Matches categories you explored");
      }
      if (brand && brandSet.has(brand)) {
        score += 1.5;
        reasons.push("From authors/brands you interacted with");
      }
      if (book?.trending) {
        score += 1.2;
        reasons.push("Trending now");
      }
      score += Math.max(0, Number(card.rating) || 0) * 0.5;

      return {
        ...card,
        reason: reasons[0] || "Trending now",
        recommendationScore: score,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, safeLimit)
    .map(({ recommendationScore, ...rest }) => rest);

  const strategySignals = [
    clickedProductIds.length > 0 || viewedProductIds.length > 0
      ? "your recent views and clicks"
      : "",
    purchasedProductIds.length > 0 ? "your purchase history" : "",
    alsoBoughtScores.size > 0 ? "what similar customers also bought" : "",
    "trending products",
  ].filter(Boolean);

  return {
    reply: scoredRecommendations.length
      ? `Here are recommendations based on ${listToSentence(strategySignals)}.`
      : "I could not build personalized recommendations yet, so here are trending products.",
    products: scoredRecommendations,
    actions: [],
  };
};

const runFallbackAssistant = async ({
  latestUserText = "",
  idle = false,
  req,
  lastShownProducts = [],
  pendingCartAction = null,
  behaviorContext = {},
  cartContext = {},
}) => {
  const lower = latestUserText.toLowerCase();
  const normalizedCart = normalizeCartContext(cartContext);
  const wantsRecommendation = isRecommendationIntent(lower);
  const wantsTrending = idle || /suggest|trending|popular|top picks|whats hot|what's hot/i.test(lower);
  const wantsFaq = isFaqIntent(lower);
  const confirms = /^(yes|yep|sure|ok|okay|confirm|do it)$/i.test(lower.trim());
  const denies = /^(no|nope|cancel|stop)$/i.test(lower.trim());
  const wantsAddToCart = isAddToCartIntent(latestUserText);
  const wantsRemoveFromCart = isRemoveFromCartIntent(latestUserText);
  const wantsApplyCoupon = isApplyCouponIntent(latestUserText);
  const wantsClearCoupon = isClearCouponIntent(latestUserText);
  const wantsAbandonedCartReminder = idle && normalizedCart.itemsCount > 0;

  if (pendingCartAction && confirms) {
    return {
      reply: `${pendingCartAction.productTitle} will be added to your cart now.`,
      products: [],
      actions: [{ type: "add_to_cart", payload: pendingCartAction }],
    };
  }

  if (pendingCartAction && denies) {
    return {
      reply: "No problem, I did not add anything to your cart.",
      products: [],
      actions: [{ type: "clear_pending_cart" }],
    };
  }

  if (wantsAbandonedCartReminder) {
    const couponLine = normalizedCart.appliedCoupon
      ? ` Coupon ${normalizedCart.appliedCoupon.code} is already active (${normalizedCart.appliedCoupon.percent}% off).`
      : ` You can ask me to apply a coupon like ${Object.keys(COUPON_RULES)[0]}.`;

    return {
      reply: `You still have ${normalizedCart.itemsCount} item(s) in your cart (about Rs. ${normalizedCart.subtotal.toFixed(2)}). Ready to checkout?${couponLine}`,
      products: [],
      actions: [{ type: "abandoned_cart_reminder", payload: { itemsCount: normalizedCart.itemsCount } }],
    };
  }

  if (isOrderTrackingIntent(latestUserText)) {
    return buildOrderTrackingResponse({ req, latestUserText });
  }

  if (wantsApplyCoupon) {
    const couponCode = extractCouponCodeFromText(latestUserText);
    return buildCouponActionResponse(couponCode, normalizedCart);
  }

  if (wantsClearCoupon) {
    if (!normalizedCart.appliedCoupon) {
      return {
        reply: "No coupon is currently applied on your cart.",
        products: [],
        actions: [],
      };
    }

    return {
      reply: `Removed coupon ${normalizedCart.appliedCoupon.code} from your cart.`,
      products: [],
      actions: [{ type: "clear_coupon" }],
    };
  }

  if (wantsRemoveFromCart) {
    if (normalizedCart.items.length === 0) {
      return {
        reply: "Your cart is already empty.",
        products: [],
        actions: [],
      };
    }

    const itemToRemove = findCartItemForRemoval(latestUserText, normalizedCart);
    if (!itemToRemove) {
      return {
        reply: "I could not identify which item to remove from your cart.",
        products: [],
        actions: [],
      };
    }

    return {
      reply: `${itemToRemove.title || "That item"} was removed from your cart.`,
      products: [],
      actions: [
        {
          type: "remove_from_cart",
          payload: {
            productId: itemToRemove.id,
            productTitle: itemToRemove.title || "Item",
          },
        },
      ],
    };
  }

  if (wantsFaq) {
    return {
      reply: getFaqAnswer(latestUserText),
      products: [],
      actions: [],
    };
  }

  if (wantsRecommendation) {
    return buildRecommendationResponse({
      req,
      behaviorContext,
      lastShownProducts,
      limit: DEFAULT_RECOMMENDATION_LIMIT,
    });
  }

  if (wantsTrending) {
    const trending = await Book.find({ trending: true }).sort({ rating: -1, createdAt: -1 }).limit(4);
    const cards = trending.map(mapBookCard);
    return {
      reply: "Here are some trending products you might like.",
      products: cards,
      actions: [],
    };
  }

  if (wantsAddToCart && Array.isArray(lastShownProducts) && lastShownProducts.length > 0) {
    const first = lastShownProducts[0];
    return {
      reply: `Would you like me to add ${first.title} to your cart for Rs. ${first.price}?`,
      products: [],
      actions: [
        {
          type: "confirm_add_to_cart",
          payload: {
            productId: first.id,
            productTitle: first.title,
            price: first.price,
            quantity: 1,
          },
        },
      ],
    };
  }

  const structuredFilters = await extractNaturalLanguageSearch(latestUserText);
  const cleanedQuery = normalizeSearchText(latestUserText);
  const fallbackQuery =
    cleanedQuery || (typeof latestUserText === "string" ? latestUserText.trim() : "");

  const cards = await searchBooks(
    {
      query: fallbackQuery,
      ...structuredFilters,
    },
    6
  );

  return {
    reply: cards.length
      ? "I found these products based on your request."
      : "I could not find matching products. Try a category, price range, rating, or brand filter.",
    products: cards,
    actions: [],
  };
};

const createCompletion = async (messages) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      tools: TOOLS,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "OpenAI request failed");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message;
};

router.get("/suggestions", async (req, res) => {
  try {
    const rawQuery = typeof req.query?.q === "string" ? req.query.q.trim() : "";
    const limit = Math.max(3, Math.min(MAX_SUGGESTIONS, Number(req.query?.limit) || 8));

    if (!rawQuery) {
      return res.status(200).json({ suggestions: [] });
    }

    const safePattern = escapeRegex(rawQuery);
    const regex = new RegExp(safePattern, "i");

    const [products, categoryMatches, brandMatches, authorMatches] = await Promise.all([
      Book.find(
        {
          $or: [
            { title: { $regex: regex } },
            { name: { $regex: regex } },
            { description: { $regex: regex } },
            { brand: { $regex: regex } },
            { author: { $regex: regex } },
            { category: { $regex: regex } },
          ],
        },
        {
          _id: 1,
          title: 1,
          name: 1,
          slug: 1,
          category: 1,
          brand: 1,
          author: 1,
        }
      )
        .sort({ trending: -1, rating: -1, createdAt: -1 })
        .limit(limit),
      Book.distinct("category", { category: { $regex: safePattern, $options: "i" } }),
      Book.distinct("brand", { brand: { $regex: safePattern, $options: "i" } }),
      Book.distinct("author", { author: { $regex: safePattern, $options: "i" } }),
    ]);

    const unique = new Set();
    const suggestions = [];

    for (const product of products) {
      const title = getBookTitle(product);
      const key = `product:${title.toLowerCase()}`;
      if (unique.has(key)) continue;
      unique.add(key);
      suggestions.push({
        type: "product",
        label: title,
        value: title,
        slug: product.slug,
        productId: String(product._id),
      });
    }

    for (const category of categoryMatches) {
      if (typeof category !== "string" || !category.trim()) continue;
      const normalized = category.trim();
      const key = `category:${normalized.toLowerCase()}`;
      if (unique.has(key)) continue;
      unique.add(key);
      suggestions.push({
        type: "category",
        label: `Category: ${normalized}`,
        value: normalized,
      });
    }

    for (const brand of [...brandMatches, ...authorMatches]) {
      if (typeof brand !== "string" || !brand.trim()) continue;
      const normalized = brand.trim();
      const key = `brand:${normalized.toLowerCase()}`;
      if (unique.has(key)) continue;
      unique.add(key);
      suggestions.push({
        type: "brand",
        label: `Brand: ${normalized}`,
        value: normalized,
      });
    }

    return res.status(200).json({ suggestions: suggestions.slice(0, limit) });
  } catch (error) {
    console.error("AI suggestion route failed", error);
    return res.status(500).json({ message: "Failed to fetch AI suggestions." });
  }
});

router.post("/chat", optionalUserToken, async (req, res) => {
  const {
    messages = [],
    idle = false,
    lastShownProducts = [],
    pendingCartAction = null,
    behaviorContext = {},
    cartContext = {},
  } = req.body || {};
  const safeMessages = Array.isArray(messages) ? messages : [];

  try {
    const latestUserText = safeMessages
      .slice()
      .reverse()
      .find((m) => m?.role === "user")?.content || "";
    const normalizedCartContext = normalizeCartContext(cartContext);

    if (!OPENAI_API_KEY) {
      const fallback = await runFallbackAssistant({
        latestUserText,
        idle,
        req,
        lastShownProducts,
        pendingCartAction,
        behaviorContext,
        cartContext: normalizedCartContext,
      });
      return res.status(200).json(fallback);
    }

    const forceTrendingHint = idle
      ? "User is idle. Suggest trending products now."
      : "";

    const first = await createCompletion([
      ...safeMessages,
      ...(forceTrendingHint ? [{ role: "user", content: forceTrendingHint }] : []),
    ]);

    const toolCalls = first?.tool_calls || [];
    if (!toolCalls.length) {
      const maybeCartAssistanceRequest =
        isAddToCartIntent(latestUserText) ||
        isRemoveFromCartIntent(latestUserText) ||
        isApplyCouponIntent(latestUserText) ||
        isClearCouponIntent(latestUserText) ||
        (idle && normalizedCartContext.itemsCount > 0);

      if (maybeCartAssistanceRequest) {
        const cartAssist = await runFallbackAssistant({
          latestUserText,
          idle,
          req,
          lastShownProducts,
          pendingCartAction,
          behaviorContext,
          cartContext: normalizedCartContext,
        });
        return res.status(200).json(cartAssist);
      }

      const maybeOrderTrackingRequest = isOrderTrackingIntent(latestUserText || "");
      if (maybeOrderTrackingRequest) {
        const tracking = await buildOrderTrackingResponse({ req, latestUserText });
        return res.status(200).json(tracking);
      }

      const maybeRecommendationRequest = isRecommendationIntent(latestUserText || "");
      if (maybeRecommendationRequest) {
        const recommendations = await buildRecommendationResponse({
          req,
          behaviorContext,
          lastShownProducts,
          limit: DEFAULT_RECOMMENDATION_LIMIT,
        });
        return res.status(200).json({
          reply: first?.content || recommendations.reply,
          products: recommendations.products,
          actions: recommendations.actions,
        });
      }

      const maybeFaqRequest = isFaqIntent(latestUserText || "");
      if (maybeFaqRequest) {
        return res.status(200).json({
          reply: first?.content || getFaqAnswer(latestUserText),
          products: [],
          actions: [],
        });
      }

      const maybeSearchRequest = /show|find|search|under|below|above|over|rating|star|brand|category/i.test(latestUserText || "");
      if (maybeSearchRequest) {
        const parsedFilters = await extractNaturalLanguageSearch(latestUserText);
        const normalizedQuery = normalizeSearchText(latestUserText) || latestUserText;
        const cards = await searchBooks({ query: normalizedQuery, ...parsedFilters }, MAX_SEARCH_RESULTS);
        return res.status(200).json({
          reply: first?.content || (cards.length ? "Here are matching products." : "I could not find matching products."),
          products: cards,
          actions: [],
        });
      }

      return res.status(200).json({
        reply: first?.content || "How can I help?",
        products: [],
      });
    }

    const productCards = [];
    const toolMessages = [];
    const actions = [];
    let latestSearchCards = [];

    for (const call of toolCalls) {
      const name = call?.function?.name;
      const args = parseToolArgs(call?.function?.arguments);
      let result = { error: `Unknown tool: ${name}` };

      if (name === "searchProducts") {
        const fallbackSourceText =
          typeof args?.query === "string" && args.query.trim() ? args.query : latestUserText;
        const fallbackFilters = await extractNaturalLanguageSearch(fallbackSourceText);
        const normalizedQuery = normalizeSearchText(args?.query || "") || args?.query || "";

        const cards = await searchBooks({
          query: normalizedQuery,
          category: args?.category || fallbackFilters.category,
          brand: args?.brand || fallbackFilters.brand,
          minPrice: pickFiniteNumber(args?.minPrice, fallbackFilters.minPrice),
          maxPrice: pickFiniteNumber(args?.maxPrice, fallbackFilters.maxPrice),
          minRating: pickFiniteNumber(args?.minRating, fallbackFilters.minRating),
          maxRating: pickFiniteNumber(args?.maxRating, fallbackFilters.maxRating),
        });

        productCards.push(...cards);
        latestSearchCards = cards;
        result = { count: cards.length, products: cards };
      }

      if (name === "getOrderItem") {
        const effectiveUserId = req.user?.id;
        if (!effectiveUserId) {
          result = { error: "User is not logged in." };
        } else if (args?.orderId && !mongoose.Types.ObjectId.isValid(String(args.orderId))) {
          result = { error: "Invalid order id format." };
        } else {
          const orderQuery = args?.orderId
            ? { _id: args.orderId, userId: effectiveUserId }
            : { userId: effectiveUserId };
          const order = await Order.findOne(orderQuery).sort({ createdAt: -1 });
          if (!order) {
            result = { error: "Order not found." };
          } else {
            result = { orderId: order._id, status: order.status, timeline: buildOrderTimeline(order.status) };
            actions.push({ type: "order_timeline", payload: result });
          }
        }
      }

      if (name === "getShippingFAQ") {
        result = {
          answer: getFaqAnswer(args?.question || latestUserText || ""),
        };
      }

      if (name === "getTrendingProducts") {
        const limit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, Number(args?.limit) || 4));
        const books = await Book.find({ trending: true })
          .sort({ rating: -1, createdAt: -1 })
          .limit(limit);
        const cards = books.map(mapBookCard);
        productCards.push(...cards);
        result = { count: cards.length, products: cards };
      }

      if (name === "getRecommendations") {
        const recommendations = await buildRecommendationResponse({
          req,
          behaviorContext,
          lastShownProducts,
          limit: args?.limit,
        });
        const cards = Array.isArray(recommendations.products) ? recommendations.products : [];
        productCards.push(...cards);
        result = {
          count: cards.length,
          products: cards,
          strategy: recommendations.reply,
        };
      }

      if (name === "addToCart") {
        const quantity = Math.max(1, Number(args?.quantity) || 1);
        let selectedProduct = null;
        if (args?.productId) {
          selectedProduct = await Book.findById(args.productId);
        } else if (Number.isInteger(args?.productIndex) && latestSearchCards[args.productIndex - 1]) {
          const candidate = latestSearchCards[args.productIndex - 1];
          selectedProduct = await Book.findById(candidate.id);
        }
        if (!selectedProduct) {
          result = { error: "I could not identify which product to add." };
        } else {
          const selectedTitle = getBookTitle(selectedProduct);
          const selectedPrice = getBookPrice(selectedProduct);
          result = {
            message: `Would you like me to add ${selectedTitle} to your cart for Rs. ${selectedPrice}?`,
            pendingCartAction: {
              productId: selectedProduct._id,
              productTitle: selectedTitle,
              price: selectedPrice,
              quantity,
            },
          };
          actions.push({ type: "confirm_add_to_cart", payload: result.pendingCartAction });
        }
      }

      if (name === "removeFromCart") {
        const cartItems = normalizedCartContext.items;
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
          result = { error: "Cart is empty." };
        } else {
          let itemToRemove = null;
          if (typeof args?.productId === "string" && args.productId.trim()) {
            itemToRemove = cartItems.find((item) => item.id === args.productId.trim());
          }

          if (!itemToRemove && Number.isInteger(args?.productIndex) && cartItems[args.productIndex - 1]) {
            itemToRemove = cartItems[args.productIndex - 1];
          }

          if (!itemToRemove) {
            itemToRemove = findCartItemForRemoval(latestUserText, normalizedCartContext);
          }

          if (!itemToRemove) {
            result = { error: "I could not identify which cart item to remove." };
          } else {
            result = {
              message: `${itemToRemove.title || "Item"} was removed from cart.`,
              removedProductId: itemToRemove.id,
            };
            actions.push({
              type: "remove_from_cart",
              payload: {
                productId: itemToRemove.id,
                productTitle: itemToRemove.title || "Item",
              },
            });
          }
        }
      }

      if (name === "applyCoupon") {
        const codeFromTool = typeof args?.code === "string" ? args.code.trim().toUpperCase() : "";
        const code = codeFromTool || extractCouponCodeFromText(latestUserText);
        const couponResponse = buildCouponActionResponse(code, normalizedCartContext);
        result = { message: couponResponse.reply };
        if (Array.isArray(couponResponse.actions) && couponResponse.actions.length > 0) {
          actions.push(...couponResponse.actions);
          const applied = couponResponse.actions.find((action) => action.type === "apply_coupon");
          if (applied?.payload) {
            result.appliedCoupon = applied.payload;
          }
        }
      }

      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    const second = await createCompletion([
      ...safeMessages,
      { role: "assistant", content: first.content || "", tool_calls: toolCalls },
      ...toolMessages,
    ]);

    return res.status(200).json({
      reply: second?.content || "Here are the results.",
      products: productCards.slice(0, MAX_SEARCH_RESULTS),
      actions,
    });
  } catch (error) {
    console.error("AI chat route failed", error);
    return res.status(500).json({ message: "Failed to process AI chat request." });
  }
});

module.exports = router;