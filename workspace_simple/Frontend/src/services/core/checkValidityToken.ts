import { jwtDecode } from 'jwt-decode';

export const isTokenExpired = (): boolean => {
  const expirationTime = localStorage.getItem('apt_token_expiration');
  if (!expirationTime) return true;
  const bufferTime = 2 * 60 * 1000; // 2 minute buffer
  return Date.now() > parseInt(expirationTime, 10) - bufferTime;
};

export const saveTokens = (access: string, refresh?: string) => {
  const decoded: any = jwtDecode(access);
  const expirationTime = decoded.exp * 1000;
  localStorage.setItem('apt_access_token', access);
  localStorage.setItem('apt_token_expiration', expirationTime.toString());
  if (refresh) localStorage.setItem('apt_refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('apt_access_token');
  localStorage.removeItem('apt_refresh_token');
  localStorage.removeItem('apt_token_expiration');
};

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('apt_refresh_token');
  if (!refreshToken) {
    // No refresh token — user likely not logged in yet. Skip refresh silently.
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log("🔄 Attempting token refresh...");
      // Lazily import to avoid circular dependency with axiosInstance
      const { default: axiosInstance } = await import('./axiosinstance');
      
      const response = await axiosInstance.post(
        '/auth/token/refresh/',
        { refresh: refreshToken },
        { skipAuth: true } as any
      );

      const newAccessToken = response.data.access;
      const newRefreshToken = response.data.refresh;

      saveTokens(newAccessToken, newRefreshToken);
      console.log("✅ Token refreshed successfully");
      return newAccessToken;
    } catch (error: any) {
      console.error("❌ Token refresh failed:", error?.response?.status, error?.message);
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const getValidToken = async (): Promise<string | null> => {
  if (isTokenExpired()) {
    return await refreshAccessToken();
  }
  return localStorage.getItem('apt_access_token');
};
