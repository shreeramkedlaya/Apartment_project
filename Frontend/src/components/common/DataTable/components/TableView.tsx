import React, { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import ActionMenu from './ActionMenu';
import CellRenderer from './CellRenderer';
import type { Column } from '../types/types';

interface TableViewProps {
  paginated: any[];
  displayColumns: Column[];
  hasActions: boolean;
  enableSelection: boolean;
  allSelected: boolean;
  someSelected: boolean;
  selected: Set<number>;
  toggleSelectAll: (checked: boolean) => void;
  toggleSelectRow: (index: number, checked: boolean) => void;
  sortConfig: { key: string; dir: 'asc' | 'desc' } | null;
  toggleSort: (col: Column) => void;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  extraRowActions?: (row: any) => React.ReactNode;
  isActionDisabled?: (row: any) => boolean;
  loading?: boolean;
  pageSize: number;
  emptyMessage: React.ReactNode;
  expandable?: boolean;
  expandComponent?: (row: any) => React.ReactNode;
}

const TableView: React.FC<TableViewProps> = ({
  paginated,
  displayColumns,
  hasActions,
  enableSelection,
  allSelected,
  someSelected,
  selected,
  toggleSelectAll,
  toggleSelectRow,
  sortConfig,
  toggleSort,
  onRowClick,
  onEdit,
  onDelete,
  extraRowActions,
  isActionDisabled,
  loading,
  pageSize,
  emptyMessage,
  expandable,
  expandComponent,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpandRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            {enableSelection && (
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
              </th>
            )}
            {expandable && (
              <th className="px-5 py-3 w-10"></th>
            )}
            {hasActions && (
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                Actions
              </th>
            )}
            {displayColumns.map((col, i) => (
              <th
                key={i}
                onClick={() => toggleSort(col)}
                className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  col.className ?? ''
                } ${
                  col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none' : ''
                }`}
              >
                <div
                  className={`flex items-center gap-1 ${
                    col.className?.includes('text-right') ? 'justify-end' : ''
                  }`}
                >
                  {col.header}
                  {col.sortable && (
                    <span className="opacity-40">
                      {sortConfig?.key === (col.sortKey ?? col.accessor) ? (
                        sortConfig.dir === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
          {loading ? (
            Array.from({ length: pageSize < 6 ? pageSize : 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({
                  length:
                    displayColumns.length +
                    (hasActions ? 1 : 0) +
                    (enableSelection ? 1 : 0) +
                    (expandable ? 1 : 0),
                }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : paginated.length === 0 ? (
            <tr>
              <td
                colSpan={
                  displayColumns.length +
                  (hasActions ? 1 : 0) +
                  (enableSelection ? 1 : 0) +
                  (expandable ? 1 : 0)
                }
                className="px-5 py-20 text-center text-gray-400 dark:text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginated.map((row, i) => (
              <React.Fragment key={i}>
                <tr
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${
                    selected.has(i)
                      ? 'bg-blue-50/40 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {enableSelection && (
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={(e) => toggleSelectRow(i, e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </td>
                  )}
                  {expandable && (
                    <td className="px-5 py-4 w-10 text-gray-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleExpandRow(i); }}>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expandedRows.has(i) ? 'rotate-90 text-blue-600' : ''}`} />
                    </td>
                  )}
                  {hasActions && (
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        row={row}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        extraRowActions={extraRowActions}
                        disabled={isActionDisabled?.(row)}
                      />
                    </td>
                  )}
                  {displayColumns.map((col, j) => (
                    <td key={j} className={`px-5 py-4 ${col.className ?? ''}`}>
                      <CellRenderer col={col} row={row} />
                    </td>
                  ))}
                </tr>
                {expandable && expandedRows.has(i) && expandComponent && (
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td 
                      colSpan={displayColumns.length + (hasActions ? 1 : 0) + (enableSelection ? 1 : 0) + 1} 
                      className="px-5 py-4 border-t border-gray-100 dark:border-gray-800"
                    >
                      {expandComponent(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
