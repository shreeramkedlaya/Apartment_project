/**
 * services/api.client.ts
 *
 * Central Axios instance for Django DRF backend calls.
 * - Auto-attaches JWT access token.
 * - Silently refreshes on 401 and retries.
 * - When Firebase Auth is live, swap localStorage token with
 *   `await user.getIdToken()` — see FIREBASE_SETUP.md.
 */

import axios, { type AxiosInstance } from 'axios';
import { BASE_URL } from './http';
import { getValidToken, refreshAccessToken } from './checkValidityToken';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}


const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config;

  const token = await getValidToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (res) => {
    // Automatically unwrap the standard backend JSON payload if present
    if (
      res.data &&
      typeof res.data === 'object' &&
      'status' in res.data &&
      'data' in res.data
    ) {
      return { ...res, data: res.data.data };
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest.skipAuth && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Fall through to logout
      }

      // clear session and redirect to login
      localStorage.removeItem('apt_access_token');
      localStorage.removeItem('apt_refresh_token');
      localStorage.removeItem('apt_token_expiration');
      window.location.href = '/login';
    }

    // Optional: unwrap error from the new envelope as well so error handlers don't break
    if (error.response?.data?.status === 'error' && error.response.data.error) {
      error.response.data = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
