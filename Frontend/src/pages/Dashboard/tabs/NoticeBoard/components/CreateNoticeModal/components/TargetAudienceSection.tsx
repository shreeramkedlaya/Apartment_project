import React from 'react';
import { XCircle } from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import type { Role } from '@/types/roles.types';
import type { BlockData } from '@/types/auth.types';

interface TargetAudienceSectionProps {
  availableRoles: Role[];
  targetRoles: string[];
  handleRoleToggle: (role: string) => void;
  availableBlocks: BlockData[];
  targetBlocks: string[];
  handleBlockToggle: (block: string) => void;
  selectedBlockForFlats: string;
  setSelectedBlockForFlats: (val: string) => void;
  selectedFlatInput: string;
  setSelectedFlatInput: (val: string) => void;
  targetFlats: string[];
  handleAddFlat: () => void;
  handleRemoveFlat: (flat: string) => void;
}

export const TargetAudienceSection: React.FC<TargetAudienceSectionProps> = ({
  availableRoles, targetRoles, handleRoleToggle,
  availableBlocks, targetBlocks, handleBlockToggle,
  selectedBlockForFlats, setSelectedBlockForFlats,
  selectedFlatInput, setSelectedFlatInput,
  targetFlats, handleAddFlat, handleRemoveFlat
}) => {
  return (
    <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
      <div>
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">2. Target Audience</h3>
        <p className="text-[11px] text-gray-400">Leave all blank to broadcast to everyone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Target Roles</label>
          <div className="flex flex-wrap gap-1.5">
            {availableRoles.map(role => (
              <button
                type="button"
                key={role.id}
                onClick={() => handleRoleToggle(role.name)}
                className={`px-2.5 py-1 text-xs rounded-lg border capitalize transition-colors ${targetRoles.includes(role.name)
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-medium'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Target Blocks</label>
          <div className="flex flex-wrap gap-1.5">
            {availableBlocks.map(block => (
              <button
                type="button"
                key={block.id}
                onClick={() => handleBlockToggle(block.name)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${targetBlocks.includes(block.name)
                  ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-medium'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
              >
                {block.name}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Target Specific Flats</label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <CustomDropdown
                value={selectedBlockForFlats}
                onChange={(val) => {
                  setSelectedBlockForFlats(val);
                  setSelectedFlatInput('');
                }}
                options={availableBlocks.map(b => ({ value: b.name, label: b.name }))}
                placeholder="Select Block..."
              />
            </div>

            <div className="flex-1">
              <CustomDropdown
                value={selectedFlatInput}
                onChange={setSelectedFlatInput}
                options={(availableBlocks.find(b => b.name === selectedBlockForFlats)?.flats || []).map(f => ({ value: f.number, label: f.number }))}
                placeholder="Select Flat..."
                disabled={!selectedBlockForFlats}
              />
            </div>

            <button
              type="button"
              onClick={handleAddFlat}
              disabled={!selectedBlockForFlats || !selectedFlatInput}
              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40
              dark:text-blue-400 dark:hover:bg-blue-900/60 font-medium rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>

          {targetFlats.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 pt-1">
              {targetFlats.map(flat => (
                <span key={flat} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs
                font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                rounded-lg border border-gray-200 dark:border-gray-700">
                  {flat}
                  <button type="button" onClick={() => handleRemoveFlat(flat)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
