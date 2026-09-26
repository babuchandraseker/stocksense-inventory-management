import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (key: string | number, selected: boolean) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  selectable = false,
  selectedKeys = new Set(),
  onSelectAll,
  onSelectRow,
  pagination,
  emptyMessage = 'No records found',
  className = '',
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((item) => selectedKeys.has(keyExtractor(item)));
  const someSelected = data.some((item) => selectedKeys.has(keyExtractor(item))) && !allSelected;

  return (
    <div className={`bg-white rounded-2xl border border-brand-border shadow-warm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border bg-brand-cream/40 text-xs font-semibold text-brand-textMuted uppercase tracking-wider">
              {selectable && (
                <th className="py-3.5 pl-6 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border text-brand-caramel focus:ring-brand-caramel accent-brand-caramel cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-3.5 px-4 text-${col.align || 'left'} font-semibold`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60 text-sm">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {selectable && <td className="py-4 pl-6 pr-3"><div className="h-4 w-4 bg-brand-cream rounded" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="py-4 px-4">
                      <div className="h-4 bg-brand-cream rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-brand-textMuted text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item);
                const isSelected = selectedKeys.has(key);

                return (
                  <tr
                    key={key}
                    className={`
                      hover:bg-brand-cream/30 transition-colors duration-150
                      ${isSelected ? 'bg-brand-caramelLight/30' : ''}
                    `}
                  >
                    {selectable && (
                      <td className="py-3.5 pl-6 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow?.(key, e.target.checked)}
                          className="w-4 h-4 rounded border-brand-border text-brand-caramel focus:ring-brand-caramel accent-brand-caramel cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 text-${col.align || 'left'} text-brand-textDark font-medium`}
                      >
                        {col.render ? col.render(item, index) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-6 py-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-textMuted bg-brand-cream/20">
          <div>
            Showing <span className="font-semibold text-brand-textDark">
              {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}
            </span> to{' '}
            <span className="font-semibold text-brand-textDark">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
            </span>{' '}
            of <span className="font-semibold text-brand-textDark">{pagination.totalItems}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg border border-brand-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-brand-textDark"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pagination.currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-semibold transition-all
                    ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-warm'
                        : 'border border-brand-border hover:bg-white text-brand-textDark'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}

            {pagination.totalPages > 5 && (
              <>
                <span className="px-1 text-brand-textMuted">...</span>
                <button
                  onClick={() => pagination.onPageChange(pagination.totalPages)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-semibold border border-brand-border hover:bg-white transition-colors text-brand-textDark
                    ${pagination.currentPage === pagination.totalPages ? 'bg-brand-primary text-white' : ''}
                  `}
                >
                  {pagination.totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-brand-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-brand-textDark"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
