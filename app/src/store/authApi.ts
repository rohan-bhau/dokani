import { baseApi } from './api';

export interface BackendUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  user: BackendUser;
  tokens: AuthTokens;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SignupRequest {
  tenantName: string;
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthPayload>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation<ApiResponse<AuthPayload>, SignupRequest>({
      query: (data) => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<{ message: string }, { refreshToken?: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation, useLogoutMutation } = authApi;
