import React from 'react';
import ActionMenu from './ActionMenu';
import CellRenderer from './CellRenderer';
import type { Column } from '../types/types';

interface GridViewProps {
  paginated: any[];
  displayColumns: Column[];
  hasActions: boolean;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  extraRowActions?: (row: any) => React.ReactNode;
  isActionDisabled?: (row: any) => boolean;
  renderCard?: (row: any, index: number) => React.ReactNode;
}

const GridView: React.FC<GridViewProps> = ({
  paginated,
  displayColumns,
  hasActions,
  onEdit,
  onDelete,
  extraRowActions,
  isActionDisabled,
  renderCard,
}) => {
  const defaultRenderCard = (row: any, index: number) => {
    const primaryCol = displayColumns[0];
    const otherCols = displayColumns.slice(1);

    return (
      <div
        key={index}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow space-y-3 flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {primaryCol && <CellRenderer col={primaryCol} row={row} />}
            </div>
            {hasActions && (
              <ActionMenu
                row={row}
                onEdit={onEdit}
                onDelete={onDelete}
                extraRowActions={extraRowActions}
                disabled={isActionDisabled?.(row)}
              />
            )}
          </div>

          {otherCols.length > 0 && (
            <div className="pt-2 border-t border-gray-50 dark:border-gray-800/80 space-y-2">
              {otherCols.map((col, cIdx) => (
                <div key={cIdx} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-gray-400 dark:text-gray-500 font-medium">{col.header}</span>
                  <div className="text-gray-700 dark:text-gray-300">
                    <CellRenderer col={col} row={row} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const cardRenderer = renderCard || defaultRenderCard;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginated.map((row, i) => (
        <React.Fragment key={i}>{cardRenderer(row, i)}</React.Fragment>
      ))}
    </div>
  );
};

export default GridView;
