import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const ActionMenu = ({
    row, onEdit, onDelete, extraRowActions, disabled
}: {
    row: any;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    extraRowActions?: (row: any) => React.ReactNode;
    disabled?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, right: 0, align: 'right' as 'left' | 'right' });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const openMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = triggerRef.current!.getBoundingClientRect();
        const isLeftHalf = rect.left < window.innerWidth / 2;

        setPos({
            top: rect.bottom + 4,
            left: isLeftHalf ? rect.left : 0,
            right: isLeftHalf ? 0 : window.innerWidth - rect.right,
            align: isLeftHalf ? 'left' : 'right'
        });
        setOpen(true);
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                onClick={openMenu}
                disabled={disabled}
                className={`p-1.5 rounded-lg transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && !disabled && createPortal(
                // Fixed-position menu rendered outside table overflow
                <div
                    ref={menuRef}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling up to the row in the React tree
                        setOpen(false);
                    }}
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        ...(pos.align === 'left' ? { left: pos.left } : { right: pos.right }),
                        zIndex: 99999
                    }}
                    className="w-40 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl py-1 overflow-hidden flex flex-col"
                >
                    {onEdit && (
                        <button
                            onClick={() => onEdit(row)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(row)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    )}
                    {extraRowActions && extraRowActions(row)}
                </div>,
                document.body
            )}
        </>
    );
}

export default ActionMenu