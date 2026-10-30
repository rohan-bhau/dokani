import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BackendUser } from './authApi';

interface AuthState {
  user: BackendUser | null;
  token: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: BackendUser; token: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isInitialized = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('dokani_access_token', action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem('dokani_refresh_token', action.payload.refreshToken);
        }
        localStorage.setItem('dokani_user', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isInitialized = true;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('dokani_access_token');
        localStorage.removeItem('dokani_refresh_token');
        localStorage.removeItem('dokani_user');
      }
    },
    initializeFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('dokani_access_token');
        const userStr = localStorage.getItem('dokani_user');
        if (token && userStr) {
          try {
            state.user = JSON.parse(userStr);
            state.token = token;
          } catch {
            state.user = null;
            state.token = null;
          }
        }
      }
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logout, initializeFromStorage } = authSlice.actions;
export const authReducer = authSlice.reducer;
