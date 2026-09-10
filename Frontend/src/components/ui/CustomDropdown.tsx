import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface DropdownGroup {
  group: string;
  items: (DropdownOption | string | number)[];
}

export type CustomDropdownOption = DropdownOption | string | number | DropdownGroup;

export interface CustomDropdownProps {
  options: CustomDropdownOption[];
  value?: string | number | (string | number)[];
  onChange: (value: any) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  className?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

type NormalizedOption = DropdownOption | { group: string; items: DropdownOption[] };

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search...',
  multiple = false,
  clearable = false,
  disabled = false,
  required = false,
  label,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to DropdownOption or NormalizedGroup objects
  const normalizedOptions: NormalizedOption[] = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    if ('group' in opt) {
      return {
        group: opt.group,
        items: opt.items.map((item) =>
          typeof item === 'string' || typeof item === 'number'
            ? { value: item, label: String(item) }
            : item
        ),
      };
    }
    return opt;
  });

  // Flat list for value lookup
  const allFlatOptions = normalizedOptions.flatMap((opt) =>
    'group' in opt ? opt.items : [opt]
  );

  // Filter options based on search query
  const filteredOptions = normalizedOptions.reduce<NormalizedOption[]>((acc, opt) => {
    if ('group' in opt) {
      const filteredItems = opt.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.subLabel && item.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      if (filteredItems.length > 0) {
        acc.push({ group: opt.group, items: filteredItems });
      }
    } else {
      if (
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        acc.push(opt);
      }
    }
    return acc;
  }, []);

  // Calculate precise fixed coordinates & flip logic
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;

    // Minimum comfortable dropdown height
    const preferredHeight = 220;
    const shouldFlip = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

    const placement: 'bottom' | 'top' = shouldFlip ? 'top' : 'bottom';
    const availableSpace = shouldFlip ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(preferredHeight, Math.max(availableSpace - 10, 100));

    // Keep horizontally within viewport bounds with 8px margin
    let left = rect.left;
    if (left + rect.width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - rect.width - 8);
    }

    setPosition({
      top: shouldFlip ? rect.top - 4 : rect.bottom + 4,
      left,
      width: rect.width,
      maxHeight,
      placement,
    });
  }, []);

  // Update position on open, scroll, or resize
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside & Escape key handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle single / multiple selection
  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const index = currentValues.indexOf(optionValue);
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(optionValue);
      }
      onChange(currentValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const isSelected = (optionValue: string | number) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const renderTriggerContent = () => {
    if (multiple) {
      const selectedList = allFlatOptions.filter((opt) =>
        Array.isArray(value) && value.includes(opt.value)
      );

      if (selectedList.length === 0) {
        return <span className="text-gray-400 dark:text-gray-500 text-sm select-none">{placeholder}</span>;
      }

      return (
        <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)]">
          {selectedList.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/60 font-medium"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className="hover:text-blue-900 dark:hover:text-blue-100 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      );
    }

    const selectedOption = allFlatOptions.find((opt) => opt.value === value);
    if (!selectedOption) {
      return <span className="text-gray-400 dark:text-gray-500 text-sm select-none">{placeholder}</span>;
    }

    const Icon = selectedOption.icon;
    return (
      <div className="flex items-center gap-2 truncate text-sm text-gray-900 dark:text-white font-medium">
        {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />}
        <span className="truncate">{selectedOption.label}</span>
      </div>
    );
  };

  const renderOptionItem = (opt: DropdownOption) => {
    const selected = isSelected(opt.value);
    const Icon = opt.icon;

    return (
      <button
        key={opt.value}
        type="button"
        disabled={opt.disabled}
        onClick={() => handleSelect(opt.value)}
        className={`w-full px-3 py-2 text-left rounded-lg text-sm flex items-center justify-between gap-2 transition-all ${
          opt.disabled
            ? 'opacity-40 cursor-not-allowed'
            : selected
            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {multiple && (
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              {selected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          )}
          {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
          <div className="flex flex-col min-w-0">
            <span className="truncate">{opt.label}</span>
            {opt.subLabel && (
              <span className="text-[11px] text-gray-400 font-normal">{opt.subLabel}</span>
            )}
          </div>
        </div>

        {!multiple && selected && (
          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[42px] px-3.5 py-2.5 text-left bg-white dark:bg-gray-900 border rounded-xl flex items-center justify-between gap-2 transition-all outline-none shadow-xs select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : error
            ? 'border-red-500 ring-2 ring-red-500/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex-1 truncate">{renderTriggerContent()}</div>

        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {clearable && value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(multiple ? [] : '');
              }}
              className="p-1 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Portaled Dropdown Menu */}
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: position.placement === 'bottom' ? `${position.top}px` : 'auto',
              bottom:
                position.placement === 'top'
                  ? `${window.innerHeight - position.top}px`
                  : 'auto',
              left: `${position.left}px`,
              width: `${position.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10 flex flex-col"
          >
            {/* Search Box */}
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex-shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Options List with Dynamic MaxHeight */}
            <div
              style={{ maxHeight: `${position.maxHeight}px` }}
              className="overflow-y-auto p-1.5 space-y-0.5"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400">No options found</div>
              ) : (
                filteredOptions.map((opt, i) => {
                  if ('group' in opt) {
                    return (
                      <div key={opt.group} className={i !== 0 ? 'mt-1 pt-1 border-t border-gray-100 dark:border-gray-800' : ''}>
                        <div className="px-3 py-1.5 mb-1 text-[11px] font-bold tracking-wider text-gray-600 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800/80 rounded-md">
                          {opt.group}
                        </div>
                        <div className="space-y-0.5 pl-1">
                          {opt.items.map((item) => renderOptionItem(item))}
                        </div>
                      </div>
                    );
                  }
                  return renderOptionItem(opt);
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomDropdown;
