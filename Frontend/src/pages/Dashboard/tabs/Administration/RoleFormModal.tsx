/**
 * pages/admin/RoleFormModal.tsx
 * Slide-in modal for creating and editing roles.
 * Includes permission tree checkboxes and a live preview panel.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Role, CreateRolePayload, PermissionNode, RoleStatus } from '@/types/roles.types';
import { createRole, updateRole, fetchPermissionsTree } from './services/roles.service';

interface Props {
  role: Role | null;       // null = create mode, non-null = edit mode
  onSaved: () => void;
  onClose: () => void;
}

// ─── Permission Tree Node ─────────────────────────────────────────────────────

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

function PermissionNodeRow({
  node, selected, onChange, depth = 0,
}: {
  node: PermissionNode;
  selected: Set<string>;
  onChange: (id: string, checked: boolean, childIds: string[]) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const childIds = node.children ? getAllIds(node.children) : [];
  const allChildSelected = childIds.length > 0 && childIds.every(id => selected.has(id));
  const someChildSelected = childIds.some(id => selected.has(id));
  const isChecked = selected.has(node.id);
  const isIndeterminate = !isChecked && someChildSelected;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 dark:border-gray-700 relative" : ""}>
      {depth > 0 && <div className="absolute top-[1.125rem] left-0 w-3 border-t border-gray-200 dark:border-gray-700" />}
      <div
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${depth > 0 ? 'ml-3' : ''}`}
      >
        {node.children && node.children.length > 0 ? (
          <button onClick={() => setOpen(o => !o)} className="text-gray-400 dark:text-gray-500 shrink-0 z-10 bg-transparent">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        <input
          type="checkbox"
          id={`perm-${node.id}`}
          checked={isChecked || allChildSelected}
          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
          onChange={e => onChange(node.id, e.target.checked, childIds)}
          className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
        />
        <label htmlFor={`perm-${node.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          {node.name}
        </label>
      </div>
      {open && node.children && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <PermissionNodeRow
              key={child.id}
              node={child}
              selected={selected}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function RoleFormModal({ role, onSaved, onClose }: Props) {
  const isEditing = !!role;

  const [name, setName] = useState(role?.name ?? '');
  const [code, setCode] = useState(role?.code ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [statusVal, setStatusVal] = useState<RoleStatus>(role?.status ?? 'draft');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(role?.permission_tabs ?? [])
  );

  const [permTree, setPermTree] = useState<PermissionNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate code slug from name
  useEffect(() => {
    setCode(name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  }, [name, isEditing]);

  // Load permissions tree
  useEffect(() => {
    fetchPermissionsTree()
      .then(setPermTree)
      .catch(() => setError('Failed to load permissions tree.'))
      .finally(() => setTreeLoading(false));
  }, []);

  const handlePermChange = useCallback((id: string, checked: boolean, childIds: string[]) => {
    setSelectedPerms(prev => {
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

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Role name is required.'); return; }
    setSaving(true);
    setError('');

    const payload: CreateRolePayload = {
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim(),
      status: statusVal,
      permission_tabs: Array.from(selectedPerms),
    };

    try {
      if (isEditing) {
        await updateRole(role.id, payload);
      } else {
        await createRole(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allIds = getAllIds(permTree);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedPerms.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPerms(new Set());
    } else {
      setSelectedPerms(new Set(allIds));
    }
  };

  const modalFooter = (
    <>
      <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEditing ? 'Save Changes' : 'Create Role'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Role' : 'Create New Role'}
      description={isEditing ? `Editing "${role.name}"` : 'Define a new role with specific permissions.'}
      footer={modalFooter}
      maxWidth="3xl"
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Basic Information</h3>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Name & Code */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Maintenance Manager"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 ml-1">
                Identifier: <span className="font-mono text-gray-500 dark:text-gray-400">{code || 'auto_generated'}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg inline-flex">
                {(['active', 'inactive', 'draft'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusVal(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${statusVal === s
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Description */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 500))}
              placeholder="Describe the role's purpose and responsibilities..."
              className="w-full h-[124px] px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{description.length}/500</p>
          </div>
        </div>
      </section>

      {/* Permissions */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Permissions</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-blue-600">{selectedPerms.size} selected</span>
            <button onClick={toggleAll} className="text-blue-600 hover:underline font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
        {treeLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading permissions...
          </div>
        ) : (
          <div className="space-y-1">
            {permTree.map(node => (
              <PermissionNodeRow
                key={node.id}
                node={node}
                selected={selectedPerms}
                onChange={handlePermChange}
              />
            ))}
          </div>
        )}
      </section>
    </Modal>
  );
}
