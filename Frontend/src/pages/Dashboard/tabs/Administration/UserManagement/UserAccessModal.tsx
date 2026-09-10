/**
 * UserManagement/UserAccessModal.tsx
 *
 * Full-permission-tree modal for granting per-user overrides on top of their Role.
 * - Role-inherited tabs show a "via Role" badge (informational only, fully toggleable).
 * - Saving replaces UserProfile.permission_tabs; effective = role_tabs UNION user_tabs.
 * - "Reset to Role Default" clears user_tabs entirely (next login = role only).
 */

import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import type { ManagedUser, PermissionNode } from '@/types/roles.types';
import {
  fetchPermissionsTree,
  fetchUserAccess,
  updateUserAccess,
  resetUserAccess,
} from '../services/roles.service';

interface UserAccessModalProps {
  user: ManagedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getAllIds(nodes: PermissionNode[]): string[] {
  const ids: string[] = [];
  const collect = (n: PermissionNode[]) => {
    for (const node of n) {
      ids.push(node.id);
      if (node.children) collect(node.children);
    }
  };
  collect(nodes);
  return ids;
}

// ─── Permission Node Row ──────────────────────────────────────────────────────

interface PermissionNodeRowProps {
  node: PermissionNode;
  selected: Set<string>;
  roleTabs: Set<string>;
  onChange: (id: string, checked: boolean, childIds: string[]) => void;
  depth?: number;
  expandAll?: boolean;
}

const PermissionNodeRow: React.FC<PermissionNodeRowProps> = ({
  node, selected, roleTabs, onChange, depth = 0, expandAll,
}) => {
  const [open, setOpen] = useState(depth < 1);

  // Sync open state when expandAll changes
  useEffect(() => {
    if (expandAll !== undefined) setOpen(expandAll);
  }, [expandAll]);
  const childIds = node.children ? getAllIds(node.children) : [];
  const allChildSelected = childIds.length > 0 && childIds.every(id => selected.has(id));
  const someChildSelected = childIds.some(id => selected.has(id));
  const isChecked = selected.has(node.id);
  const isIndeterminate = !isChecked && someChildSelected;
  const fromRole = roleTabs.has(node.id);

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-gray-200 dark:border-gray-700 relative' : ''}>
      {depth > 0 && <div className="absolute top-[1.125rem] left-0 w-3 border-t border-gray-200 dark:border-gray-700" />}
      <div className={`flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${depth > 0 ? 'ml-3' : ''}`}>
        {node.children && node.children.length > 0 ? (
          <button onClick={() => setOpen(o => !o)} className="text-gray-400 dark:text-gray-500 shrink-0 z-10 bg-transparent">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        <input
          type="checkbox"
          id={`ua-perm-${node.id}`}
          checked={isChecked || allChildSelected}
          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
          onChange={e => onChange(node.id, e.target.checked, childIds)}
          className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
        />
        <label htmlFor={`ua-perm-${node.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-2">
          {node.name}
          {fromRole && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
              via Role
            </span>
          )}
        </label>
      </div>
      {open && node.children && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <PermissionNodeRow
              key={child.id}
              node={child}
              selected={selected}
              roleTabs={roleTabs}
              onChange={onChange}
              depth={depth + 1}
              expandAll={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const UserAccessModal: React.FC<UserAccessModalProps> = ({ user, isOpen, onClose, onSaved }) => {
  const { showToast } = useToast();

  const [permTree, setPermTree] = useState<PermissionNode[]>([]);
  const [roleTabs, setRoleTabs] = useState<Set<string>>(new Set());
  // selected = the full set of what we want to show checked (role tabs + user overrides)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setError('');

    Promise.all([fetchPermissionsTree(), fetchUserAccess(user.id)])
      .then(([tree, access]) => {
        setPermTree(tree);
        const rt = new Set(access.role_tabs);
        setRoleTabs(rt);
        // Pre-select the full effective set (role + user) so everything already granted shows checked
        setSelected(new Set(access.effective_tabs));
      })
      .catch(() => setError('Failed to load permissions. Please try again.'))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const handlePermChange = useCallback((id: string, checked: boolean, childIds: string[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
        childIds.forEach(c => next.add(c));
      } else {
        next.delete(id);
        childIds.forEach(c => next.delete(c));
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      // We only persist the delta: what is selected minus what role already provides.
      // This keeps UserProfile.permission_tabs clean (only true overrides).
      const userOnlyTabs = [...selected].filter(t => !roleTabs.has(t));
      await updateUserAccess(user.id, userOnlyTabs);
      showToast(`Access updated for ${user.name || user.username}`, 'success');
      onSaved();
      onClose();
    } catch {
      const msg = 'Failed to save. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    setError('');
    try {
      const result = await resetUserAccess(user.id);
      // Revert selected to role tabs only
      setSelected(new Set(result.role_tabs));
      showToast('Reset to role defaults successfully', 'success');
    } catch {
      showToast('Reset failed. Please try again.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const allIds = useMemo(() => getAllIds(permTree), [permTree]);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      // When deselecting all, keep role tabs (they are still inherited — just show them)
      setSelected(new Set(roleTabs));
    } else {
      setSelected(new Set(allIds));
    }
  };

  // Count user-specific extras (on top of role)
  const extraCount = [...selected].filter(t => !roleTabs.has(t)).length;

  const footer = (
    <>
      <button
        onClick={handleReset}
        disabled={resetting || saving}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl transition-colors disabled:opacity-50"
      >
        {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        Reset to Role Default
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Access
        </button>
      </div>
    </>
  );

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Access: ${user.name || user.username}`}
      description="Select the permissions this user can access. Role-inherited permissions are marked with 'via Role'. Changes take effect on the user's next login."
      footer={footer}
      maxWidth="2xl"
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight">{roleTabs.size}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">from Role</span>
          </div>
        </div>
        <div className="text-gray-200 dark:text-gray-700">|</div>
        <div className="flex flex-col">
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm leading-tight">+{extraCount}</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">extra overrides</span>
        </div>
        <div className="text-gray-200 dark:text-gray-700">|</div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight">{selected.size}</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">total effective</span>
        </div>
        <button onClick={toggleAll} className="ml-auto text-xs text-blue-600 hover:underline font-medium">
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Permission Tree */}
      <div className="bg-gray-50/60 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
        {/* Top controls row inside tree */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <span>ℹ️</span>
            <span>Changes take effect on the user's <span className="font-medium">next login</span>.</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandAll(v => v === false ? true : false)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {expandAll === false ? 'Expand All' : 'Collapse All'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading permissions...
          </div>
        ) : (
          <div className="space-y-1">
            {permTree.map(node => (
              <PermissionNodeRow
                key={node.id}
                node={node}
                selected={selected}
                roleTabs={roleTabs}
                onChange={handlePermChange}
                expandAll={expandAll}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserAccessModal;
