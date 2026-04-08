import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import getBaseUrl from '../../../utils/baseURL';

const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/api/news`,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery,
  tagTypes: ['News'],
  endpoints: (builder) => ({
    fetchAllNews: builder.query({
      query: () => '/',
      providesTags: ['News'],
    }),
  }),
});

export const { useFetchAllNewsQuery } = newsApi;
export default newsApi;
