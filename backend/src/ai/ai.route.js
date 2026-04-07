const express = require("express");
const fs = require("fs");
const path = require("path");
const Book = require("../books/book.model");
const Order = require("../orders/order.model");
const { optionalUserToken } = require("../middleware/verifyUserToken");

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a Smart E-Commerce Assistant.
Use tools to answer product and order questions accurately.
If user is idle or asks for suggestions, recommend trending products.
Before adding to cart, always ask for confirmation and then emit addToCart tool call after confirmation.
Keep responses concise and friendly.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Search books by keyword/category and optional price range.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
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
      name: "getShippingFAQ",
      description: "Return shipping FAQ response text.",
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
];

const FAQ_PATH = path.join(__dirname, "faq.json");
const SHIPPING_FAQ = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));

const getBookTitle = (book) => book?.title || book?.name || "Untitled Book";
const getBookPrice = (book) => {
  const price = Number(book?.newPrice ?? book?.price);
  return Number.isFinite(price) ? price : 0;
};
const getBookCover = (book) => {
  if (typeof book?.coverImage === "string" && book.coverImage.trim()) return book.coverImage;
  if (Array.isArray(book?.images) && book.images.length > 0) return book.images[0];
  return "book-1.png";
};

const applyPriceFilter = (query, minPrice, maxPrice) => {
  const hasMin = typeof minPrice === "number";
  const hasMax = typeof maxPrice === "number";
  if (!hasMin && !hasMax) return;

  const range = {};
  if (hasMin) range.$gte = minPrice;
  if (hasMax) range.$lte = maxPrice;

  query.$and = query.$and || [];
  query.$and.push({ $or: [{ newPrice: range }, { price: range }] });
};

const mapBookCard = (book) => ({
  id: book._id,
  title: getBookTitle(book),
  price: getBookPrice(book),
  slug: book.slug,
  coverImage: getBookCover(book),
  category: book.category,
  rating: typeof book.rating === "number" ? book.rating : 0,
});

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
  const matches = (text || "").match(/\d+/g) || [];
  const nums = matches.map(Number).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return {};
  if (/(under|below|max|less than)/i.test(text)) return { maxPrice: nums[0] };
  if (/(above|over|min|more than)/i.test(text)) return { minPrice: nums[0] };
  if (nums.length >= 2) return { minPrice: Math.min(nums[0], nums[1]), maxPrice: Math.max(nums[0], nums[1]) };
  return {};
};

const detectCategory = (text) => {
  const categories = ["business", "technology", "fiction", "horror", "adventure"];
  const lower = (text || "").toLowerCase();
  return categories.find((c) => lower.includes(c)) || "";
};

const runFallbackAssistant = async ({ latestUserText = "", idle = false, req, lastShownProducts = [], pendingCartAction = null }) => {
  const lower = latestUserText.toLowerCase();
  const wantsTrending = idle || /suggest|recommend|trending|popular/i.test(lower);
  const wantsShipping = /ship|delivery|refund|return|policy/i.test(lower);
  const asksOrderStatus = /where is my order|my order|order status|track/i.test(lower);
  const confirms = /^(yes|yep|sure|ok|okay|confirm|do it)$/i.test(lower.trim());
  const denies = /^(no|nope|cancel|stop)$/i.test(lower.trim());
  const wantsAddToCart = /add .*cart|add the first|add first/i.test(lower);

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

  if (asksOrderStatus) {
    if (!req.user?.id) {
      return { reply: "Please login first so I can check your orders securely.", products: [], actions: [] };
    }
    const latestOrder = await Order.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!latestOrder) {
      return { reply: "I could not find any orders on your account yet.", products: [], actions: [] };
    }
    const timeline = buildOrderTimeline(latestOrder.status);
    return {
      reply: `Your latest order is currently ${latestOrder.status}.`,
      products: [],
      actions: [{ type: "order_timeline", payload: { orderId: latestOrder._id, timeline } }],
    };
  }

  if (wantsShipping) {
    const found = SHIPPING_FAQ.find((entry) =>
      entry.keywords.some((kw) => lower.includes(kw))
    );
    return {
      reply:
        found?.answer ||
        "Shipping and policy details are shown at checkout. Ask about delivery, shipping cost, or returns.",
      products: [],
      actions: [],
    };
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

  const category = detectCategory(lower);
  const { minPrice, maxPrice } = parsePriceBounds(lower);
  const query = {};
  if (category) query.category = new RegExp(`^${category}$`, "i");
  applyPriceFilter(query, minPrice, maxPrice);
  if (!category && !(Array.isArray(query.$and) && query.$and.length > 0)) {
    query.$or = [
      { title: { $regex: latestUserText, $options: "i" } },
      { name: { $regex: latestUserText, $options: "i" } },
      { description: { $regex: latestUserText, $options: "i" } },
      { category: { $regex: latestUserText, $options: "i" } },
    ];
  }

  const books = await Book.find(query).sort({ trending: -1, createdAt: -1 }).limit(6);
  const cards = books.map(mapBookCard);
  return {
    reply: cards.length
      ? "I found these products based on your request."
      : "I could not find matching products. Try a category like fiction, business, or a price range.",
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

router.post("/chat", optionalUserToken, async (req, res) => {
  const { messages = [], idle = false, lastShownProducts = [], pendingCartAction = null } = req.body || {};
  const safeMessages = Array.isArray(messages) ? messages : [];

  try {
    const latestUserText = safeMessages
      .slice()
      .reverse()
      .find((m) => m?.role === "user")?.content || "";

    if (!OPENAI_API_KEY) {
      const fallback = await runFallbackAssistant({ latestUserText, idle, req, lastShownProducts, pendingCartAction });
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
        const query = {};
        if (typeof args?.category === "string" && args.category.trim()) {
          query.category = new RegExp(`^${args.category.trim()}$`, "i");
        }
        if (typeof args?.query === "string" && args.query.trim()) {
          const q = args.query.trim();
          query.$or = [
            { title: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
          ];
        }
        applyPriceFilter(query, args?.minPrice, args?.maxPrice);
        const books = await Book.find(query).sort({ trending: -1, createdAt: -1 }).limit(8);
        const cards = books.map(mapBookCard);
        productCards.push(...cards);
        latestSearchCards = cards;
        result = { count: cards.length, products: cards };
      }

      if (name === "getOrderItem") {
        const effectiveUserId = req.user?.id;
        if (!effectiveUserId) {
          result = { error: "User is not logged in." };
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
        const text = (args?.question || latestUserText || "").toLowerCase();
        const found = SHIPPING_FAQ.find((entry) =>
          entry.keywords.some((kw) => text.includes(kw))
        );
        result = {
          answer:
            found?.answer ||
            "Shipping and policy details are shown at checkout. Ask about delivery, shipping cost, or returns.",
        };
      }

      if (name === "getTrendingProducts") {
        const limit = Math.min(8, Math.max(1, Number(args?.limit) || 4));
        const books = await Book.find({ trending: true })
          .sort({ rating: -1, createdAt: -1 })
          .limit(limit);
        const cards = books.map(mapBookCard);
        productCards.push(...cards);
        result = { count: cards.length, products: cards };
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
      products: productCards.slice(0, 8),
      actions,
    });
  } catch (error) {
    console.error("AI chat route failed", error);
    return res.status(500).json({ message: "Failed to process AI chat request." });
  }
});

module.exports = router;
