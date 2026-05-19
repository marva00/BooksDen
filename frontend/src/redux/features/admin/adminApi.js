import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import getBaseUrl from '../../../utils/baseURL';

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    searchParams.set(key, normalized);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/api/admin`,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminStats', 'AdminOrders', 'AdminUsers'],
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/',
      providesTags: [{ type: 'AdminStats', id: 'SUMMARY' }],
    }),
    getSalesAnalytics: builder.query({
      query: (params = {}) => `/sales-analytics${buildQueryString(params)}`,
      providesTags: [{ type: 'AdminStats', id: 'SALES_ANALYTICS' }],
    }),
    getAdminOrders: builder.query({
      query: (params = {}) => `/orders${buildQueryString(params)}`,
      providesTags: (result) => {
        const tags = [{ type: 'AdminOrders', id: 'LIST' }];
        const orders = result?.orders || [];
        orders.forEach((order) => tags.push({ type: 'AdminOrders', id: order._id }));
        return tags;
      },
    }),
    getAdminOrder: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [{ type: 'AdminOrders', id: orderId }],
    }),
    updateAdminOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'AdminOrders', id: 'LIST' },
        { type: 'AdminOrders', id: arg.orderId },
        { type: 'AdminStats', id: 'SUMMARY' },
      ],
    }),
    getAdminUsers: builder.query({
      query: (params = {}) => `/users${buildQueryString(params)}`,
      providesTags: (result) => {
        const tags = [{ type: 'AdminUsers', id: 'LIST' }];
        (result || []).forEach((user) => tags.push({ type: 'AdminUsers', id: user._id }));
        return tags;
      },
    }),
    updateAdminUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'AdminUsers', id: 'LIST' },
        { type: 'AdminUsers', id: arg.userId },
        { type: 'AdminStats', id: 'SUMMARY' },
      ],
    }),
    deleteAdminUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AdminUsers', id: 'LIST' },
        { type: 'AdminStats', id: 'SUMMARY' },
      ],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetSalesAnalyticsQuery,
  useGetAdminOrdersQuery,
  useGetAdminOrderQuery,
  useUpdateAdminOrderStatusMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserRoleMutation,
  useDeleteAdminUserMutation,
} = adminApi;

export default adminApi;
