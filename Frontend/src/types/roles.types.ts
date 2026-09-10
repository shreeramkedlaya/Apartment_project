/**
 * types/roles.types.ts
 * TypeScript types for Role Management and User Management.
 */

export type RoleStatus = 'active' | 'inactive' | 'draft';

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  status: RoleStatus;
  permission_tabs: string[];
  user_count: number;
  created_at: string;
}

export interface RoleStats {
  total_roles: number;
  active_roles: number;
  inactive_roles: number;
  draft_roles: number;
  total_users: number;
  total_permissions: number;
}

export interface RoleListResponse {
  stats: RoleStats;
  roles: Role[];
}

export interface CreateRolePayload {
  name: string;
  code?: string;
  description?: string;
  status: RoleStatus;
  permission_tabs: string[];
}

export type UpdateRolePayload = CreateRolePayload;

// ─── Permission Tree ────────────────────────────────────────────────────────

export interface PermissionNode {
  id: string;
  name: string;
  children?: PermissionNode[];
}

// ─── User Management ─────────────────────────────────────────────────────────

export interface ManagedUserFlat {
  id: number;
  number: string;
  block: string;
}

export interface ManagedUserRole {
  id: number;
  name: string;
  code: string;
  status: RoleStatus;
}

export interface ManagedUser {
  id: number;
  username: string;
  name: string;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  phone_number: string | null;
  role_id?: number | null;
  role_name: string;
  flat: ManagedUserFlat | null;
}

export interface UpdateUserPayload {
  name?: string;
  phone_number?: string | null;
  role_id?: number | null;
  is_active?: boolean;
  password?: string;
}

