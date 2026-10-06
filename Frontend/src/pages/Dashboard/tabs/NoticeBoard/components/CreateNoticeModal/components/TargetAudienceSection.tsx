import React from 'react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import type { Role } from '@/types/roles.types';
import type { BlockData } from '@/types/auth.types';
import type { NoticeFormData } from '../types/noticeForm.types';
import { AUDIENCE_TYPES } from '../utils/noticeConstants';

interface TargetAudienceSectionProps {
  formData: NoticeFormData;
  updateField: <K extends keyof NoticeFormData>(key: K, value: NoticeFormData[K]) => void;
  setFormData: React.Dispatch<React.SetStateAction<NoticeFormData>>;
  availableRoles: Role[];
  availableBlocks: BlockData[];
}

const TargetAudienceSection: React.FC<TargetAudienceSectionProps> = ({
  formData,
  updateField,
  setFormData,
  availableRoles,
  availableBlocks,
}) => {
  // Prepare Flat Options grouped by block
  const flatOptions = formData.targetBlocks.map(blockName => {
    const block = availableBlocks.find(b => b.name === blockName);
    return {
      group: `${blockName}`,
      items: block?.flats.map(f => ({ value: `${blockName} - ${f.number}`, label: f.number })) || []
    };
  });

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Send Notice To</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {AUDIENCE_TYPES.map(type => (
            <div
              key={type.id}
              onClick={() => updateField('audienceType', type.id as 'everyone' | 'roles' | 'blocks')}
              className={`
                relative p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${formData.audienceType === type.id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700/70 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${formData.audienceType === type.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {type.title}
                  </span>
                  {formData.audienceType === type.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {type.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="min-h-[4rem]">
          {formData.audienceType === 'roles' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Role(s)</label>
              <CustomDropdown
                multiple
                clearable
                value={formData.targetRoles}
                onChange={(val: string[]) => updateField('targetRoles', val)}
                options={availableRoles.map(r => ({ value: r.name, label: r.name }))}
                placeholder="Choose one or more roles..."
              />
            </div>
          )}

          {formData.audienceType === 'blocks' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 z-20">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Block(s)</label>
                <CustomDropdown
                  multiple
                  clearable
                  value={formData.targetBlocks}
                  onChange={(val: string[]) => {
                    setFormData(prev => ({
                      ...prev,
                      targetBlocks: val,
                      targetFlats: prev.targetFlats.filter(f => val.some((b: string) => f.startsWith(`${b} - `)))
                    }));
                  }}
                  options={availableBlocks.map(b => ({ value: b.name, label: b.name }))}
                  placeholder="Choose blocks..."
                />
              </div>

              {formData.targetBlocks.length > 0 && (
                <div className="space-y-1 z-10 animate-in fade-in slide-in-from-left-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Flat(s) (Optional)</label>
                  <CustomDropdown
                    multiple
                    clearable
                    searchable
                    value={formData.targetFlats}
                    onChange={(val: string[]) => updateField('targetFlats', val)}
                    options={flatOptions}
                    placeholder="Leave empty to send to all flats"
                  />
                </div>
              )}
            </div>
          )}

          {formData.audienceType === 'everyone' && (
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

export default TargetAudienceSection;