"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

export type Column<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  data?: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: boolean;
  emptyMessage?: string;
};

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, index) => (
            <TableHead key={index} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-6">
              Loading...
            </TableCell>
          </TableRow>
        )}

        {error && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center py-6 text-red-500"
            >
              Failed to load data
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center py-6 text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          !error &&
          data?.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={cn(col.className)}
                >
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey])
                    : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
