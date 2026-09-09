import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Column } from '../types/types';

interface UseDataTableProps {
  data: any[];
  columns: Column[];
  enableSearch?: boolean;
  defaultVisibleColumns?: string[];
  defaultPageSize?: number;
  onFilterChange?: (activeFilters: Record<string, string>) => void;
  onSelectionChange?: (rows: any[]) => void;
  defaultView?: 'table' | 'grid';
  renderCard?: boolean;
  serverSide?: boolean;
  totalItems?: number;
}

export function useDataTable({
  data,
  columns,
  enableSearch,
  defaultVisibleColumns,
  defaultPageSize = 10,
  onFilterChange,
  onSelectionChange,
  defaultView = 'table',
  renderCard = false,
  serverSide = false,
  totalItems = 0,
}: UseDataTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(defaultView);
  const [userToggled, setUserToggled] = useState(false);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Column visibility ──
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(defaultVisibleColumns || columns.map(c => c.header))
  );

  // ── Active filters ──
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

  // Sync visible columns when column definitions change
  useEffect(() => {
    if (!defaultVisibleColumns) {
      setVisibleColumns(new Set(columns.map(c => c.header)));
    }
  }, [columns.map(c => c.header).join(','), defaultVisibleColumns]);

  const toggleColumn = useCallback((header: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(header)) {
        if (next.size === 1) return prev; // keep at least one visible
        next.delete(header);
      } else {
        next.add(header);
      }
      return next;
    });
  }, []);

  const updateFilter = useCallback((key: string, value: string) => {
    setActiveFilters(prev => {
      const next = value ? { ...prev, [key]: value } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key));
      onFilterChangeRef.current?.(next);
      return next;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    onFilterChangeRef.current?.({});
    setPage(1);
  }, []);

  // Responsive: auto-switch to grid on mobile
  useEffect(() => {
    if (!renderCard || userToggled) return;
    const check = () => {
      setViewMode(window.innerWidth < 768 ? 'grid' : defaultView);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [renderCard, defaultView, userToggled]);

  // Reset page on search
  useEffect(() => { setPage(1); }, [search]);

  // ── Filter by active filter values (applied on top of search) ──
  const filtered = useMemo(() => {
    if (serverSide) return data;
    let result = data;
    if (enableSearch && search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row as Record<string, unknown>).some(v =>
          v !== null && v !== undefined && String(v).toLowerCase().includes(q)
        )
      );
    }
    // Apply column filters
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
      result = result.filter(row => String(row[key] ?? '').toLowerCase() === val.toLowerCase());
    });
    return result;
  }, [data, search, enableSearch, activeFilters, serverSide]);

  // ── Sort ──
  const sorted = useMemo(() => {
    if (serverSide) return filtered;
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortConfig.key], bv = b[sortConfig.key];
      if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig, serverSide]);

  // ── Paginate ──
  const totalPages = serverSide ? Math.max(1, Math.ceil(totalItems / pageSize)) : Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    if (serverSide) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize, serverSide]);

  // ── Selection ──
  const allSelected = paginated.length > 0 && paginated.every((_, i) => selected.has(i));
  const someSelected = paginated.some((_, i) => selected.has(i)) && !allSelected;

  const onSelectionRef = useRef(onSelectionChange);
  useEffect(() => { onSelectionRef.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => {
    if (onSelectionRef.current) {
      onSelectionRef.current(Array.from(selected).map(i => sorted[i]));
    }
  }, [selected, sorted]);

  const toggleSort = useCallback((col: Column) => {
    if (!col.sortable) return;
    const key = col.sortKey ?? (typeof col.accessor === 'string' ? col.accessor : null);
    if (!key) return;
    setSortConfig(c => {
      if (c?.key === key) return c.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  }, []);

  const toggleSelectAll = useCallback((checked: boolean) => {
    const next = new Set(selected);
    paginated.forEach((_, i) => checked ? next.add(i) : next.delete(i));
    setSelected(next);
  }, [selected, paginated]);

  const toggleSelectRow = useCallback((index: number, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(index) : next.delete(index);
    setSelected(next);
  }, [selected]);

  return {
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
    activeFilterCount: Object.keys(activeFilters).length,
    displayColumns: columns.filter(c => visibleColumns.has(c.header))
  };
}
