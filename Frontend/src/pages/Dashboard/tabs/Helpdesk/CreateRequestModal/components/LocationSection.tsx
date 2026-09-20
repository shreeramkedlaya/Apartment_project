import React from 'react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import type { BlockData } from '@/types/auth.types';
import type { CreateRequestFormData } from '../types/createRequest.types';
import { GROUPED_COMMON_AREAS } from '../utils/requestConstants';

interface LocationSectionProps {
  formData: CreateRequestFormData;
  blocks: BlockData[];
  onChange: (field: keyof CreateRequestFormData, value: any) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  blocks,
  onChange,
}) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
          Location / Target Area <span className="text-red-500">*</span>
        </span>
        <div className="inline-flex rounded-lg bg-gray-200/80 dark:bg-gray-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onChange('is_flat_specific', true)}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              formData.is_flat_specific
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Flat
          </button>
          <button
            type="button"
            onClick={() => onChange('is_flat_specific', false)}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              !formData.is_flat_specific
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Common Area
          </button>
        </div>
      </div>

      {formData.is_flat_specific ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <CustomDropdown
              label="Block"
              placeholder="Select Block"
              required={formData.is_flat_specific}
              options={blocks.map((b) => ({ value: b.id, label: b.name }))}
              value={formData.block_id}
              onChange={(bId) => {
                const blk = blocks.find((b) => b.id === bId);
                if (blk && blk.flats.length > 0) {
                  onChange('block_id', bId || '');
                  onChange('flat_id', blk.flats[0].id);
                  onChange('flat_number', `${blk.name} - ${blk.flats[0].number}`);
                } else {
                  onChange('block_id', bId || '');
                  onChange('flat_id', '');
                  onChange('flat_number', '');
                }
              }}
            />
          </div>
          <div>
            <CustomDropdown
              label="Flat No"
              placeholder="Select Flat"
              required={formData.is_flat_specific}
              disabled={!formData.block_id}
              options={(blocks.find((b) => b.id === formData.block_id)?.flats || []).map((f) => ({
                value: f.id,
                label: f.number,
              }))}
              value={formData.flat_id}
              onChange={(fId) => {
                const blk = blocks.find((b) => b.id === formData.block_id);
                const flat = blk?.flats.find((f) => f.id === fId);
                if (blk && flat) {
                  onChange('flat_id', fId);
                  onChange('flat_number', `${blk.name} - ${flat.number}`);
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="pt-1">
          <CustomDropdown
            required
            searchable
            searchPlaceholder="Search common facility..."
            options={GROUPED_COMMON_AREAS}
            value={formData.common_area}
            onChange={(area) => onChange('common_area', area)}
          />
        </div>
      )}
    </div>
  );
};

export default LocationSection;
