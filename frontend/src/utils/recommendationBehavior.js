const STORAGE_KEY = "bookstore_recommendation_behavior";
const MAX_EVENT_IDS = 30;

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString().trim();
  }
  return "";
};

const uniqueIds = (ids = [], max = MAX_EVENT_IDS) => {
  const seen = new Set();
  const output = [];
  for (const item of ids) {
    const id = toIdString(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(id);
    if (output.length >= max) break;
  }
  return output;
};

const readBehaviorState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { viewedProductIds: [], clickedProductIds: [] };
    const parsed = JSON.parse(raw);
    return {
      viewedProductIds: uniqueIds(parsed?.viewedProductIds || []),
      clickedProductIds: uniqueIds(parsed?.clickedProductIds || []),
    };
  } catch {
    return { viewedProductIds: [], clickedProductIds: [] };
  }
};

const writeBehaviorState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures to avoid breaking shopping flows.
  }
};

const prependUnique = (collection = [], id, max = MAX_EVENT_IDS) => {
  const normalizedId = toIdString(id);
  if (!normalizedId) return uniqueIds(collection, max);
  const remaining = collection.filter((item) => item !== normalizedId);
  return uniqueIds([normalizedId, ...remaining], max);
};

const updateBehavior = (updater) => {
  const current = readBehaviorState();
  const next = updater(current);
  writeBehaviorState(next);
};

export const trackProductView = (productId) => {
  updateBehavior((state) => ({
    ...state,
    viewedProductIds: prependUnique(state.viewedProductIds, productId),
  }));
};

export const trackProductClick = (productId) => {
  updateBehavior((state) => ({
    ...state,
    clickedProductIds: prependUnique(state.clickedProductIds, productId),
  }));
};

export const getRecommendationBehaviorContext = () => readBehaviorState();
