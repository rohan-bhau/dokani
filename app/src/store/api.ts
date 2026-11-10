import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from './authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dokani_access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('dokani_refresh_token');

    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshResult = await rawBaseQuery(
              {
                url: '/auth/refresh',
                method: 'POST',
                body: { refreshToken },
              },
              api,
              extraOptions
            );

            const responseData = refreshResult.data as {
              success: boolean;
              data?: { accessToken: string; refreshToken: string; user: any };
            };

            if (responseData?.success && responseData?.data?.accessToken) {
              api.dispatch(
                setCredentials({
                  user: responseData.data.user,
                  token: responseData.data.accessToken,
                  refreshToken: responseData.data.refreshToken,
                })
              );
              return true;
            }
            return false;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions);
        return result;
      }
    }

    if (
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register')
    ) {
      api.dispatch(logout());
      window.location.href = '/login';
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Product', 'Stock', 'InventoryAlert', 'Customer', 'CustomerLedger', 'Report', 'AuditLog'],
  endpoints: () => ({}),
});
