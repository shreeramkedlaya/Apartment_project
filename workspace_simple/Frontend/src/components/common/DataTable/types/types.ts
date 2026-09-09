// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'user' | 'badge' | 'icon-text' | 'date' | 'custom';

export interface Column {
    header: string;
    accessor: string | ((row: any) => any);
    type?: ColumnType;
    sortKey?: string;
    className?: string;
    sortable?: boolean;
    icon?: React.ElementType;
    badgeConfig?: Record<string, { label: string; className: string }>;
}

export interface StatItem {
    label: string;
    value: number | string;
    icon?: React.ElementType;
    color?: string;
    bg?: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: string[];
}

export interface BulkOperation {
    label: string;
    icon?: React.ElementType;
    variant?: 'default' | 'destructive' | 'outline';
    onClick: (selectedRows: any[]) => void;
}

export interface DataTableProps {
    data?: any[];
    
    // Async Data Management
    api?: (params: { page: number; page_size: number; search?: string; sort?: string; [key: string]: any }) => Promise<{ results: any[]; count: number; stats?: any }>;
    deleteApi?: (id: string | number) => Promise<any>;
    idKey?: string; // Default: 'id'

    columns: Column[];

    // Stats bar
    stats?: StatItem[];
    computeStats?: (data: any[], backendStats?: any) => StatItem[];

    // Toolbar
    enableSearch?: boolean;
    searchPlaceholder?: string;
    extraToolbarActions?: React.ReactNode;
    filters?: FilterConfig[];
    onFilterChange?: (activeFilters: Record<string, string>) => void;
    defaultVisibleColumns?: string[];
    onRefresh?: () => void;
    exportable?: boolean;

    // View toggle
    allowToggle?: boolean;
    defaultView?: 'table' | 'grid';
    renderCard?: (row: any, index?: number) => React.ReactNode;

    // Selection & Bulk
    enableSelection?: boolean;
    onSelectionChange?: (rows: any[]) => void;
    bulkOperations?: BulkOperation[];

    // Pagination
    defaultPageSize?: number;
    pageSizeOptions?: number[];

    // Row interactions
    onRowClick?: (row: any) => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    extraRowActions?: (row: any) => React.ReactNode;
    
    // Expandable Rows
    expandable?: boolean;
    expandComponent?: (row: any) => React.ReactNode;

    // Empty state
    emptyMessage?: React.ReactNode;

    loading?: boolean;

    // Row-level action configuration
    isActionDisabled?: (row: any) => boolean;
}

export interface DataTableRef {
    refresh: () => Promise<void>;
}