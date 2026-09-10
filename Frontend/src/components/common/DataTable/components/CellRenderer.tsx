import React from "react";
import type { Column } from "../types/types";

interface CellRendererProps {
    col: Column;
    row: any;
}

const CellRenderer: React.FC<CellRendererProps> = ({ col, row }) => {
    const rawValue = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];

    if (col.type === 'custom') {
        return rawValue as React.ReactNode;
    }

    switch (col.type) {
        case 'user': {
            if (!rawValue) return null;
            const name = typeof rawValue === 'object' ? (rawValue.name || rawValue.username || '') : String(rawValue);
            const initial = name ? name.charAt(0).toUpperCase() : '?';
            return (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
                        {initial}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{name}</p>
                    </div>
                </div>
            );
        }
        case 'badge': {
            if (!rawValue) return <span className="text-xs text-gray-400 dark:text-gray-500 italic">None</span>;
            const isObj = typeof rawValue === 'object';
            const key = isObj ? String(rawValue.status) : String(rawValue);
            const labelText = isObj ? String(rawValue.label) : String(rawValue);
            const config = col.badgeConfig?.[key] || { label: labelText, className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' };
            return (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
                    {labelText}
                </span>
            );
        }
        case 'icon-text': {
            const Icon = col.icon;
            if (!rawValue) {
                return <span className="text-gray-300 dark:text-gray-600 italic text-xs">Not set</span>;
            }
            return (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm">
                    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
                    {String(rawValue)}
                </div>
            );
        }
        case 'date': {
            if (!rawValue) return <span className="text-gray-300 dark:text-gray-600 italic text-xs">Not set</span>;
            return (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(rawValue as string | number).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            );
        }
        case 'text':
        default:
            return typeof rawValue === 'object' && !React.isValidElement(rawValue)
                ? JSON.stringify(rawValue)
                : (rawValue as React.ReactNode);
    }
}

export default CellRenderer;