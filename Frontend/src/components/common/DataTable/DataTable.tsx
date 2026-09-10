import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import type { DataTableProps, DataTableRef } from './types/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { useDataTable } from './hooks/useDataTable';
import Toolbar from './components/Toolbar';
import StatsBar from './components/StatsBar';
import Pagination from './components/Pagination';
import GridView from './components/GridView';
import TableView from './components/TableView';

const DataTable = forwardRef<DataTableRef, DataTableProps>(({
  data,
  api,
  deleteApi,
  idKey = 'id',
  columns,
  stats,
  computeStats,
  enableSearch = false,
  searchPlaceholder = 'Search...',
  extraToolbarActions,
  filters,
  onFilterChange,
  defaultVisibleColumns,
  allowToggle = false,
  defaultView = 'table',
  renderCard,
  enableSelection = false,
  onSelectionChange,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onRowClick,
  onEdit,
  onDelete,
  extraRowActions,
  emptyMessage = 'No data available.',
  loading = false,
  isActionDisabled,
  exportable = false,
  onRefresh,
  bulkOperations,
  expandable,
  expandComponent,
}, ref) => {
  const { showToast } = useToast();
  
  // Internal State
  const [tableData, setTableData] = useState<any[]>(data || []);
  const [isFetching, setIsFetching] = useState(false);
  const [backendStats, setBackendStats] = useState<any>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync prop data if api is not used
  useEffect(() => {
    if (!api && data) {
      setTableData(data);
    }
  }, [data, api]);

  const {
    viewMode,
    setViewMode,
    setUserToggled,
    search,
    setSearch,
    sortConfig,
    page,
    setPage,
    pageSize,
    setPageSize,
    selected,
    visibleColumns,
    activeFilters,
    updateFilter,
    clearFilters,
    toggleColumn,
    sorted,
    paginated,
    totalPages,
    allSelected,
    someSelected,
    toggleSort,
    toggleSelectAll,
    toggleSelectRow,
    activeFilterCount,
    displayColumns,
  } = useDataTable({
    data: tableData,
    columns,
    enableSearch,
    defaultVisibleColumns,
    defaultPageSize,
    onFilterChange,
    onSelectionChange,
    defaultView,
    renderCard: !!renderCard,
    serverSide: !!api,
    totalItems,
  });

  const fetchData = async () => {
    if (!api) return;
    try {
      setIsFetching(true);
      const sort = sortConfig 
        ? (sortConfig.dir === 'desc' ? '-' : '') + sortConfig.key 
        : '';
        
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      if (sort && sort.trim()) {
        params.sort = sort.trim();
      }

      const res = await api(params as { page: number; page_size: number; search?: string; sort?: string });
      setTableData(res.results);
      if (res.stats) setBackendStats(res.stats);
      if (res.count !== undefined) setTotalItems(res.count);
    } catch (error) {
      console.error("DataTable fetch error:", error);
      showToast("Failed to fetch data.", "error");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, sortConfig]);

  useImperativeHandle(ref, () => ({
    refresh: fetchData
  }));

  const handleDeleteClick = (row: any) => {
    if (deleteApi) {
      setItemToDelete(row);
    } else if (onDelete) {
      onDelete(row);
    }
  };

  const handleExport = () => {
    if (!tableData.length) {
      showToast("No data to export", "error");
      return;
    }
    
    // Create CSV header
    const visibleCols = columns.filter(c => visibleColumns.has(c.header));
    const headerRow = visibleCols.map(c => `"${c.header}"`).join(',');
    
    // Create CSV rows
    const rows = tableData.map(row => {
      return visibleCols.map(c => {
        let val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor as string];
        if (val === null || val === undefined) val = '';
        // Escape quotes
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });
    
    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (!deleteApi || !itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteApi(itemToDelete[idKey]);
      showToast('Item deleted successfully', 'success');
      await fetchData();
    } catch (error) {
      console.error("DataTable delete error:", error);
      showToast('Failed to delete item. It might be in use.', 'error');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };


  const hasActions = !!(onEdit || onDelete || deleteApi || extraRowActions);

  return (
    <div className="space-y-4">
      {(stats || computeStats) && <StatsBar stats={computeStats ? computeStats(tableData, backendStats) : stats} />}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <Toolbar
          enableSearch={enableSearch}
          search={search}
          setSearch={setSearch}
          searchPlaceholder={searchPlaceholder}
          activeFilterCount={activeFilterCount}
          activeFilters={activeFilters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          extraToolbarActions={extraToolbarActions}
          filters={filters}
          columns={columns}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          allowToggle={allowToggle}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setUserToggled={setUserToggled}
          onRefresh={onRefresh || (api ? fetchData : undefined)}
          isFetching={isFetching}
          selectedRows={Array.from(selected).map(i => paginated[i])}
          bulkOperations={bulkOperations}
          exportable={exportable}
          onExport={handleExport}
        />

        {viewMode === 'grid' ? (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50">
            {loading || isFetching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              <GridView
                paginated={paginated}
                displayColumns={displayColumns}
                hasActions={hasActions}
                onEdit={onEdit}
                onDelete={onDelete || deleteApi ? handleDeleteClick : undefined}
                extraRowActions={extraRowActions}
                isActionDisabled={isActionDisabled}
                renderCard={renderCard}
              />
            )}
          </div>
        ) : (
          <TableView
            paginated={paginated}
            displayColumns={displayColumns}
            hasActions={hasActions}
            enableSelection={enableSelection}
            allSelected={allSelected}
            someSelected={someSelected}
            selected={selected}
            toggleSelectAll={toggleSelectAll}
            toggleSelectRow={toggleSelectRow}
            sortConfig={sortConfig}
            toggleSort={toggleSort}
            onRowClick={onRowClick}
            onEdit={onEdit}
            onDelete={onDelete || deleteApi ? handleDeleteClick : undefined}
            extraRowActions={extraRowActions}
            isActionDisabled={isActionDisabled}
            loading={loading || isFetching}
            pageSize={pageSize}
            emptyMessage={emptyMessage}
            expandable={expandable}
            expandComponent={expandComponent}
          />
        )}

        {(sorted.length > 0 || (!!api && totalItems > 0)) && (
          <Pagination
            sortedLength={api ? totalItems : sorted.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            pageSizeOptions={pageSizeOptions}
            totalPages={totalPages}
          />
        )}
      </div>
      
      {/* Built-in Delete Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setItemToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
});

export default DataTable;