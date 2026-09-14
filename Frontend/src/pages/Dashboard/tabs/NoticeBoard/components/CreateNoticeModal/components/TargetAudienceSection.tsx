import React from 'react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import type { Role } from '@/types/roles.types';
import type { BlockData } from '@/types/auth.types';

interface TargetAudienceSectionProps {
  audienceType: 'everyone' | 'roles' | 'blocks';
  setAudienceType: (val: 'everyone' | 'roles' | 'blocks') => void;
  availableRoles: Role[];
  targetRoles: string[];
  setTargetRoles: (val: string[]) => void;
  availableBlocks: BlockData[];
  targetBlocks: string[];
  setTargetBlocks: (val: string[]) => void;
  targetFlats: string[];
  setTargetFlats: (val: string[]) => void;
}

export const TargetAudienceSection: React.FC<TargetAudienceSectionProps> = ({
  audienceType, setAudienceType,
  availableRoles, targetRoles, setTargetRoles,
  availableBlocks, targetBlocks, setTargetBlocks,
  targetFlats, setTargetFlats
}) => {

  // Prepare Flat Options grouped by block
  const flatOptions = targetBlocks.map(blockName => {
    const block = availableBlocks.find(b => b.name === blockName);
    return {
      group: `Block ${blockName}`,
      items: block?.flats.map(f => ({ value: `${blockName} - ${f.number}`, label: f.number })) || []
    };
  });

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Send Notice To</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'everyone', title: 'Everyone', desc: 'Broadcast to all active members' },
            { id: 'roles', title: 'Specific Roles', desc: 'Target specific staff or resident roles' },
            { id: 'blocks', title: 'Blocks / Flats', desc: 'Target specific buildings or apartments' }
          ].map(type => (
            <div
              key={type.id}
              onClick={() => setAudienceType(type.id as 'everyone' | 'roles' | 'blocks')}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${audienceType === type.id
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${audienceType === type.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {type.title}
                  </span>
                  {audienceType === type.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  {type.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="min-h-[4rem]">
          {audienceType === 'roles' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Roles</label>
              <CustomDropdown
                multiple
                value={targetRoles}
                onChange={setTargetRoles}
                options={availableRoles.map(r => ({ value: r.name, label: r.name }))}
                placeholder="Choose one or more roles..."
              />
            </div>
          )}

          {audienceType === 'blocks' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 z-20">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Blocks</label>
                <CustomDropdown
                  multiple
                  value={targetBlocks}
                  onChange={(val) => {
                    setTargetBlocks(val);
                    // Clear flats that no longer belong to selected blocks
                    setTargetFlats(targetFlats.filter(f => val.some((b: string) => f.startsWith(`${b} - `))));
                  }}
                  options={availableBlocks.map(b => ({ value: b.name, label: b.name }))}
                  placeholder="Choose blocks..."
                />
              </div>

              {targetBlocks.length > 0 && (
                <div className="space-y-1 z-10 animate-in fade-in slide-in-from-left-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Specific Flats (Optional)</label>
                  <CustomDropdown
                    multiple
                    searchable
                    value={targetFlats}
                    onChange={setTargetFlats}
                    options={flatOptions}
                    placeholder="Leave empty to send to all flats in selected blocks"
                  />
                </div>
              )}
            </div>
          )}

          {audienceType === 'everyone' && (
            <div className="animate-in fade-in pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Notice will be broadcasted to all active members of the apartment.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
