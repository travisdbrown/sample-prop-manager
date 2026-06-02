import axios from 'axios';

const SESSION_TOKEN_KEY = 'auth_session_token';

// Persists the JWT in sessionStorage so it survives page reloads within the same
// browser session. Using the Authorization header (rather than the httpOnly cookie)
// avoids iOS Safari ITP blocking cross-site cookies when the frontend and API are
// on different domains (*.web.core.windows.net vs *.azurewebsites.net).
export function saveSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT as Authorization header when available.
// This is the primary auth mechanism for mobile (cross-domain, ITP-safe).
// The httpOnly cookie is still set and sent as a fallback for desktop sessions
// that pre-date this change.
apiClient.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor: redirect to /login on 401, except for the session-restore
// probe (/api/auth/me) which legitimately returns 401 when no session exists.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for /api/auth/me (session probe) or /api/auth/login (credentials
    // rejected by the server) — both are expected 401s that callers handle themselves.
    const url = error.config?.url ?? '';
    const isHandledEndpoint = url === '/api/auth/me' || url.includes('/api/auth/login');
    if (error.response?.status === 401 && !isHandledEndpoint) {
      clearSessionToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
