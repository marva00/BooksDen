import { createSlice } from "@reduxjs/toolkit";
import Swal  from "sweetalert2";

const getCartItemsKey = (userId) => `cart:${userId || 'guest'}:items`;
const getCartCouponKey = (userId) => `cart:${userId || 'guest'}:coupon`;

const parseCartItems = (rawValue) => {
    try {
        const parsed = rawValue ? JSON.parse(rawValue) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

const parseAppliedCoupon = (rawValue) => {
    try {
        if (!rawValue) return null;
        const parsed = JSON.parse(rawValue);
        if (!parsed || typeof parsed !== 'object') return null;
        const code = typeof parsed.code === 'string' ? parsed.code.trim().toUpperCase() : '';
        const percent = Number(parsed.percent);
        if (!code || !Number.isFinite(percent) || percent <= 0) return null;
        return {
            code,
            percent: Math.min(100, Math.max(1, percent)),
        };
    } catch {
        return null;
    }
}

const loadCartItems = (userId) => {
    const scopedRaw = localStorage.getItem(getCartItemsKey(userId));
    if (scopedRaw !== null) {
        return parseCartItems(scopedRaw);
    }

    // Backward compatibility for previously unscoped guest cart data.
    if (!userId) {
        return parseCartItems(localStorage.getItem('cartItems'));
    }

    return [];
}

const loadAppliedCoupon = (userId) => {
    const scopedRaw = localStorage.getItem(getCartCouponKey(userId));
    if (scopedRaw !== null) {
        return parseAppliedCoupon(scopedRaw);
    }

    // Backward compatibility for previously unscoped guest coupon data.
    if (!userId) {
        return parseAppliedCoupon(localStorage.getItem('appliedCoupon'));
    }

    return null;
}

const persistCartState = (state) => {
    const userId = state.userId || null;

    localStorage.setItem(getCartItemsKey(userId), JSON.stringify(state.cartItems));
    if (state.appliedCoupon) {
        localStorage.setItem(getCartCouponKey(userId), JSON.stringify(state.appliedCoupon));
    } else {
        localStorage.removeItem(getCartCouponKey(userId));
    }

    // Keep legacy guest keys in sync so old builds keep working for guests.
    if (!userId) {
        localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        if (state.appliedCoupon) {
            localStorage.setItem('appliedCoupon', JSON.stringify(state.appliedCoupon));
        } else {
            localStorage.removeItem('appliedCoupon');
        }
    }
}

const initialState = {
    userId: null,
    cartItems: loadCartItems(null),
    appliedCoupon: loadAppliedCoupon(null),
}

const cartSlice = createSlice({
    name: 'cart',
    initialState: initialState,
    reducers:{
        hydrateCart: (state, action) => {
            state.userId = action.payload || null;
            state.cartItems = loadCartItems(state.userId);
            state.appliedCoupon = loadAppliedCoupon(state.userId);
        },
        addToCart: (state, action) => {
            const existingItem = state.cartItems.find(item => item._id === action.payload._id);
            if(!existingItem) {
                state.cartItems.push({ ...action.payload, quantity: 1 })
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Product Added to the Cart",
                    showConfirmButton: false,
                    timer: 1500
                  });
            } else {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            }
            persistCartState(state);
        },
        removeFromCart: (state, action) => {
            const payload = action.payload || {};
            const payloadId = payload._id || payload.id || payload.productId;
            state.cartItems = state.cartItems.filter(item => item._id !== payloadId)
            if (state.cartItems.length === 0) {
                state.appliedCoupon = null;
            }
            persistCartState(state);
        },
        updateCartQty: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find((entry) => entry._id === id);
            if (item) {
                item.quantity = Math.max(1, Number(quantity) || 1);
                persistCartState(state);
            }
        },
        applyCoupon: (state, action) => {
            const payload = action.payload || {};
            const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';
            const percent = Number(payload.percent);
            if (!code || !Number.isFinite(percent) || percent <= 0) return;
            state.appliedCoupon = {
                code,
                percent: Math.min(100, Math.max(1, percent)),
            };
            persistCartState(state);
        },
        clearCoupon: (state) => {
            state.appliedCoupon = null;
            persistCartState(state);
        },
        clearCart: (state) => {
            state.cartItems = []
            state.appliedCoupon = null;
            persistCartState(state);
        }
    }
})

// export the actions   
export const  {hydrateCart, addToCart, removeFromCart, updateCartQty, applyCoupon, clearCoupon, clearCart} = cartSlice.actions;
export default cartSlice.reducer;