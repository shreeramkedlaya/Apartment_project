/**
 * services/roles.service.ts
 * API service layer for Role & User Management.
 */

import axiosInstance from '@/services/core/axiosinstance';
import type {
  Role, CreateRolePayload, UpdateRolePayload,
  PermissionNode, ManagedUser, UpdateUserPayload,
} from '@/types/roles.types';

// ─── Roles CRUD ──────────────────────────────────────────────────────────────

export async function fetchRoles(params?: any): Promise<any> {
  const { data } = await axiosInstance.get('/accounts/roles/', { params, skipAuth: true });
  return data;
}

export async function fetchRole(id: number): Promise<Role> {
  const { data } = await axiosInstance.get(`/accounts/roles/${id}/`, { skipAuth: true });
  return data;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { data } = await axiosInstance.post('/accounts/roles/', payload, { skipAuth: true });
  return data;
}

export async function updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
  const { data } = await axiosInstance.put(`/accounts/roles/${id}/`, payload, { skipAuth: true });
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await axiosInstance.delete(`/accounts/roles/${id}/`, { skipAuth: true });
}

// ─── Permissions Tree ─────────────────────────────────────────────────────────

export async function fetchPermissionsTree(): Promise<PermissionNode[]> {
  const { data } = await axiosInstance.get('/accounts/permissions/tree/', { skipAuth: true });
  return data;
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function fetchUsers(params?: any): Promise<any> {
  const { data } = await axiosInstance.get('/accounts/users/', { params, skipAuth: true });
  return data;
}

export async function assignRoleToUser(userId: number, roleId: number | null): Promise<void> {
  await axiosInstance.post(`/accounts/users/${userId}/assign-role/`, { role_id: roleId }, { skipAuth: true });
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<ManagedUser> {
  const { data } = await axiosInstance.put(`/accounts/users/${userId}/`, payload, { skipAuth: true });
  return data;
}

export async function bulkDeleteUsers(ids: number[]): Promise<void> {
  await axiosInstance.delete('/accounts/users/', { 
    data: { ids },
    skipAuth: true 
  });
}

export async function bulkUpdateUsers(ids: number[], payload: Partial<UpdateUserPayload>): Promise<void> {
  await axiosInstance.patch('/accounts/users/', { 
    ids, 
    ...payload 
  }, { skipAuth: true });
}

// ─── User Access (Per-User Permission Overrides) ──────────────────────────────

export interface UserAccessData {
  role_tabs: string[];
  user_tabs: string[];
  effective_tabs: string[];
}

export async function fetchUserAccess(userId: number): Promise<UserAccessData> {
  const { data } = await axiosInstance.get(`/accounts/users/${userId}/permissions/`, { skipAuth: true });
  return data;
}

export async function updateUserAccess(userId: number, userTabs: string[]): Promise<UserAccessData> {
  const { data } = await axiosInstance.put(
    `/accounts/users/${userId}/permissions/`,
    { user_tabs: userTabs },
    { skipAuth: true }
  );
  return data;
}

export async function resetUserAccess(userId: number): Promise<UserAccessData> {
  const { data } = await axiosInstance.put(
    `/accounts/users/${userId}/permissions/`,
    { action: 'reset' },
    { skipAuth: true }
  );
  return data;
}
