'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon, MoreHorizontal, Download, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableProps<T> {
  title?: string;
  description?: string;
  columns: {
    key: keyof T | 'actions' | string;
    header: string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
  }[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  onFilter?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  title = '',
  description,
  columns,
  data = [],
  actions,
  onFilter,
  onExport,
  isLoading
}: DataTableProps<T>) {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold uppercase tracking-widest">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {onFilter && (
            <Button variant="outline" size="sm" onClick={onFilter} className="h-8 gap-2 text-xs uppercase font-bold tracking-widest">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="h-8 gap-2 text-xs uppercase font-bold tracking-widest">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={col.key ? String(col.key) : `col-${i}`} className={`uppercase text-[10px] font-bold tracking-widest text-muted-foreground ${col.className || ''}`}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((col, i) => (
                      <TableCell key={col.key ? `${row.id}-${String(col.key)}` : `${row.id}-col-${i}`} className="text-sm font-medium">
                        {col.cell ? col.cell(row) : (row[col.key as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-xs uppercase tracking-widest">
                    No data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
