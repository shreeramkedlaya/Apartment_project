import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthContextValue, AuthUser } from '@/types/auth.types';
import { saveTokens, clearTokens, getValidToken } from '@/services/core/checkValidityToken';
import { fetchMe } from '@/services/auth/auth.service';
import { fetchPermissionsTree } from '@/pages/Dashboard/tabs/Administration/services/roles.service';

interface CustomJwtPayload {
  user_data: {
    id: number;
    name: string;
    email?: string;
    role?: string;
    phone_number: string;
    flat_number?: string;
  };
  exp: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async (existingUser?: AuthUser) => {
    try {
      const meData = await fetchMe();
      
      let permissionTabs = meData.permission_tabs || [];
      if (permissionTabs === "All") {
        try {
          const tree = await fetchPermissionsTree();
          const flattenPermissions = (nodes: any[]): string[] => {
            const result: string[] = [];
            for (const node of nodes) {
              result.push(node.id);
              if (node.children) {
                result.push(...flattenPermissions(node.children));
              }
            }
            return result;
          };
          permissionTabs = flattenPermissions(tree);
        } catch (err) {
          console.error("Failed to fetch full permissions tree for admin:", err);
          permissionTabs = [];
        }
      }

      const hasAdminPerms = permissionTabs.some((t: string) => 
        t.startsWith('administration.') || t.startsWith('community.') || t.startsWith('helpdesk.')
      );
      const resolvedRole = meData.role || (hasAdminPerms ? 'admin' : 'resident');

      const updatedUser: AuthUser = {
        uid: meData.id.toString(),
        phone: meData.phone_number || meData.name,
        role: resolvedRole,
        name: meData.name,
        email: meData.email || '',
        flatNumber: meData.flat_number || '',
        permissionTabs: permissionTabs,
      };
      
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to fetch user permissions:', err);
      if (existingUser) {
        setUser(existingUser);
      }
    }
  }, []);

  const checkLogin = useCallback(async () => {
    const token = await getValidToken();
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        if (decoded.exp * 1000 < Date.now()) {
          clearTokens();
          setUser(null);
        } else {
          // Temporarily set user without permissions until fetchMe completes
          const tempUser: AuthUser = {
            uid: decoded.user_data.id.toString(),
            phone: decoded.user_data.phone_number || decoded.user_data.name,
            role: decoded.user_data.role || 'resident',
            name: decoded.user_data.name,
            email: decoded.user_data.email || '',
            flatNumber: decoded.user_data.flat_number || '',
            permissionTabs: [],
          };
          setUser(tempUser);
          await refreshPermissions(tempUser);
        }
      } catch {
        clearTokens();
        setUser(null);
      }
    } else {
      clearTokens();
      setUser(null);
    }
    setLoading(false);
  }, [refreshPermissions]);

  useEffect(() => {
    checkLogin();
  }, [checkLogin]);

  const login = useCallback(async (access: string, refresh?: string) => {
    saveTokens(access, refresh);
    const decoded = jwtDecode<CustomJwtPayload>(access);
    const tempUser: AuthUser = {
      uid: decoded.user_data.id.toString(),
      phone: decoded.user_data.phone_number || decoded.user_data.name,
      role: decoded.user_data.role || 'resident',
      name: decoded.user_data.name,
      email: decoded.user_data.email || '',
      flatNumber: decoded.user_data.flat_number || '',
      permissionTabs: [],
    };
    setUser(tempUser);
    await refreshPermissions(tempUser);
  }, [refreshPermissions]);

  const logout = useCallback(async () => {
    clearTokens();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isResident: user?.role === 'resident',
    isAdmin: user?.role === 'admin' || user?.role === 'manager',
    login,
    logout,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
