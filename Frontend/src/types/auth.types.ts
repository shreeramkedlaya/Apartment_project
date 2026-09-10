export type UserRole = 'resident' | 'admin' | 'manager' | string;

export interface AuthUser {
  uid: string;
  phone: string;
  role: UserRole;
  name: string;
  email?: string;
  permissionTabs?: string[];
  // Resident-specific (optional)
  flatNumber?: string;
  tower?: string;
  // Admin-specific (optional)
  designation?: string;
}

export interface FlatData {
  id: number;
  number: string;
}

export interface BlockData {
  id: number;
  name: string;
  flats: FlatData[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isResident: boolean;
  isAdmin: boolean;
  login: (access: string, refresh?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}
