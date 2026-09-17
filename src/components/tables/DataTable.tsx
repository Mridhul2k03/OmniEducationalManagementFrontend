import React, { useState, useMemo } from "react"
import { cn } from "../../lib/utils"
import { Search, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react"
import { Button } from "../ui/Button"
import { EmptyState } from "../feedback/EmptyState"

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  align?: "left" | "center" | "right"
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  pageSize?: number
  actionButton?: React.ReactNode
  onRowClick?: (item: T) => void
  emptyTitle?: string
  emptyDescription?: string
  exportFileName?: string
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  pageSize = 6,
  actionButton,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no items matching your criteria.",
  exportFileName = "export"
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const term = searchTerm.toLowerCase()
    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = item[k]
          return val ? String(val).toLowerCase().includes(term) : false
        })
      }
      return Object.values(item).some((v) =>
        v ? String(v).toLowerCase().includes(term) : false
      )
    })
  }, [data, searchTerm, searchKeys])

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      const comparison = aVal > bVal ? 1 : -1
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredData, sortKey, sortDirection])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const exportCSV = () => {
    if (sortedData.length === 0) return
    const headers = columns.map(c => c.key).join(",")
    const rows = sortedData.map(item => {
      return columns.map(c => {
        const val = (item as any)[c.key]
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
      }).join(",")
    })
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={searchPlaceholder}
            className="h-9.5 w-full pl-9 pr-4 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          {actionButton}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "px-4 py-3 select-none",
                      col.sortable && "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.className
                    )}
                  >
                    <div className={cn("inline-flex items-center gap-1.5", col.align === "right" && "justify-end")}>
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {sortedData.length}
              </span>{" "}
              entries
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
