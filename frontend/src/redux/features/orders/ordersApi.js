import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseURL";


const ordersApi = createApi({
    reducerPath: 'ordersApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${getBaseUrl()}/api/orders`,
        credentials: 'include',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['Orders'],
    endpoints: (builder) => ({
        createOrder: builder.mutation({
            query: (newOrder) => ({
                url: "/",
                method: "POST",
                body: newOrder,
                credentials: 'include',
            })
        }),
        getOrderByEmail: builder.query({
            query: (email) => ({
                url: `/email/${email}`
            }),
            providesTags: ['Orders']
        }),
        getOrderByUserId: builder.query({
            query: (userId) => ({
                url: `/user/${userId}`
            }),
            providesTags: ['Orders']
        }),
        getOrderTracking: builder.query({
            query: (orderId) => ({
                url: `/track/${orderId}`
            }),
            providesTags: (result, error, orderId) => [{ type: 'Orders', id: orderId }]
        })
    })
})

export const {useCreateOrderMutation, useGetOrderByEmailQuery, useGetOrderByUserIdQuery, useGetOrderTrackingQuery} = ordersApi;

export default ordersApi;