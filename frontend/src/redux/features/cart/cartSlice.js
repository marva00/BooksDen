import { createSlice } from "@reduxjs/toolkit";
import Swal  from "sweetalert2";

const loadCartItems = () => {
    try {
        const raw = localStorage.getItem('cartItems');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

const initialState = {
    cartItems: loadCartItems()
}

const cartSlice = createSlice({
    name: 'cart',
    initialState: initialState,
    reducers:{
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
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        removeFromCart: (state, action) => {
            state.cartItems =  state.cartItems.filter(item => item._id !== action.payload._id)
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        updateCartQty: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find((entry) => entry._id === id);
            if (item) {
                item.quantity = Math.max(1, Number(quantity) || 1);
                localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            }
        },
        clearCart: (state) => {
            state.cartItems = []
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        }
    }
})

// export the actions   
export const  {addToCart, removeFromCart, updateCartQty, clearCart} = cartSlice.actions;
export default cartSlice.reducer;