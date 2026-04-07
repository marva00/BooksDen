import { createSlice } from "@reduxjs/toolkit";

const getWishlistKey = (userId) => `wishlist:${userId || 'guest'}`;

const loadWishlist = (userId) => {
  try {
    const raw = localStorage.getItem(getWishlistKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistWishlist = (userId, items) => {
  localStorage.setItem(getWishlistKey(userId), JSON.stringify(items));
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    userId: null,
    items: [],
  },
  reducers: {
    hydrateWishlist: (state, action) => {
      state.userId = action.payload || null;
      state.items = loadWishlist(state.userId);
    },
    toggleWishlistItem: (state, action) => {
      const product = action.payload;
      if (!state.userId || !product?._id) return;
      const exists = state.items.find((item) => item._id === product._id);
      if (exists) {
        state.items = state.items.filter((item) => item._id !== product._id);
      } else {
        state.items.push(product);
      }
      persistWishlist(state.userId, state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      if (state.userId) persistWishlist(state.userId, []);
    },
  },
});

export const { hydrateWishlist, toggleWishlistItem, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
