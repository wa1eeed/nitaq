import * as React from 'react';
import { cn } from '../utils/cn';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  numeric?: boolean;
  width?: string | number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * IBP-aligned data table — same look as the reference.
 *   Container: <Card> shell (rounded-xl border bg-card shadow-sm)
 *   Header:    h-11 px-4 uppercase tracking-wide muted-foreground 12px
 *   Rows:      border-b · hover bg-muted/40
 *   Cells:     p-4 text-sm
 */
export function DataTable<T>({
  data, columns, rowKey, onRowClick, emptyState, loading, toolbar, footer, className,
}: DataTableProps<T>) {
  const container = cn(
    'rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden',
    className,
  );

  if (loading) {
    return (
      <div className={container}>
        {toolbar && <div className="p-4 border-b">{toolbar}</div>}
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={container}>
        {toolbar && <div className="p-4 border-b">{toolbar}</div>}
        <div className="p-12">{emptyState}</div>
      </div>
    );
  }

  return (
    <div className={container}>
      {toolbar && <div className="p-4 border-b">{toolbar}</div>}
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width } : undefined}
                  className={cn(
                    'h-11 px-4 text-start align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap',
                    col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/40',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'p-4 align-middle text-sm',
                      col.numeric && 'num font-medium',
                      col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}
