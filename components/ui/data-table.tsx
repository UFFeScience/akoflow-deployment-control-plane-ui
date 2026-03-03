"use client"

import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableColumn {
  key: string
  label: string
  className?: string
}

interface DataTableProps {
  columns: DataTableColumn[]
  children: ReactNode
  isEmpty?: boolean
  isLoading?: boolean
  emptyLabel?: string
  loadingLabel?: string
  colSpan?: number
}

export function DataTable({
  columns,
  children,
  isEmpty = false,
  isLoading = false,
  emptyLabel = "No data yet.",
  loadingLabel = "Loading...",
  colSpan,
}: DataTableProps) {
  const span = colSpan ?? columns.length

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {columns.map((col) => (
              <TableHead key={col.key} className={`text-[11px] font-medium h-8 ${col.className ?? ""}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty || isLoading ? (
            <TableRow>
              <TableCell colSpan={span} className="h-24 text-center text-xs text-muted-foreground">
                {isLoading ? loadingLabel : emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  )
}
