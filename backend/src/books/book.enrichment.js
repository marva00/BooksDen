const normalizeKey = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (value = "") =>
  value
    .toString()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "for",
  "to",
  "in",
  "on",
  "with",
  "your",
  "you",
  "this",
  "that",
  "is",
  "are",
  "at",
  "by",
  "from",
  "into",
  "or",
]);

const CATEGORY_ALIASES = {
  "sci-fi": "science fiction",
  scifi: "science fiction",
  sf: "science fiction",
  ya: "fiction",
  novel: "fiction",
  books: "fiction",
};

const KNOWN_CATEGORIES = new Set([
  "business",
  "technology",
  "fiction",
  "horror",
  "adventure",
  "marketing",
  "mystery",
  "romance",
  "science fiction",
  "biography",
  "self-help",
  "history",
  "poetry",
  "children",
]);

const CATEGORY_KEYWORDS = {
  business: ["business", "startup", "ecommerce", "strategy", "analytics", "store"],
  technology: [
    "technology",
    "software",
    "architecture",
    "tech",
    "ai",
    "coding",
    "code",
    "programmer",
    "programming",
    "javascript",
    "developer",
    "web",
    "node",
    "api",
  ],
  marketing: ["marketing", "seo", "branding", "audience", "campaign"],
  horror: ["horror", "haunted", "monster", "zombie", "fear", "dark"],
  adventure: ["adventure", "journey", "quest", "treasure", "travel"],
  fiction: ["fiction", "novel", "story", "romance", "drama", "dystopian"],
  mystery: ["mystery", "whodunit", "detective", "crime"],
  romance: ["romance", "love", "heart", "relationship"],
  "science fiction": ["science fiction", "futuristic", "space", "future", "cyber"],
  biography: ["biography", "memoir", "life", "inspiring"],
  "self-help": ["self-help", "personal growth", "habits", "mindset", "productivity"],
  history: ["history", "ancient", "civilization", "historical"],
  poetry: ["poetry", "poem", "verse", "lyric"],
  children: ["children", "kids", "young readers", "bedtime"],
};

const CATEGORY_PROFILES = {
  business: {
    focus: "practical strategy, growth, and decision-making",
    audience: "entrepreneurs, managers, and professionals",
  },
  technology: {
    focus: "modern systems, tools, and digital innovation",
    audience: "developers and technology learners",
  },
  marketing: {
    focus: "visibility, audience growth, and conversion tactics",
    audience: "marketers and founders building reach",
  },
  fiction: {
    focus: "character-driven storytelling and emotional depth",
    audience: "readers who enjoy immersive narratives",
  },
  horror: {
    focus: "suspense, tension, and unsettling atmosphere",
    audience: "readers who enjoy intense page-turners",
  },
  adventure: {
    focus: "high-stakes journeys, discovery, and courage",
    audience: "readers who like fast-paced stories",
  },
  mystery: {
    focus: "clues, suspense, and layered twists",
    audience: "readers who enjoy solving puzzles",
  },
  romance: {
    focus: "relationships, conflict, and emotional connection",
    audience: "readers who enjoy heartfelt stories",
  },
  "science fiction": {
    focus: "future-facing ideas, technology, and speculative worlds",
    audience: "readers interested in imaginative what-if scenarios",
  },
  biography: {
    focus: "real-life achievements, choices, and turning points",
    audience: "readers who value true inspirational stories",
  },
  "self-help": {
    focus: "habits, mindset, and practical self-improvement",
    audience: "readers working toward personal growth",
  },
  history: {
    focus: "historical context, events, and cultural impact",
    audience: "readers who enjoy learning from the past",
  },
  poetry: {
    focus: "imagery, rhythm, and reflective expression",
    audience: "readers who appreciate concise, expressive writing",
  },
  children: {
    focus: "age-appropriate learning, imagination, and wonder",
    audience: "young readers and families",
  },
};

const TITLE_OVERRIDES = {
  "the pragmatic programmer": {
    category: "technology",
    author: "Andrew Hunt",
    description:
      "A respected software engineering guide that emphasizes craftsmanship, practical thinking, and durable habits for building high-quality systems.",
  },
  "clean code": {
    category: "technology",
    author: "Robert C. Martin",
    description:
      "A software development classic focused on readability, maintainability, and disciplined coding practices for teams building long-term products.",
  },
  "javascript the good parts": {
    category: "technology",
    author: "Douglas Crockford",
    description:
      "A concise JavaScript reference that highlights reliable language patterns and helps developers write clearer, safer code in production projects.",
  },
  "you don t know js": {
    category: "technology",
    author: "Kyle Simpson",
    description:
      "A deep but practical JavaScript series that explains core language behavior so developers can debug faster and write more predictable applications.",
  },
  "the great gatsby": {
    category: "fiction",
    author: "F. Scott Fitzgerald",
    description:
      "A literary novel exploring ambition, class, and disillusionment through vivid characters and a sharply observed portrait of social aspiration.",
  },
  "sapiens a brief history of humankind": {
    category: "history",
    author: "Yuval Noah Harari",
    description:
      "A broad historical narrative examining how ideas, institutions, and cooperation shaped human societies from early eras to the modern world.",
  },
  "atomic habits": {
    category: "self-help",
    author: "James Clear",
    description:
      "A practical behavior-change guide focused on small, repeatable systems that compound into meaningful long-term personal and professional progress.",
  },
  "deep work": {
    category: "business",
    author: "Cal Newport",
    description:
      "A productivity-focused book on concentration, focus rituals, and reducing distraction to produce high-value work in demanding environments.",
  },
  1984: {
    category: "science fiction",
    author: "George Orwell",
    description:
      "A dystopian classic about surveillance, propaganda, and individual freedom, offering a powerful cautionary perspective on political control.",
  },
  "brave new world": {
    category: "science fiction",
    author: "Aldous Huxley",
    description:
      "A speculative social novel exploring technology, conformity, and engineered happiness in a future where stability comes at personal cost.",
  },
  "the fault in our stars": {
    category: "fiction",
    author: "John Green",
    description:
      "A contemporary coming-of-age novel that balances humor, vulnerability, and first love while exploring how young people find meaning during difficult circumstances.",
  },
  divergent: {
    category: "fiction",
    author: "Veronica Roth",
    description:
      "A fast-moving dystopian novel about identity, loyalty, and courage, as a young heroine challenges a rigid social system built on fear and control.",
  },
  "the hunger games": {
    category: "fiction",
    author: "Suzanne Collins",
    description:
      "A dystopian survival story where televised competition exposes inequality, resilience, and resistance in a society driven by spectacle and power.",
  },
  "harry potter and the order of the phoenix": {
    category: "adventure",
    author: "J. K. Rowling",
    description:
      "A magical coming-of-age adventure centered on friendship, leadership, and truth, as students unite against rising danger in the wizarding world.",
  },
  "alice s adventures in wonderland": {
    category: "children",
    author: "Lewis Carroll",
    description:
      "A playful classic filled with curious characters, imaginative settings, and witty language that invites readers into a world of creative nonsense.",
  },
  "the giving tree": {
    category: "children",
    author: "Shel Silverstein",
    description:
      "A short, reflective classic about generosity, growing up, and changing relationships, told in simple language suitable for shared family reading.",
  },
  "the lightning thief": {
    category: "adventure",
    author: "Rick Riordan",
    description:
      "A myth-inspired adventure featuring quests, humor, and friendship, as a young hero uncovers hidden powers and navigates a dangerous world.",
  },
  "the alchemist": {
    category: "adventure",
    author: "Paulo Coelho",
    description:
      "A philosophical quest novel about purpose, persistence, and listening to intuition, presented through a symbolic journey across distant landscapes.",
  },
  "to kill a mockingbird": {
    category: "fiction",
    author: "Harper Lee",
    description:
      "A literary classic examining justice, empathy, and social inequality through a young narrator's perspective in a deeply divided community.",
  },
  "pride and prejudice": {
    category: "fiction",
    author: "Jane Austen",
    description:
      "A classic social novel known for sharp dialogue and nuanced character growth, exploring pride, assumptions, and emotional maturity.",
  },
};

const clampRating = (value, fallback = 4.2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.min(5, Math.max(0, Number(numeric.toFixed(1))));
};

const sanitizeSentence = (value = "") =>
  value
    .toString()
    .replace(/\s+/g, " ")
    .trim();

const getCanonicalCategory = (value = "") => {
  const normalized = normalizeKey(value);
  if (!normalized) return "";
  if (CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized];
  if (KNOWN_CATEGORIES.has(normalized)) return normalized;
  return "";
};

const inferCategory = ({ title = "", description = "", category = "" }) => {
  const existing = getCanonicalCategory(category);
  const text = normalizeKey(`${title} ${description}`);

  let inferred = "";
  let bestScore = 0;

  for (const [candidate, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((sum, keyword) => {
      const hasKeyword = text.includes(normalizeKey(keyword));
      return hasKeyword ? sum + 1 : sum;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      inferred = candidate;
    }
  }

  if (existing && existing !== "fiction") {
    return existing;
  }
  if (existing === "fiction" && bestScore === 0) {
    return "fiction";
  }
  if (inferred) return inferred;
  return existing || "fiction";
};

const isWeakDescription = (description = "") => {
  const text = sanitizeSentence(description);
  if (!text) return true;
  if (text.length < 110) return true;
  return /top picks|curated list|must try|complete guide|tips and tricks/i.test(text);
};

const buildDescription = ({
  title,
  category,
  existingDescription,
  overrideDescription,
  forceDescription = false,
}) => {
  if (!forceDescription && !isWeakDescription(existingDescription)) {
    return sanitizeSentence(existingDescription);
  }

  if (overrideDescription) {
    return sanitizeSentence(overrideDescription);
  }

  const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.fiction;
  const safeTitle = sanitizeSentence(title) || "This book";
  return `${safeTitle} is a ${category} title focused on ${profile.focus}. It is written for ${profile.audience} and offers clear value for readers choosing high-quality books in this genre.`;
};

const buildSeoKeywords = ({ title, category, author }) => {
  const source = normalizeKey(`${title} ${category} ${author} book bookstore reading`).split(" ");
  const unique = [];

  for (const token of source) {
    if (!token || token.length < 3 || STOP_WORDS.has(token)) continue;
    if (unique.includes(token)) continue;
    unique.push(token);
    if (unique.length >= 12) break;
  }

  return unique.join(", ");
};

const buildSeoPayload = ({ title, category, description, author }) => ({
  metaTitle: `${sanitizeSentence(title)} | ${toTitleCase(category)} Book`,
  metaDescription: sanitizeSentence(description).slice(0, 158),
  keywords: buildSeoKeywords({ title, category, author }),
});

const isGenericAuthor = (value = "") => {
  const normalized = normalizeKey(value);
  return (
    !normalized ||
    normalized === "admin" ||
    normalized === "author" ||
    normalized === "unknown" ||
    normalized === "unknown author" ||
    normalized === "na" ||
    normalized === "n a" ||
    normalized === "none" ||
    normalized === "not available"
  );
};

const getOverrideKey = (title = "") => {
  const normalized = normalizeKey(title);
  if (TITLE_OVERRIDES[normalized]) return normalized;

  if (normalized === "alice s adventures in wonderland") return normalized;
  if (normalized === "alice adventures in wonderland") return "alice s adventures in wonderland";

  return normalized;
};

const enrichBookRecord = (book = {}, options = {}) => {
  const { forceDescription = false } = options;
  const title = sanitizeSentence(book?.title || book?.name || "Untitled Book");
  const overrideKey = getOverrideKey(title);
  const override = TITLE_OVERRIDES[overrideKey] || {};

  const category =
    override.category ||
    inferCategory({ title, description: book?.description || "", category: book?.category || "" });

  const author = isGenericAuthor(book?.author)
    ? override.author || "Unknown Author"
    : sanitizeSentence(book.author);

  const brand = isGenericAuthor(book?.brand) ? author : sanitizeSentence(book.brand);

  const description = buildDescription({
    title,
    category,
    existingDescription: book?.description || "",
    overrideDescription: override.description,
    forceDescription,
  });

  const rating = clampRating(book?.rating, book?.trending ? 4.4 : 4.2);
  const stock = Number.isFinite(Number(book?.stock)) && Number(book.stock) > 0 ? Number(book.stock) : 20;

  return {
    title,
    name: title,
    description,
    category,
    author,
    brand,
    rating,
    stock,
    seo: buildSeoPayload({ title, category, description, author }),
  };
};

module.exports = {
  enrichBookRecord,
  inferCategory,
  isWeakDescription,
};
