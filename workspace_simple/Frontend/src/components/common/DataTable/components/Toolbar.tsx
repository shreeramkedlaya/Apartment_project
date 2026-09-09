import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, X, List, LayoutGrid, Download, RefreshCw
} from 'lucide-react';
import type { Column, FilterConfig, BulkOperation } from '../types/types';
import Drawer from '@/components/ui/Drawer';

interface ToolbarProps {
  enableSearch?: boolean;
  search: string;
  setSearch: (val: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  activeFilters: Record<string, string>;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  extraToolbarActions?: React.ReactNode;
  filters?: FilterConfig[];
  columns: Column[];
  visibleColumns: Set<string>;
  toggleColumn: (header: string) => void;
  allowToggle?: boolean;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  setUserToggled: (toggled: boolean) => void;
  onRefresh?: () => void;
  isFetching?: boolean;
  
  // Bulk & Export
  selectedRows?: any[];
  bulkOperations?: BulkOperation[];
  exportable?: boolean;
  onExport?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  enableSearch, search, setSearch, searchPlaceholder,
  activeFilterCount, activeFilters, updateFilter, clearFilters,
  extraToolbarActions, filters, columns, visibleColumns, toggleColumn,
  allowToggle, viewMode, setViewMode, setUserToggled,
  onRefresh, isFetching, selectedRows = [], bulkOperations = [],
  exportable, onExport
}) => {
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'columns'>('filters');

  const openSettings = (tab: 'filters' | 'columns' = 'filters') => {
    setActiveTab(tab);
    setSettingsDrawerOpen(true);
  };

  const showAllColumns = () => {
    columns.forEach(col => {
      if (!visibleColumns.has(col.header)) {
        toggleColumn(col.header);
      }
    });
  };

  const hideAllColumns = () => {
    columns.forEach(col => {
      if (visibleColumns.has(col.header)) {
        toggleColumn(col.header);
      }
    });
  };

  // Reset columns logic (assuming all columns are visible by default, or just checking the initial state. For simplicity, make all visible)
  const resetColumns = () => {
    showAllColumns();
  };

  // Contextual Bulk Operations Toolbar
  if (selectedRows.length > 0 && bulkOperations.length > 0) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          {bulkOperations.map((op, i) => {
            const Icon = op.icon;
            const baseClass = "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border";
            const variants = {
              default: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
              destructive: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40",
              outline: "bg-transparent text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            };
            const variantClass = variants[op.variant || 'default'];

            return (
              <button
                key={i}
                onClick={() => op.onClick(selectedRows)}
                className={`${baseClass} ${variantClass}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {op.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {enableSearch && (
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(activeFilters).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1">
                <span className="capitalize">{key}:</span> <strong>{val}</strong>
                <button onClick={() => updateFilter(key, '')} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">Clear all</button>
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {extraToolbarActions}

        {/* Export Button */}
        {exportable && onExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        )}

        {/* Table Settings Button */}
        {(filters && filters.length > 0 || columns.length > 0) && (
          <button
            onClick={() => openSettings('filters')}
            className={`relative flex items-center justify-center p-2 rounded-lg border transition-all ${
              activeFilterCount > 0
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            title="Table Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Table / Grid toggle */}
        {allowToggle && (
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {([['table', List], ['grid', LayoutGrid]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setUserToggled(true); }}
                className={`p-1.5 rounded-md transition-all ${viewMode === mode
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Settings Drawer */}
      <Drawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        hideHeader={true}
        width="md"
      >
        <div className="flex flex-col h-full -mx-6 -mt-6">
          {/* Drawer Header with Tabs */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'filters'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => setActiveTab('columns')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'columns'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Column Settings
              </button>
            </div>
            
            <button
              onClick={() => setSettingsDrawerOpen(false)}
              className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close panel</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'filters' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Reset Filters
                    </button>
                  )}
                </div>
                
                {filters && filters.length > 0 ? (
                  <div className="space-y-4">
                    {filters.map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                        <select
                          value={activeFilters[f.key] ?? ''}
                          onChange={e => updateFilter(f.key, e.target.value)}
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          <option value="">All</option>
                          {f.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No filters available for this view.</p>
                )}
              </div>
            )}

            {activeTab === 'columns' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <button onClick={showAllColumns} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 transition-colors">Show All</button>
                  <button onClick={hideAllColumns} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 transition-colors">Hide All</button>
                  <button onClick={resetColumns} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 transition-colors">Reset</button>
                </div>
                
                <div className="space-y-1">
                  {columns.map(col => {
                    const isVisible = visibleColumns.has(col.header);
                    return (
                      <label
                        key={col.header}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumn(col.header)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{col.header}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Toolbar;
