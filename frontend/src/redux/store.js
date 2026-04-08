import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import wishlistReducer from './features/wishlist/wishlistSlice'
import booksApi from './features/books/booksApi'
import ordersApi from './features/orders/ordersApi'
import adminApi from './features/admin/adminApi'
import newsApi from './features/news/newsApi'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    [booksApi.reducerPath]: booksApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [newsApi.reducerPath]: newsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(booksApi.middleware, ordersApi.middleware, adminApi.middleware, newsApi.middleware),
})