import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, Role } from '../types/auth';
import apiClient, { clearSessionToken } from '../services/apiClient';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // true during initial session restoration check
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => {},
  logout: async () => {},
});

interface MeResponse {
  userId: string;
  roles: Role[];
  tenantId: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session by calling GET /api/auth/me.
  // The apiClient request interceptor attaches the JWT from sessionStorage as an
  // Authorization header (mobile-safe, cross-domain). Falls back to httpOnly cookie on desktop.
  useEffect(() => {
    apiClient
      .get<MeResponse>('/api/auth/me')
      .then((res) =>
        setUser({ userId: res.data.userId, roles: res.data.roles, tenantId: res.data.tenantId })
      )
      .catch(() => setUser(null))   // 401 = not authenticated; any other error → treat as unauthenticated
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    clearSessionToken();
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Swallow — cookie cleared server-side if possible; local state cleared regardless
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
