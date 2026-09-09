/**
 * pages/admin/UserManagement/EditUserModal.tsx
 * Modal for editing user profile details: name, phone, role, status, and password reset.
 * Roles are lazily loaded on modal open to minimize unnecessary DB reads.
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Lock, Phone, ShieldCheck, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import type { ManagedUser, Role, UpdateUserPayload } from '@/types/roles.types';
import { fetchRoles, updateUser } from '../services/roles.service';

interface EditUserModalProps {
  user: ManagedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSaved }) => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleId, setRoleId] = useState<number | string>('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || user.username || '');
      setPhoneNumber(user.phone_number || '');
      setRoleId(user.role_id ?? '');
      setIsActive(user.is_active ?? true);
      setPassword('');
      setShowPassword(false);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  // Lazy fetch roles only when the modal opens
  useEffect(() => {
    if (isOpen && roles.length === 0) {
      setLoadingRoles(true);
      fetchRoles()
        .then((res) => {
          setRoles(res.results || res.roles || []);
        })
        .catch((err) => {
          console.error('Failed to load roles in EditUserModal:', err);
        })
        .finally(() => {
          setLoadingRoles(false);
        });
    }
  }, [isOpen, roles.length]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload: UpdateUserPayload = {
      name: name.trim(),
      phone_number: phoneNumber.trim() || null,
      role_id: roleId === '' ? null : Number(roleId),
      is_active: isActive,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    try {
      await updateUser(user.id, payload);
      showToast('User updated successfully', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      const msg = err.response?.data?.error || 'Failed to update user. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User: ${user.name || user.username}`}
      description="Update account details, role permissions, or reset security credentials."
      width="small"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        {errorMessage && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* User Type / Role */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Role / User Type
          </label>
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={loadingRoles}
              className="w-full pl-10 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
            >
              <option value="">Resident (No administrative role)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.status !== 'active' ? `(${r.status})` : ''}
                </option>
              ))}
            </select>
            {loadingRoles && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Assigning a role grants the administrative tabs configured under that role.
          </p>
        </div>

        {/* Password Reset (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Reset Password <span className="text-gray-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep existing password"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Account Status Toggle */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Account Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                !isActive
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <XCircle className={`w-4 h-4 ${!isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
              Blocked
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
