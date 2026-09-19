import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // --- Column Resizing State ---
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Initialize default widths
  useEffect(() => {
    const initialWidths: Record<string, number> = {};
    displayColumns.forEach((col) => {
      const key = col.sortKey ?? (typeof col.accessor === 'string' ? col.accessor : col.header);
      initialWidths[key] = col.width ?? 150; // Default to 150px
    });
    setColumnWidths(initialWidths);
  }, [displayColumns]);

  const onMouseDown = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colKey);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colKey] || 150;
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingCol) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + delta); // Min width 50px
    setColumnWidths((prev) => ({ ...prev, [resizingCol]: newWidth }));
  }, [resizingCol]);

  const onMouseUp = useCallback(() => {
    setResizingCol(null);
  }, []);

  useEffect(() => {
    if (resizingCol) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingCol, onMouseMove, onMouseUp]);

  const toggleExpandRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full text-sm table-fixed min-w-max">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            {enableSelection && (
              <th className="px-5 py-3 w-12 text-center">
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
              <th className="px-5 py-3 w-12"></th>
            )}
            {hasActions && (
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Actions
              </th>
            )}
            {displayColumns.map((col, i) => {
              const colKey = col.sortKey ?? (typeof col.accessor === 'string' ? col.accessor : col.header);
              const width = columnWidths[colKey] || col.width || 150;
              
              return (
                <th
                  key={i}
                  style={{ width: `${width}px` }}
                  onClick={() => toggleSort(col)}
                  className={`relative px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    col.className ?? ''
                  } ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none' : ''
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      col.className?.includes('text-right') ? 'justify-end' : ''
                    } overflow-hidden`}
                  >
                    <span className="truncate">{col.header}</span>
                    {col.sortable && (
                      <span className="opacity-40 flex-shrink-0">
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
                  {/* Resizer Handle */}
                  <div
                    onMouseDown={(e) => onMouseDown(e, colKey)}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400/50 dark:hover:bg-blue-500/50 transition-colors z-10 ${
                      resizingCol === colKey ? 'bg-blue-500 dark:bg-blue-400' : 'bg-transparent'
                    }`}
                  />
                </th>
              );
            })}
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
                    <td key={j} className={`px-5 py-4 truncate ${col.className ?? ''}`}>
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
